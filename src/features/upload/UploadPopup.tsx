import { UploadItem } from './useUploadQueue'
import { Button } from '../../ui/Button'

type UploadPopupProps = {
  items: UploadItem[]
  isStartDisabled: boolean
  onStart: () => void
  onCancelOrClose: () => void
}

const getTone = (items: UploadItem[]) => {
  const total = items.length
  const isUploading = items.some((item) => item.status === 'uploading')
  if (isUploading || total === 0) return 'neutral'
  if (items.some((item) => item.status === 'error')) return 'error'
  if (items.every((item) => item.status === 'success')) return 'success'
  return 'neutral'
}

const getProgressIndex = (items: UploadItem[]) => {
  const total = items.length
  if (!total) return 0
  const uploadingIndex = items.findIndex((item) => item.status === 'uploading')
  if (uploadingIndex >= 0) return uploadingIndex + 1
  if (items.every((item) => item.status === 'success')) return total
  if (items.some((item) => item.status === 'error')) return total
  return 0
}

const getStatusLabel = (items: UploadItem[]) => {
  if (!items.length) return '업로드 대기'
  const isUploading = items.some((item) => item.status === 'uploading')
  if (isUploading) return '업로드 중'
  if (items.some((item) => item.status === 'error')) return '업로드 실패'
  if (items.every((item) => item.status === 'success')) return '업로드 완료'
  return '업로드 대기'
}

function UploadPopup({
  items,
  isStartDisabled,
  onStart,
  onCancelOrClose,
}: UploadPopupProps) {
  const total = items.length
  const tone = getTone(items)
  const progressIndex = getProgressIndex(items)
  const statusLabel = getStatusLabel(items)
  const currentItem = items.find((item) => item.status === 'uploading')

  const percent = total ? Math.round((progressIndex / total) * 100) : 0
  const strokeWidth = 3
  const radius = 16
  const circumference = 2 * Math.PI * radius
  const dash = (percent / 100) * circumference

  const toneClass =
    tone === 'success'
      ? 'border-success-border bg-success-bg'
      : tone === 'error'
        ? 'border-danger-border bg-danger-bg'
        : 'border-border-default bg-surface-base/90'

  const ringColor =
    tone === 'success'
      ? 'var(--success-text)'
      : tone === 'error'
        ? 'var(--danger-text)'
        : 'var(--text-secondary)'

  return (
    <div
      className={`w-80 rounded-2xl border px-4 py-4 text-sm text-content-primary shadow-lg backdrop-blur ${toneClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <svg className="h-10 w-10" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r={radius}
              strokeWidth={strokeWidth}
              style={{ stroke: 'var(--border-default)' }}
              fill="none"
            />
            <circle
              cx="20"
              cy="20"
              r={radius}
              strokeWidth={strokeWidth}
              style={{ stroke: ringColor }}
              fill="none"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeLinecap="round"
              transform="rotate(-90 20 20)"
            />
          </svg>
          <div className="min-w-0">
            <div className="text-sm font-semibold">{statusLabel}</div>
            <div className="mt-1 text-xs text-content-secondary">
              {progressIndex}/{total || 0}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancelOrClose}
          className="grid h-7 w-7 place-items-center rounded-full border border-border-default text-xs text-content-secondary hover:bg-surface-elevated"
          aria-label="업로드 닫기"
        >
          ✕
        </button>
      </div>

      {currentItem ? (
        <div className="mt-3 truncate text-xs text-content-secondary">
          {currentItem.file.name}
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={onStart}
          disabled={isStartDisabled}
        >
          업로드 시작
        </Button>
      </div>
    </div>
  )
}

export default UploadPopup
