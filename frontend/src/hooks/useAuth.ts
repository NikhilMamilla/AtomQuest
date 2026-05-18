import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'

export function useAuthBootstrap() {
  const { token, login, logout } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // If no token exists, immediately set ready to true so the UI can load.
    // Fire off a non-blocking background ping to wake up the Render backend
    // from its free-tier sleep so that when the user logs in, it's already warm.
    if (!token) { 
      setReady(true)
      api.get('/health').catch(() => {}) 
      return 
    }
    api.get('/auth/me')
      .then(({ data }) => {
        login(token, data, data.role)
        setReady(true)
      })
      .catch((err) => {
        if (!err.response) {
          // Network connection failure (e.g. backend server offline)
          toast.error(`Connection Error: Unable to reach the backend server. ${err.message || ''}`, {
            id: 'network-connection-error',
            duration: 5000
          })
        } else if (err.response.status !== 401) {
          // Server error or database connectivity failure
          toast.error(`Session Verification Failed: ${err.response.data?.error || err.response.data?.message || 'Server error'}`)
        }
        logout()
        setReady(true)
      })
  }, [])

  return ready
}
