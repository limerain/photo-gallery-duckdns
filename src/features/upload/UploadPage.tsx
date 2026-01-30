import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAppSettings } from '../settings/settingsStore'
import { useUploadQueue } from './useUploadQueue'

const normalizePath = (path: string) => path.replace(/^\/+|\/+$/g, '')

function UploadPage() {
  const [searchParams] = useSearchParams()
  const initialPath = searchParams.get('path') ?? ''
  const [path, setPath] = useState(initialPath)
  const { storageZoneName, storageAccessKey } = useAppSettings()
  const { items, addFiles, clear, uploadAll } = useUploadQueue()
  const queryClient = useQueryClient()

  const hasItems = items.length > 0
  const uploadDisabled = useMemo(
    () => !storageZoneName || !storageAccessKey || !hasItems,
    [storageZoneName, storageAccessKey, hasItems],
  )

  const handleUpload = async () => {
    await uploadAll(
      { storageZoneName, storageAccessKey },
      normalizePath(path),
    )
    await queryClient.invalidateQueries({ queryKey: ['storage', 'list'] })
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h1 className="text-xl font-semibold text-white">업로드</h1>
        <p className="mt-2 text-sm text-zinc-400">
          파일을 선택하고 업로드 경로를 지정해줘.
        </p>
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-zinc-200">
            업로드 경로 (디렉토리)
            <input
              type="text"
              placeholder="예: photos/2026"
              value={path}
              onChange={(event) => setPath(event.target.value)}
              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-200">
            파일 선택
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              className="mt-2 w-full text-sm text-zinc-300"
              onChange={(event) => {
                if (event.target.files?.length) {
                  addFiles(event.target.files)
                  event.target.value = ''
                }
              }}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploadDisabled}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-500"
            >
              업로드 시작
            </button>
            <button
              type="button"
              onClick={clear}
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-500"
            >
              큐 비우기
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="text-lg font-semibold text-white">업로드 큐</h2>
        {!hasItems ? (
          <p className="mt-3 text-sm text-zinc-400">선택된 파일이 없어.</p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2"
              >
                <div className="truncate text-zinc-200">{item.file.name}</div>
                <span
                  className={[
                    'text-xs font-semibold',
                    item.status === 'success' && 'text-emerald-300',
                    item.status === 'error' && 'text-red-300',
                    item.status === 'uploading' && 'text-amber-300',
                    item.status === 'idle' && 'text-zinc-400',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {item.status === 'idle' && '대기'}
                  {item.status === 'uploading' && '업로드 중'}
                  {item.status === 'success' && '완료'}
                  {item.status === 'error' && '실패'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default UploadPage
