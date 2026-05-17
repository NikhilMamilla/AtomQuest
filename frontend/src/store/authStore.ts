import { create } from 'zustand'
import axios from 'axios'

interface User {
  id: number
  email: string
  name: string
  role: 'employee' | 'manager' | 'admin'
  manager_id?: number
  department?: string
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  login: (token: string, user: User, role?: string) => void
  logout: () => void
  checkAuth: () => Promise<void>
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: true,

  login: (token, user) => {
    localStorage.setItem('token', token)
    set({ token, user, loading: false })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, user: null, loading: false })
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ token: null, user: null, loading: false })
      return
    }

    try {
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      set({ token, user: res.data, loading: false })
    } catch (err) {
      console.error('Failed to restore session:', (err as any).message)
      localStorage.removeItem('token')
      set({ token: null, user: null, loading: false })
    }
  }
}))