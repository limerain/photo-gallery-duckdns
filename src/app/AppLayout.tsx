import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { isSettingsReady, useAppSettings } from '../features/settings/settingsStore'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-md px-3 py-2 text-sm font-medium',
    isActive ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:text-white',
  ].join(' ')

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
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <NavLink to="/browse/" className="text-lg font-semibold text-white">
            Bunny Photo
          </NavLink>
          <nav className="flex items-center gap-2">
            <NavLink to="/browse/" className={navLinkClass}>
              갤러리
            </NavLink>
            <NavLink to="/upload" className={navLinkClass}>
              업로드
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
