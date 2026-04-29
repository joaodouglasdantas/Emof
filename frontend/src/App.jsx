import { Routes, Route } from 'react-router-dom'
import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import Sidebar    from './components/Sidebar'
import Dashboard  from './pages/Dashboard'
import Meals      from './pages/Meals'
import Foods      from './pages/Foods'
import Weight     from './pages/Weight'
import Photos     from './pages/Photos'
import Insights   from './pages/Insights'
import Profile    from './pages/Profile'
import { getProfile } from './api'

const ToastCtx   = createContext(null)
const ProfileCtx = createContext(null)

export const useToast   = () => useContext(ToastCtx)
export const useProfile = () => useContext(ProfileCtx)

export default function App() {
  const [toast, setToast]     = useState(null)
  const [profile, setProfile] = useState(null)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }, [])

  const refreshProfile = useCallback(async () => {
    try { const p = await getProfile(); setProfile(p) } catch {}
  }, [])

  useEffect(() => { refreshProfile() }, [refreshProfile])

  return (
    <ToastCtx.Provider value={showToast}>
      <ProfileCtx.Provider value={{ profile, refreshProfile }}>
        <div className="layout">
          <Sidebar profile={profile} />
          <main className="main-content">
            <Routes>
              <Route path="/"          element={<Dashboard />} />
              <Route path="/refeicoes" element={<Meals />} />
              <Route path="/alimentos" element={<Foods />} />
              <Route path="/peso"      element={<Weight />} />
              <Route path="/fotos"     element={<Photos />} />
              <Route path="/insights"  element={<Insights />} />
              <Route path="/perfil"    element={<Profile />} />
            </Routes>
          </main>
          {toast && (
            <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
              {toast.type === 'success' ? '✅ ' : '❌ '}{toast.msg}
            </div>
          )}
        </div>
      </ProfileCtx.Provider>
    </ToastCtx.Provider>
  )
}
