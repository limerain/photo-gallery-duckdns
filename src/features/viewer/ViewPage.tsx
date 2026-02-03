import { useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { buildCdnUrl, buildImageTransformUrl } from '../bunny/cdnUrl'
import { useAppSettings } from '../settings/settingsStore'
import { isImageFile, isVideoFile } from '../gallery/fileTypes'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'

type ScrollState = { path: string; scrollY: number; visibleCount: number }

function ViewPage() {
  const params = useParams()
  const path = params['*'] ?? ''
  const location = useLocation()
  const parentStack =
    (location.state as { parentStack?: ScrollState[] } | null)?.parentStack ?? []
  const top = parentStack[parentStack.length - 1]
  const { cdnBaseUrl, alwaysOriginal } = useAppSettings()
  const [forceOriginal, setForceOriginal] = useState(false)

  const name = path.split('/').pop() ?? ''
  const isImage = useMemo(() => isImageFile(name), [name])
  const isVideo = useMemo(() => isVideoFile(name), [name])
  const showOriginal = alwaysOriginal || forceOriginal

  if (!path) {
    return (
      <Card className="p-6 text-sm text-content-muted">
        파일을 선택해줘.
      </Card>
    )
  }

  const cdnUrl = buildCdnUrl(cdnBaseUrl, path)
  const optimizedUrl = buildImageTransformUrl(cdnBaseUrl, path, {
    width: 1600,
    quality: 80,
    autoOptimize: 'high',
  })

  return (
    <div className="space-y-4">
      <Card className="flex items-center justify-between gap-4 p-4">
        <div>
          <h1 className="text-lg font-semibold text-content-primary">뷰어</h1>
          <p className="mt-1 text-sm text-content-muted">{name}</p>
        </div>
        <Link
          to={`/browse/${top?.path ?? path.split('/').slice(0, -1).join('/')}`}
          state={
            top
              ? {
                  restoreScroll: true,
                  browseRestore: {
                    scrollY: top.scrollY,
                    visibleCount: top.visibleCount,
                  },
                  parentStack: parentStack.slice(0, -1),
                }
              : undefined
          }
          className="rounded-lg border border-border-default bg-surface-elevated px-3 py-2 text-sm font-semibold text-content-primary hover:bg-surface-elevated-hover"
        >
          목록으로
        </Link>
      </Card>

      {isImage ? (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-content-secondary">
              {showOriginal ? '원본' : '최적화'}
            </span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setForceOriginal((prev) => !prev)}
            >
              {showOriginal ? '최적화로 보기' : '원본 보기'}
            </Button>
          </div>
          <div className="mt-4 grid place-items-center">
            <img
              src={showOriginal ? cdnUrl : optimizedUrl}
              alt={name}
              className="max-h-[75vh] w-auto max-w-full rounded-xl border border-border-default bg-surface-media"
            />
          </div>
        </Card>
      ) : isVideo ? (
        <Card className="p-4">
          <video
            src={cdnUrl}
            controls
            className="max-h-[75vh] w-full rounded-xl border border-border-default bg-surface-base"
          />
        </Card>
      ) : (
        <Card className="p-6 text-sm text-content-muted">
          미리보기를 지원하지 않는 파일이야.
          <a className="ml-2 text-content-secondary underline" href={cdnUrl}>
            다운로드
          </a>
        </Card>
      )}
    </div>
  )
}

export default ViewPage
