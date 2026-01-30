import { useNavigate } from 'react-router-dom'
import { useAppSettings } from './settingsStore'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Toggle } from '../../ui/Toggle'

function SettingsPage() {
  const navigate = useNavigate()
  const {
    cdnBaseUrl,
    storageZoneName,
    alwaysOriginal,
    setAlwaysOriginal,
    reset,
  } = useAppSettings()

  const handleReset = () => {
    reset()
    navigate('/setup', { replace: true })
  }

  return (
    <div className="grid gap-4">
      <div className="px-1">
        <h1 className="text-2xl font-semibold text-white">설정</h1>
        <p className="mt-2 text-sm text-zinc-400">
          설정은 세션스토리지에만 저장돼.
        </p>
      </div>

      <Card className="p-6">
        <div className="text-sm font-semibold text-zinc-200">현재 설정</div>
        <div className="mt-3 space-y-2 text-sm text-zinc-300">
          <div className="flex items-center justify-between gap-4">
            <div className="text-zinc-500">CDN</div>
            <div className="truncate text-right">{cdnBaseUrl || '-'}</div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="text-zinc-500">Zone</div>
            <div className="truncate text-right">{storageZoneName || '-'}</div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-zinc-200">보기 옵션</div>
            <div className="mt-1 text-sm text-zinc-400">
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
        <div className="text-sm font-semibold text-red-200">초기화</div>
        <p className="mt-2 text-sm text-red-300/80">
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
