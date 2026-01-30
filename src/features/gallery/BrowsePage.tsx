import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { buildImageTransformUrl } from '../bunny/cdnUrl'
import { listDirectory, StorageEntry } from '../bunny/storageClient'
import { useAppSettings } from '../settings/settingsStore'
import { isImageFile, isVideoFile } from './fileTypes'

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

function BrowsePage() {
  const params = useParams()
  const path = params['*'] ?? ''
  const { cdnBaseUrl, storageZoneName, storageAccessKey } = useAppSettings()

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

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold text-white">갤러리</h1>
            <p className="text-sm text-zinc-400">/{path || ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/upload?path=${encodeURIComponent(path)}`}
              className="rounded-md bg-white px-3 py-1 text-sm font-semibold text-zinc-900"
            >
              이 경로에 업로드
            </Link>
            {path ? (
              <Link
                to={`/browse/${parentPath}`}
                className="rounded-md border border-zinc-700 px-3 py-1 text-sm text-zinc-200 hover:border-zinc-500"
              >
                상위로
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {query.isLoading ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
          불러오는 중...
        </div>
      ) : null}

      {query.isError ? (
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-sm text-red-200">
          목록을 불러오지 못했어.
        </div>
      ) : null}

      {query.data ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {query.data.map((entry) => {
            const name = entry.ObjectName ?? entry.Path ?? 'unknown'
            const entryPath = buildEntryPath(entry, path)
            const isDir = entry.IsDirectory
            const isImage = !isDir && isImageFile(name, entry.ContentType)
            const isVideo = !isDir && isVideoFile(name, entry.ContentType)

            if (isDir) {
              return (
                <Link
                  key={entryPath}
                  to={`/browse/${entryPath}`}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-600"
                >
                  <div className="text-2xl">📁</div>
                  <div className="mt-3 truncate text-sm font-medium text-zinc-200">
                    {name}
                  </div>
                </Link>
              )
            }

            return (
              <Link
                key={entryPath}
                to={`/view/${entryPath}`}
                className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-600"
              >
                <div className="aspect-square w-full bg-zinc-950">
                  {isImage ? (
                    <img
                      src={buildImageTransformUrl(cdnBaseUrl, entryPath, {
                        width: 320,
                        height: 320,
                        aspectRatio: '1:1',
                        quality: 70,
                        autoOptimize: 'high',
                      })}
                      alt={name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl">
                      {isVideo ? '🎬' : '📄'}
                    </div>
                  )}
                </div>
                <div className="px-3 py-2 text-sm text-zinc-200">
                  <div className="truncate">{name}</div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export default BrowsePage
