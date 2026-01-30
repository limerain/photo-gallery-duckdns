import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { buildCdnUrl, buildImageTransformUrl } from '../bunny/cdnUrl'
import { useAppSettings } from '../settings/settingsStore'
import { isImageFile, isVideoFile } from '../gallery/fileTypes'

function ViewPage() {
  const params = useParams()
  const path = params['*'] ?? ''
  const { cdnBaseUrl, alwaysOriginal } = useAppSettings()
  const [forceOriginal, setForceOriginal] = useState(false)

  const name = path.split('/').pop() ?? ''
  const isImage = useMemo(() => isImageFile(name), [name])
  const isVideo = useMemo(() => isVideoFile(name), [name])
  const showOriginal = alwaysOriginal || forceOriginal

  if (!path) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
        파일을 선택해줘.
      </div>
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
      <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div>
          <h1 className="text-lg font-semibold text-white">뷰어</h1>
          <p className="text-sm text-zinc-400">{name}</p>
        </div>
        <Link
          to={`/browse/${path.split('/').slice(0, -1).join('/')}`}
          className="rounded-md border border-zinc-700 px-3 py-1 text-sm text-zinc-200 hover:border-zinc-500"
        >
          목록으로
        </Link>
      </div>

      {isImage ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">
              {showOriginal ? '원본' : '최적화'}
            </span>
            <button
              type="button"
              onClick={() => setForceOriginal((prev) => !prev)}
              className="rounded-md border border-zinc-700 px-3 py-1 text-sm text-zinc-200 hover:border-zinc-500"
            >
              {showOriginal ? '최적화로 보기' : '원본 보기'}
            </button>
          </div>
          <div className="mt-4 flex justify-center">
            <img
              src={showOriginal ? cdnUrl : optimizedUrl}
              alt={name}
              className="max-h-[75vh] w-auto max-w-full rounded-lg"
            />
          </div>
        </div>
      ) : isVideo ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <video
            src={cdnUrl}
            controls
            className="max-h-[75vh] w-full rounded-lg bg-black"
          />
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
          미리보기를 지원하지 않는 파일이야.
          <a className="ml-2 text-zinc-200 underline" href={cdnUrl}>
            다운로드
          </a>
        </div>
      )}
    </div>
  )
}

export default ViewPage
