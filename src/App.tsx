import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProjectListPage from './pages/ProjectListPage'
import LedgerPage from './pages/LedgerPage'
import CameraPage from './pages/CameraPage'
import GalleryPage from './pages/GalleryPage'

const MODE = import.meta.env.VITE_APP_MODE  // 'mobile' | 'pc' | undefined
export const IS_PC = MODE === 'pc'
export const IS_MOBILE = MODE === 'mobile'

const routes = (
  <Routes>
    <Route path="/" element={<ProjectListPage />} />
    <Route path="/ledger" element={<LedgerPage />} />
    {!IS_PC && <Route path="/camera" element={<CameraPage />} />}
    <Route path="/gallery" element={<GalleryPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
)

export default function App() {
  if (IS_PC) {
    return (
      <div className="w-screen h-screen bg-gray-100 overflow-hidden">
        <BrowserRouter>{routes}</BrowserRouter>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div
        className="relative bg-black overflow-hidden"
        style={{
          width: 'min(390px, 100vw)',
          height: 'min(844px, 100dvh)',
          borderRadius: 'clamp(0px, calc((100vw - 390px) * 9999), 28px)',
          boxShadow: '0 0 0 1px #444, 0 24px 80px rgba(0,0,0,0.7)',
        }}
      >
        <BrowserRouter>{routes}</BrowserRouter>
      </div>
    </div>
  )
}
