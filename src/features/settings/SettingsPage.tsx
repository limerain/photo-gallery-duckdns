import { useNavigate } from 'react-router-dom'
import { useAppSettings } from './settingsStore'

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
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h1 className="text-xl font-semibold text-white">설정</h1>
        <p className="mt-2 text-sm text-zinc-400">
          설정은 세션스토리지에만 저장돼.
        </p>
        <div className="mt-4 space-y-2 text-sm text-zinc-300">
          <div>
            <span className="text-zinc-500">CDN</span> {cdnBaseUrl || '-'}
          </div>
          <div>
            <span className="text-zinc-500">Zone</span> {storageZoneName || '-'}
          </div>
        </div>
      </section>
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="text-lg font-semibold text-white">보기 옵션</h2>
        <label className="mt-4 flex items-center justify-between">
          <span className="text-sm text-zinc-200">항상 원본 보기</span>
          <button
            type="button"
            onClick={() => setAlwaysOriginal(!alwaysOriginal)}
            className={[
              'relative inline-flex h-6 w-11 items-center rounded-full transition',
              alwaysOriginal ? 'bg-white' : 'bg-zinc-700',
            ].join(' ')}
          >
            <span
              className={[
                'inline-block h-4 w-4 rounded-full bg-zinc-900 transition',
                alwaysOriginal ? 'translate-x-6' : 'translate-x-1',
              ].join(' ')}
            />
          </button>
        </label>
      </section>
      <section className="rounded-xl border border-red-900/60 bg-red-950/30 p-6">
        <h2 className="text-lg font-semibold text-red-200">초기화</h2>
        <p className="mt-2 text-sm text-red-300/80">
          설정을 초기화하면 메인 화면으로 돌아가.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="mt-4 inline-flex items-center rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/20"
        >
          설정 초기화
        </button>
      </section>
    </div>
  )
}

export default SettingsPage
