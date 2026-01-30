import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './app/AppLayout'
import BrowsePage from './features/gallery/BrowsePage'
import SettingsPage from './features/settings/SettingsPage'
import SetupPage from './features/settings/SetupPage'
import ViewPage from './features/viewer/ViewPage'

function App() {
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
