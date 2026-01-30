import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAppSettings } from '../settings/settingsStore'
import { useUploadQueue } from './useUploadQueue'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Input } from '../../ui/Input'

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
    <div className="grid gap-4">
      <div className="px-1">
        <h1 className="text-2xl font-semibold text-white">업로드</h1>
        <p className="mt-2 text-sm text-zinc-400">
          이미지는 원본 + webp 썸네일(.thumb)로 같이 올라가.
        </p>
      </div>

      <Card className="p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <div className="text-sm font-semibold text-zinc-200">
              업로드 경로
            </div>
            <Input
              type="text"
              placeholder="예: photos/2026"
              value={path}
              onChange={(event) => setPath(event.target.value)}
            />
          </label>
          <label className="block">
            <div className="text-sm font-semibold text-zinc-200">파일 선택</div>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              className="mt-2 w-full text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-100 hover:file:bg-white/15"
              onChange={(event) => {
                if (event.target.files?.length) {
                  addFiles(event.target.files)
                  event.target.value = ''
                }
              }}
            />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={handleUpload}
            disabled={uploadDisabled}
            variant="primary"
          >
            업로드 시작
          </Button>
          <Button type="button" onClick={clear} variant="secondary">
            큐 비우기
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">업로드 큐</h2>
            <p className="mt-1 text-sm text-zinc-400">
              이미지면 썸네일 생성 시간이 조금 걸릴 수 있어.
            </p>
          </div>
          <div className="text-sm text-zinc-400">{items.length}개</div>
        </div>

        {!hasItems ? (
          <p className="mt-4 text-sm text-zinc-400">선택된 파일이 없어.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-black/20">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-zinc-100">
                    {item.file.name}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <div
                  className={[
                    'rounded-full px-2.5 py-1 text-xs font-semibold',
                    item.status === 'success' &&
                      'bg-emerald-500/15 text-emerald-200',
                    item.status === 'error' &&
                      'bg-red-500/15 text-red-200',
                    item.status === 'uploading' &&
                      'bg-amber-500/15 text-amber-200',
                    item.status === 'idle' &&
                      'bg-white/5 text-zinc-300',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {item.status === 'idle' && '대기'}
                  {item.status === 'uploading' && '업로드 중'}
                  {item.status === 'success' && '완료'}
                  {item.status === 'error' && '실패'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

export default UploadPage
