import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { isSettingsReady, useAppSettings } from '../features/settings/settingsStore'
import { cn } from '../ui/cn'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-lg px-3 py-2 text-sm font-semibold transition',
    isActive ? 'bg-surface-elevated text-content-primary' : 'text-content-secondary hover:bg-surface-elevated',
  )

function AppLayout() {
  const location = useLocation()
  const { cdnBaseUrl, storageZoneName, storageAccessKey } = useAppSettings()
  const ready = isSettingsReady({
    cdnBaseUrl,
    storageZoneName,
    storageAccessKey,
  })

  if (!ready) {
    return <Navigate to="/setup" replace state={{ from: location.pathname }} />
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border-default bg-surface-header backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <NavLink to="/browse/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-surface-elevated text-lg">
              🐰
            </div>
            <div>
              <div className="text-sm font-semibold text-content-primary">Bunny Photo</div>
              <div className="text-xs text-content-muted">personal gallery</div>
            </div>
          </NavLink>
          <nav className="flex items-center gap-1">
            <NavLink to="/browse/" className={navLinkClass}>
              갤러리
            </NavLink>
            <NavLink to="/settings" className={navLinkClass}>
              설정
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
