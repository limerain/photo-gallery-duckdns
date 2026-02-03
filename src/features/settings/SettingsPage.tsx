import { useNavigate } from 'react-router-dom'
import { themePresets, useAppSettings } from './settingsStore'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Toggle } from '../../ui/Toggle'
import { cn } from '../../ui/cn'

function SettingsPage() {
  const navigate = useNavigate()
  const {
    cdnBaseUrl,
    storageZoneName,
    alwaysOriginal,
    setAlwaysOriginal,
    theme,
    setTheme,
    reset,
  } = useAppSettings()

  const handleReset = () => {
    reset()
    navigate('/setup', { replace: true })
  }

  return (
    <div className="grid gap-4">
      <div className="px-1">
        <h1 className="text-2xl font-semibold text-content-primary">설정</h1>
        <p className="mt-2 text-sm text-content-muted">
          설정은 세션스토리지에만 저장돼.
        </p>
      </div>

      <Card className="p-6">
        <div className="text-sm font-semibold text-content-secondary">현재 설정</div>
        <div className="mt-3 space-y-2 text-sm text-content-secondary">
          <div className="flex items-center justify-between gap-4">
            <div className="text-content-muted">CDN</div>
            <div className="truncate text-right">{cdnBaseUrl || '-'}</div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="text-content-muted">Zone</div>
            <div className="truncate text-right">{storageZoneName || '-'}</div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-content-secondary">보기 옵션</div>
            <div className="mt-1 text-sm text-content-muted">
              기본 뷰어에서 원본을 항상 사용할지 선택해.
            </div>
          </div>
          <Toggle
            checked={alwaysOriginal}
            onCheckedChange={(v) => setAlwaysOriginal(v)}
          />
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-sm font-semibold text-content-secondary">테마</div>
        <div className="mt-1 text-sm text-content-muted">
          UI 테마를 선택해.
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {themePresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setTheme(preset.id)}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm font-medium transition',
                theme === preset.id
                  ? 'border-accent bg-accent text-accent-text'
                  : 'border-border-default bg-surface-elevated text-content-secondary hover:bg-surface-elevated-hover',
              )}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-sm font-semibold text-danger-text">초기화</div>
        <p className="mt-2 text-sm text-danger-text/80">
          설정을 초기화하면 초기 설정 화면으로 이동해.
        </p>
        <div className="mt-4">
          <Button variant="danger" onClick={handleReset}>
            설정 초기화
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default SettingsPage
