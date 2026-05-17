import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import EmployeeDashboard from './pages/employee/GoalSheet'
import ManagerDashboard from './pages/manager/TeamDashboard'
import AdminPanel from './pages/admin/AdminPanel'
import { useAuthBootstrap } from './hooks/useAuth'

export default function App() {
  const ready = useAuthBootstrap()

  if (!ready) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-text-primary font-body">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-text-secondary text-sm tracking-wider animate-pulse font-medium">
            Initializing AtomQuest...
          </p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
          }
        }} 
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/employee/*" element={
          <ProtectedRoute allowedRoles={['employee', 'manager', 'admin']}>
            <AppLayout>
              <EmployeeDashboard />
            </AppLayout>
          </ProtectedRoute>
        }/>
        
        <Route path="/manager/*" element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <AppLayout>
              <ManagerDashboard />
            </AppLayout>
          </ProtectedRoute>
        }/>
        
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout>
              <AdminPanel />
            </AppLayout>
          </ProtectedRoute>
        }/>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}