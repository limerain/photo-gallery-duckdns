import { useEffect, useRef, useState } from 'react'
import { uploadFile } from '../bunny/storageClient'
import { isImageFile } from '../gallery/fileTypes'
import { createWebpThumbnailFile } from './createWebpThumbnail'

export type UploadItem = {
  id: string
  file: File
  status: 'idle' | 'uploading' | 'success' | 'error'
  error?: string
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

const buildId = (file: File) =>
  `${file.name}-${file.size}-${file.lastModified}`

export const useUploadQueue = () => {
  const [items, setItems] = useState<UploadItem[]>([])
  const itemsRef = useRef(items)
  const abortRef = useRef<AbortController | null>(null)
  const cancelRequestedRef = useRef(false)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files).map((file) => ({
      id: buildId(file),
      file,
      status: 'idle' as const,
    }))
    setItems((prev) => [...prev, ...list])
  }

  const clear = () => setItems([])

  const cancel = () => {
    cancelRequestedRef.current = true
    abortRef.current?.abort()
  }

  const uploadAll = async (config: UploadConfig, path: string) => {
    cancelRequestedRef.current = false
    const controller = new AbortController()
    abortRef.current = controller

    for (const item of itemsRef.current) {
      if (cancelRequestedRef.current) break
      if (item.status === 'success') continue
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, status: 'uploading', error: undefined }
            : entry,
        ),
      )
      try {
        // 1) 원본 업로드
        await uploadFile(config, path, item.file, undefined, controller.signal)

        if (cancelRequestedRef.current) break

        // 2) 이미지면 webp 썸네일 생성 + 업로드 (Optimizer 없이 사용량 절감용)
        const isImage = isImageFile(item.file.name, item.file.type)
        if (isImage) {
          const thumbFile = await createWebpThumbnailFile(item.file, {
            maxSize: 256,
            quality: 0.7,
          })
          const thumbDir = joinPath(path, '.thumb')
          await uploadFile(config, thumbDir, thumbFile, undefined, controller.signal)
        }

        if (cancelRequestedRef.current) break

        setItems((prev) =>
          prev.map((entry) =>
            entry.id === item.id ? { ...entry, status: 'success' } : entry,
          ),
        )
      } catch (error) {
        if (cancelRequestedRef.current || controller.signal.aborted) {
          setItems((prev) =>
            prev.map((entry) =>
              entry.id === item.id
                ? { ...entry, status: 'error', error: '업로드 취소' }
                : entry,
            ),
          )
          break
        }
        setItems((prev) =>
          prev.map((entry) =>
            entry.id === item.id
              ? { ...entry, status: 'error', error: '업로드 실패' }
              : entry,
          ),
        )
      }
    }

    abortRef.current = null
  }

  return {
    items,
    addFiles,
    clear,
    uploadAll,
    cancel,
  }
}
