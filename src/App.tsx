import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './app/AppLayout'
import BrowsePage from './features/gallery/BrowsePage'
import SettingsPage from './features/settings/SettingsPage'
import SetupPage from './features/settings/SetupPage'
import { useAppSettings } from './features/settings/settingsStore'
import ViewPage from './features/viewer/ViewPage'

function App() {
  const theme = useAppSettings((s) => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/browse/" replace />} />
        <Route path="browse/*" element={<BrowsePage />} />
        <Route path="view/*" element={<ViewPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/browse/" replace />} />
    </Routes>
  )
}

export default App
