import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface Props {
  children: React.ReactNode
  allowedRoles: string[]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { token, user } = useAuthStore()
  const role = user?.role
  if (!token) return <Navigate to="/login" replace />
  if (role && !allowedRoles.includes(role)) return <Navigate to={`/${role}`} replace />
  return <>{children}</>
}