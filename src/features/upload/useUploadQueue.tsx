import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteFileResolved,
  resolveEndpoint,
  uploadFileResolved,
} from '../bunny/storageClient'
import { isImageFile } from '../gallery/fileTypes'
import { createWebpThumbnailFile } from './createWebpThumbnail'

export type UploadItem = {
  id: string
  file: File
  status: 'idle' | 'uploading' | 'success' | 'error'
  error?: string
  thumbStatus?: 'idle' | 'processing' | 'uploading' | 'success' | 'error'
  retryCount?: number
}

const normalizePath = (path: string) => path.replace(/^\/+|\/+$/g, '').trim()

const joinPath = (base: string, next: string) => {
  const a = normalizePath(base)
  const b = normalizePath(next)
  if (!a) return b
  if (!b) return a
  return `${a}/${b}`
}

type UploadConfig = {
  storageZoneName: string
  storageAccessKey: string
}

const UPLOAD_CONCURRENCY = 4
const THUMB_CONCURRENCY = 2
const MAX_RETRY = 3

const buildId = (file: File) =>
  `${file.name}-${file.size}-${file.lastModified}`

const getThumbFileName = (fileName: string) => {
  const lastDot = fileName.lastIndexOf('.')
  const base = lastDot > 0 ? fileName.slice(0, lastDot) : fileName
  return `${base}.webp`
}

const supportsWorkerThumbnail = () =>
  typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined'

const createLimiter = (max: number) => {
  let active = 0
  const queue: Array<() => void> = []

  const runNext = () => {
    active -= 1
    const next = queue.shift()
    if (next) next()
  }

  const runTask = <T,>(task: () => Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      const run = () => {
        active += 1
        task().then(resolve, reject).finally(runNext)
      }
      if (active < max) {
        run()
      } else {
        queue.push(run)
      }
    })

  return runTask
}

const createWebpThumbnailWithWorker = (
  file: File,
  options: { maxSize: number; quality: number },
  signal?: AbortSignal,
) =>
  new Promise<File>((resolve, reject) => {
    const worker = new Worker(
      new URL('./thumbnailWorker.ts', import.meta.url),
      { type: 'module' },
    )

    const cleanup = () => {
      signal?.removeEventListener('abort', onAbort)
      worker.terminate()
    }

    const onAbort = () => {
      cleanup()
      reject(new DOMException('aborted', 'AbortError'))
    }

    if (signal?.aborted) {
      cleanup()
      reject(new DOMException('aborted', 'AbortError'))
      return
    }

    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true })
    }

    worker.onmessage = (event) => {
      const data = event.data as
        | { ok: true; blob: Blob; fileName: string }
        | { ok: false; error: string }
      if (!data.ok) {
        cleanup()
        reject(new Error(data.error))
        return
      }
      const thumbFile = new File([data.blob], data.fileName, {
        type: 'image/webp',
      })
      cleanup()
      resolve(thumbFile)
    }

    worker.onerror = () => {
      cleanup()
      reject(new Error('worker-failed'))
    }

    worker.postMessage({ file, ...options })
  })

const createThumbnailFile = async (
  file: File,
  options: { maxSize: number; quality: number },
  signal?: AbortSignal,
) => {
  if (!supportsWorkerThumbnail()) {
    return await createWebpThumbnailFile(file, options)
  }
  try {
    return await createWebpThumbnailWithWorker(file, options, signal)
  } catch (error) {
    if (signal?.aborted) throw error
    return await createWebpThumbnailFile(file, options)
  }
}

export const useUploadQueue = () => {
  const [items, setItems] = useState<UploadItem[]>([])
  const itemsRef = useRef(items)
  const uploadStateRef = useRef(
    new Map<string, { originalUploaded: boolean; thumbUploaded: boolean }>(),
  )
  const retryCountRef = useRef(new Map<string, number>())
  const abortRef = useRef<AbortController | null>(null)
  const cancelRequestedRef = useRef(false)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files).map((file) => {
      const id = buildId(file)
      uploadStateRef.current.set(id, {
        originalUploaded: false,
        thumbUploaded: false,
      })
      retryCountRef.current.set(id, 0)
      return {
        id,
        file,
        status: 'idle' as const,
        thumbStatus: isImageFile(file.name, file.type)
          ? ('idle' as const)
          : undefined,
        retryCount: 0,
      }
    })
    setItems((prev) => [...prev, ...list])
  }

  const clear = useCallback(() => {
    uploadStateRef.current.clear()
    retryCountRef.current.clear()
    setItems([])
  }, [])

  const cancel = useCallback(() => {
    cancelRequestedRef.current = true
    abortRef.current?.abort()
  }, [])

  const runUploads = async (
    config: UploadConfig,
    path: string,
    targets: UploadItem[],
    mode: 'all' | 'retry',
  ) => {
    cancelRequestedRef.current = false
    const controller = new AbortController()
    abortRef.current = controller

    const updateItem = (
      id: string,
      updater: (entry: UploadItem) => UploadItem,
    ) => {
      setItems((prev) =>
        prev.map((entry) => (entry.id === id ? updater(entry) : entry)),
      )
    }

    const uploadLimit = createLimiter(UPLOAD_CONCURRENCY)
    const thumbLimit = createLimiter(THUMB_CONCURRENCY)
    const thumbDir = joinPath(path, '.thumb')
    const isRetry = mode === 'retry'
    const retryFailedOnce = new Set<string>()
    const rollbackTriggered = new Set<string>()

    let endpoint = ''
    try {
      endpoint = await resolveEndpoint(config)
    } catch {
      setItems((prev) =>
        prev.map((entry) =>
          entry.status === 'success'
            ? entry
            : { ...entry, status: 'error', error: '업로드 실패' },
        ),
      )
      abortRef.current = null
      return
    }
    const tasks: Array<Promise<void>> = []
    const completion = new Map<
      string,
      { originalDone: boolean; thumbDone: boolean }
    >()

    const bumpRetryCount = (id: string) => {
      const next = (retryCountRef.current.get(id) ?? 0) + 1
      retryCountRef.current.set(id, next)
      updateItem(id, (entry) => ({ ...entry, retryCount: next }))
      return next
    }

    const rollbackUploaded = async (item: UploadItem) => {
      const state =
        uploadStateRef.current.get(item.id) ?? {
          originalUploaded: false,
          thumbUploaded: false,
        }
      uploadStateRef.current.set(item.id, state)
      const deletions: Array<Promise<void>> = []
      if (state.originalUploaded) {
        deletions.push(
          deleteFileResolved(
            endpoint,
            config,
            path,
            item.file.name,
            controller.signal,
          ),
        )
      }
      if (state.thumbUploaded) {
        deletions.push(
          deleteFileResolved(
            endpoint,
            config,
            thumbDir,
            getThumbFileName(item.file.name),
            controller.signal,
          ),
        )
      }
      await Promise.allSettled(deletions)
      state.originalUploaded = false
      state.thumbUploaded = false
    }

    const handleRetryFailure = async (item: UploadItem) => {
      if (!isRetry) return false
      if (retryFailedOnce.has(item.id)) return false
      retryFailedOnce.add(item.id)
      const next = bumpRetryCount(item.id)
      if (next >= MAX_RETRY && !rollbackTriggered.has(item.id)) {
        rollbackTriggered.add(item.id)
        await rollbackUploaded(item)
        return true
      }
      return false
    }

    for (const item of targets) {
      if (cancelRequestedRef.current) break
      if (item.status === 'success') continue

      const isImage = isImageFile(item.file.name, item.file.type)
      const state =
        uploadStateRef.current.get(item.id) ?? {
          originalUploaded: false,
          thumbUploaded: false,
        }
      uploadStateRef.current.set(item.id, state)
      completion.set(item.id, {
        originalDone: state.originalUploaded,
        thumbDone: isImage ? state.thumbUploaded : true,
      })

      if (state.originalUploaded && (!isImage || state.thumbUploaded)) {
        updateItem(item.id, (entry) => ({
          ...entry,
          status: 'success',
          thumbStatus: isImage ? 'success' : entry.thumbStatus,
        }))
        continue
      }

      const needsOriginal = !state.originalUploaded
      const needsThumb = isImage && !state.thumbUploaded

      if (needsOriginal || needsThumb) {
        updateItem(item.id, (entry) => ({
          ...entry,
          status: 'uploading',
          error: undefined,
        }))
      }

      if (needsOriginal) {
        tasks.push(
          uploadLimit(async () => {
            if (cancelRequestedRef.current) return
            if (rollbackTriggered.has(item.id)) return
            try {
              await uploadFileResolved(
                endpoint,
                config,
                path,
                item.file,
                undefined,
                controller.signal,
              )
              if (cancelRequestedRef.current) return
              if (rollbackTriggered.has(item.id)) {
                await deleteFileResolved(
                  endpoint,
                  config,
                  path,
                  item.file.name,
                  controller.signal,
                )
                return
              }
              const state = completion.get(item.id)
              if (state) {
                state.originalDone = true
              }
              const uploadState =
                uploadStateRef.current.get(item.id) ?? {
                  originalUploaded: false,
                  thumbUploaded: false,
                }
              uploadState.originalUploaded = true
              uploadStateRef.current.set(item.id, uploadState)
              updateItem(item.id, (entry) => {
                if (entry.status === 'error') return entry
                if (state?.thumbDone) {
                  return { ...entry, status: 'success' }
                }
                return { ...entry, status: 'uploading' }
              })
            } catch {
              if (cancelRequestedRef.current || controller.signal.aborted) {
                updateItem(item.id, (entry) => ({
                  ...entry,
                  status: 'error',
                  error: '업로드 취소',
                }))
                return
              }
              const rolledBack = await handleRetryFailure(item)
              updateItem(item.id, (entry) => ({
                ...entry,
                status: 'error',
                error: '업로드 실패',
                thumbStatus:
                  rolledBack && isImage ? 'error' : entry.thumbStatus,
              }))
              if (rolledBack) return
            }
          }),
        )
      }

      if (!isImage) continue

      if (needsThumb) {
        tasks.push(
          thumbLimit(async () => {
            if (cancelRequestedRef.current) return
            if (rollbackTriggered.has(item.id)) return
            updateItem(item.id, (entry) => ({
              ...entry,
              thumbStatus: 'processing',
            }))
            try {
              const thumbFile = await createThumbnailFile(
                item.file,
                { maxSize: 256, quality: 0.7 },
                controller.signal,
              )
              if (cancelRequestedRef.current) return
              if (rollbackTriggered.has(item.id)) return
              updateItem(item.id, (entry) => ({
                ...entry,
                thumbStatus: 'uploading',
              }))
              await uploadFileResolved(
                endpoint,
                config,
                thumbDir,
                thumbFile,
                undefined,
                controller.signal,
              )
              if (cancelRequestedRef.current) return
              if (rollbackTriggered.has(item.id)) {
                await deleteFileResolved(
                  endpoint,
                  config,
                  thumbDir,
                  thumbFile.name,
                  controller.signal,
                )
                return
              }
              const state = completion.get(item.id)
              if (state) {
                state.thumbDone = true
              }
              const uploadState =
                uploadStateRef.current.get(item.id) ?? {
                  originalUploaded: false,
                  thumbUploaded: false,
                }
              uploadState.thumbUploaded = true
              uploadStateRef.current.set(item.id, uploadState)
              updateItem(item.id, (entry) => {
                if (entry.status === 'error') {
                  return { ...entry, thumbStatus: 'success' }
                }
                if (state?.originalDone) {
                  return { ...entry, status: 'success', thumbStatus: 'success' }
                }
                return { ...entry, status: 'uploading', thumbStatus: 'success' }
              })
            } catch {
              if (cancelRequestedRef.current || controller.signal.aborted) {
                updateItem(item.id, (entry) => ({
                  ...entry,
                  thumbStatus: 'error',
                  status: entry.status === 'error' ? entry.status : 'error',
                }))
                return
              }
              const rolledBack = await handleRetryFailure(item)
              updateItem(item.id, (entry) => ({
                ...entry,
                thumbStatus: 'error',
                status: entry.status === 'error' ? entry.status : 'error',
              }))
              if (rolledBack) return
            }
          }),
        )
      }
    }

    await Promise.allSettled(tasks)

    abortRef.current = null
  }

  const uploadAll = async (config: UploadConfig, path: string) => {
    const targets = itemsRef.current.filter((item) => {
      if (item.status === 'success') return false
      const retryCount = retryCountRef.current.get(item.id) ?? 0
      if (item.status === 'error' && retryCount >= MAX_RETRY) return false
      return true
    })
    if (!targets.length) return
    await runUploads(config, path, targets, 'all')
  }

  const retryFailed = async (config: UploadConfig, path: string) => {
    const targets = itemsRef.current.filter((item) => {
      if (item.status !== 'error') return false
      const retryCount = retryCountRef.current.get(item.id) ?? 0
      return retryCount < MAX_RETRY
    })
    if (!targets.length) return
    await runUploads(config, path, targets, 'retry')
  }

  return {
    items,
    addFiles,
    clear,
    uploadAll,
    retryFailed,
    cancel,
  }
}
