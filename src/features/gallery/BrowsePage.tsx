import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { buildCdnUrl } from '../bunny/cdnUrl'
import { listDirectory, StorageEntry, uploadFile } from '../bunny/storageClient'
import { useAppSettings } from '../settings/settingsStore'
import { isImageFile, isVideoFile } from './fileTypes'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { useUploadQueue } from '../upload/useUploadQueue'
import UploadPopup from '../upload/UploadPopup'

const buildEntryPath = (entry: StorageEntry, currentPath: string) => {
  const name = entry.ObjectName ?? ''
  if (!name) {
    return entry.Path?.replace(/^\/+/, '') ?? ''
  }
  return currentPath ? `${currentPath}/${name}` : name
}

const getParentPath = (path: string) => {
  const trimmed = path.replace(/^\/+|\/+$/g, '')
  if (!trimmed) return ''
  const parts = trimmed.split('/')
  parts.pop()
  return parts.join('/')
}

const normalizePath = (path: string) => path.replace(/^\/+|\/+$/g, '').trim()

const joinPath = (base: string, next: string) => {
  const a = normalizePath(base)
  const b = normalizePath(next)
  if (!a) return b
  if (!b) return a
  return `${a}/${b}`
}

const getBaseName = (fileName: string) => {
  const lastDot = fileName.lastIndexOf('.')
  return lastDot > 0 ? fileName.slice(0, lastDot) : fileName
}

const getDirName = (fullPath: string) => {
  const trimmed = fullPath.replace(/^\/+|\/+$/g, '')
  if (!trimmed) return ''
  const parts = trimmed.split('/')
  parts.pop()
  return parts.join('/')
}

const buildThumbPath = (entryPath: string) => {
  const fileName = entryPath.split('/').pop() ?? ''
  const base = getBaseName(fileName)
  const dir = getDirName(entryPath)
  const thumbFileName = `${base}.webp`
  return dir ? `${dir}/.thumb/${thumbFileName}` : `.thumb/${thumbFileName}`
}

function Thumb({
  src,
  alt,
  fallback,
}: {
  src: string
  alt: string
  fallback: string
}) {
  const [ok, setOk] = useState(true)
  if (!ok) {
    return (
      <div className="grid h-full w-full place-items-center text-3xl text-content-muted">
        {fallback}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      loading="lazy"
      onError={() => setOk(false)}
    />
  )
}

function BrowsePage() {
  const params = useParams()
  const path = params['*'] ?? ''
  const location = useLocation()
  const navigate = useNavigate()
  const { cdnBaseUrl, storageZoneName, storageAccessKey } = useAppSettings()
  const [visibleCount, setVisibleCount] = useState(40)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false)
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const userScrolledRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const dirInputRef = useRef<HTMLInputElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)
  const uploadMenuRef = useRef<HTMLDivElement | null>(null)
  const visibleCountRef = useRef(visibleCount)
  visibleCountRef.current = visibleCount
  const queryClient = useQueryClient()
  const { items, addFiles, clear, uploadAll, retryFailed, cancel } =
    useUploadQueue()

  // path 변경 시 업로드 큐 초기화
  useEffect(() => {
    cancel()
    clear()
    setIsUploadOpen(false)
  }, [path, cancel, clear])

  const query = useQuery({
    queryKey: ['storage', 'list', path, storageZoneName],
    queryFn: () =>
      listDirectory(
        {
          storageZoneName,
          storageAccessKey,
        },
        path,
      ),
    enabled: Boolean(storageZoneName && storageAccessKey),
  })

  const parentPath = getParentPath(path)

  type ScrollState = { path: string; scrollY: number; visibleCount: number }
  const locationState = location.state as {
    parentStack?: ScrollState[]
    restoreScroll?: boolean
    browseRestore?: { scrollY: number; visibleCount: number }
  } | null
  const parentStack = locationState?.parentStack ?? []

  const entries = query.data ?? []
  const visibleEntries = useMemo(
    () => entries.slice(0, visibleCount),
    [entries, visibleCount],
  )

  const handleOpenCreateFolder = () => {
    setFolderName('')
    setIsCreateFolderOpen(true)
    setTimeout(() => folderInputRef.current?.focus(), 0)
  }

  const handleCloseCreateFolder = () => {
    setIsCreateFolderOpen(false)
    setFolderName('')
  }

  const handleCreateFolder = async () => {
    const normalized = normalizePath(folderName)
    if (!normalized) return

    setIsCreatingFolder(true)
    try {
      const keepFile = new File([new Uint8Array()], '.keep', {
        type: 'text/plain',
      })
      await uploadFile(
        { storageZoneName, storageAccessKey },
        joinPath(path, normalized),
        keepFile,
      )
      await queryClient.invalidateQueries({ queryKey: ['storage', 'list'] })
      handleCloseCreateFolder()
    } finally {
      setIsCreatingFolder(false)
    }
  }

  // view 또는 하위 폴더에서 복귀 시 스크롤/visibleCount 복원
  useEffect(() => {
    const shouldRestore =
      locationState?.restoreScroll && locationState.browseRestore
    if (!shouldRestore) {
      // 복원 상태가 없으면 기존 동작: visibleCount 리셋
      setVisibleCount(40)
      userScrolledRef.current = false
      return
    }

    const { scrollY, visibleCount: savedCount } = locationState.browseRestore!
    setVisibleCount(Math.max(40, savedCount))

    // DOM이 반영된 후 스크롤 복원
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY)
      })
    })

    // state 1회성 소비: parentStack만 유지하고 나머지 제거
    window.history.replaceState({ parentStack }, '')
  }, [location.state, path, locationState, parentStack])

  useEffect(() => {
    const markScrolled = () => {
      userScrolledRef.current = true
    }
    window.addEventListener('scroll', markScrolled, { passive: true })
    window.addEventListener('touchmove', markScrolled, { passive: true })
    return () => {
      window.removeEventListener('scroll', markScrolled)
      window.removeEventListener('touchmove', markScrolled)
    }
  }, [])

  // 업로드 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!isUploadMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(e.target as Node)) {
        setIsUploadMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isUploadMenuOpen])

  const handleUploadMenuToggle = () => {
    setIsUploadMenuOpen((prev) => !prev)
  }

  const handleUploadPick = () => {
    setIsUploadMenuOpen(false)
    fileInputRef.current?.click()
  }

  const handleFolderPick = () => {
    setIsUploadMenuOpen(false)
    dirInputRef.current?.click()
  }

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      clear()
      addFiles(event.target.files)
      setIsUploadOpen(true)
      event.target.value = ''
    }
  }

  const handleStartUpload = async () => {
    const hasUploading = items.some((item) => item.status === 'uploading')
    const hasIdle = items.some((item) => item.status === 'idle')
    const hasError = items.some((item) => item.status === 'error')
    if (hasError && !hasIdle && !hasUploading) {
      await retryFailed({ storageZoneName, storageAccessKey }, path)
      await queryClient.invalidateQueries({ queryKey: ['storage', 'list'] })
      return
    }
    await uploadAll({ storageZoneName, storageAccessKey }, path)
    await queryClient.invalidateQueries({ queryKey: ['storage', 'list'] })
  }

  const handleCloseUpload = () => {
    const isUploading = items.some((item) => item.status === 'uploading')
    if (isUploading) {
      cancel()
    }
    clear()
    setIsUploadOpen(false)
  }

  const hasItems = items.length > 0
  const hasUploading = items.some((item) => item.status === 'uploading')
  const canStart = items.some((item) => item.status !== 'success')
  const uploadDisabled =
    !storageZoneName || !storageAccessKey || !hasItems || hasUploading || !canStart

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (items) => {
        const entry = items[0]
        if (!entry?.isIntersecting) return

        // sentinel이 초기 렌더 직후 화면에 들어오는 케이스(=스크롤 없이 연속 로드) 방지
        if (!userScrolledRef.current) return
        userScrolledRef.current = false

        setVisibleCount((prev) =>
          Math.min(prev + 40, entries.length || prev + 40),
        )
      },
      { rootMargin: '200px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [entries.length])

  return (
    <div className="space-y-4">
      <Card className="sticky top-0 z-20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-content-primary">갤러리</h1>
            <p className="mt-1 text-sm text-content-muted">/{path || ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={handleOpenCreateFolder}>
              폴더 만들기
            </Button>
            <div ref={uploadMenuRef} className="relative">
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={handleUploadMenuToggle}
              >
                이 경로에 업로드
              </Button>
              {isUploadMenuOpen && (
                <div className="absolute right-0 top-full z-30 mt-1 w-36 rounded-lg border border-border-default bg-[var(--bg-base)] py-1 shadow-lg">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-content-primary hover:bg-surface-elevated-hover"
                    onClick={handleUploadPick}
                  >
                    파일 선택
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-content-primary hover:bg-surface-elevated-hover"
                    onClick={handleFolderPick}
                  >
                    폴더 선택
                  </button>
                </div>
              )}
            </div>
            {path ? (
              <Link
                to={`/browse/${parentPath}`}
                state={(() => {
                  const top = parentStack[parentStack.length - 1]
                  if (!top || top.path !== parentPath) return undefined
                  const remainingStack = parentStack.slice(0, -1)
                  return {
                    restoreScroll: true,
                    browseRestore: {
                      scrollY: top.scrollY,
                      visibleCount: top.visibleCount,
                    },
                    parentStack: remainingStack,
                  }
                })()}
                className="inline-flex h-9 items-center rounded-lg border border-border-default bg-surface-elevated px-3 text-sm font-semibold text-content-primary hover:bg-surface-elevated-hover"
              >
                상위로
              </Link>
            ) : null}
          </div>
        </div>
      </Card>

      {query.isLoading ? (
        <Card className="p-6 text-sm text-content-muted">불러오는 중...</Card>
      ) : null}

      {query.isError ? (
        <Card className="border-danger-border bg-danger-bg p-6 text-sm text-danger-text">
          목록을 불러오지 못했어.
        </Card>
      ) : null}

      {entries.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(190px,1fr))]">
          {visibleEntries.map((entry) => {
            const name = entry.ObjectName ?? entry.Path ?? 'unknown'
            const entryPath = buildEntryPath(entry, path)
            const isDir = entry.IsDirectory
            const isImage = !isDir && isImageFile(name, entry.ContentType)
            const isVideo = !isDir && isVideoFile(name, entry.ContentType)

            if (isDir) {
              if (name === '.thumb') return null
              return (
                <Link
                  key={entryPath}
                  to={`/browse/${entryPath}`}
                  state={{
                    parentStack: [
                      ...parentStack,
                      {
                        path,
                        scrollY: window.scrollY,
                        visibleCount: visibleCountRef.current,
                      },
                    ],
                  }}
                  className="group rounded-2xl border border-border-default bg-surface-elevated p-4 transition hover:bg-surface-elevated-hover"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface-elevated text-xl">
                    📁
                  </div>
                  <div className="mt-3 truncate text-sm font-semibold text-content-primary">
                    {name}
                  </div>
                  <div className="mt-1 text-xs text-content-muted">폴더</div>
                </Link>
              )
            }

            if (name === '.keep') return null

            return (
              <button
                type="button"
                key={entryPath}
                onClick={() => {
                  navigate(`/view/${entryPath}`, {
                    state: {
                      parentStack: [
                        ...parentStack,
                        {
                          path,
                          scrollY: window.scrollY,
                          visibleCount: visibleCountRef.current,
                        },
                      ],
                    },
                  })
                }}
                className="group overflow-hidden rounded-2xl border border-border-default bg-surface-elevated text-left transition hover:bg-surface-elevated-hover"
              >
                <div className="aspect-square w-full bg-surface-media">
                  {isImage ? (
                    <Thumb
                      src={buildCdnUrl(cdnBaseUrl, buildThumbPath(entryPath))}
                      alt={name}
                      fallback="🖼️"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-3xl text-content-muted">
                      {isVideo ? '🎬' : '📄'}
                    </div>
                  )}
                </div>
                <div className="px-3 py-3">
                  <div className="truncate text-sm font-semibold text-content-primary">
                    {name}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      ) : null}

      {entries.length > visibleCount ? (
        <div className="flex items-center justify-center py-6">
          <Button
            type="button"
            onClick={() =>
              setVisibleCount((prev) => Math.min(prev + 40, entries.length))
            }
          >
            더 불러오기
          </Button>
        </div>
      ) : null}

      <div ref={sentinelRef} />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFilesSelected}
      />
      <input
        ref={dirInputRef}
        type="file"
        multiple
        // @ts-expect-error webkitdirectory is non-standard but widely supported
        webkitdirectory=""
        className="hidden"
        onChange={handleFilesSelected}
      />

      {isUploadOpen && hasItems ? (
        <div className="fixed bottom-6 right-6 z-50">
          <UploadPopup
            items={items}
            isStartDisabled={uploadDisabled}
            onStart={handleStartUpload}
            onCancelOrClose={handleCloseUpload}
          />
        </div>
      ) : null}

      {isCreateFolderOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-overlay">
          <Card className="w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-content-primary">폴더 만들기</h2>
            <input
              ref={folderInputRef}
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCreatingFolder) {
                  handleCreateFolder()
                } else if (e.key === 'Escape') {
                  handleCloseCreateFolder()
                }
              }}
              placeholder="폴더 이름을 입력하세요"
              className="mt-4 w-full rounded-lg border border-border-default bg-surface-elevated px-3 py-2 text-sm text-content-primary placeholder-content-muted outline-none focus:border-border-hover"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleCloseCreateFolder}
                disabled={isCreatingFolder}
              >
                취소
              </Button>
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={handleCreateFolder}
                disabled={!folderName.trim() || isCreatingFolder}
              >
                {isCreatingFolder ? '생성 중...' : '만들기'}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}

export default BrowsePage
