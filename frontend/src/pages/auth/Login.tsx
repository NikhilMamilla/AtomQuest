import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Target, Sun, Moon, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import { Button } from '../../components/common'

const DEMO_CREDS = [
  { label: 'Employee', email: 'sreemouna@atomquest.com', role: 'employee' },
  { label: 'Manager',  email: 'hansika@atomquest.com',  role: 'manager'  },
  { label: 'Admin',    email: 'nikhil@atomquest.com',     role: 'admin'    },
]

const ROLE_HOME: Record<string, string> = {
  employee: '/employee',
  manager:  '/manager',
  admin:    '/admin',
}

export default function Login() {
  const navigate  = useNavigate()
  const login     = useAuthStore(s => s.login)
  const { theme, toggleTheme } = useThemeStore()

  const [form,    setForm]    = useState({ email: '', password: '' })
  const [show,    setShow]    = useState(false)
  const [loading, setLoading] = useState(false)

  const fill = (email: string) =>
    setForm({ email, password: 'AtomQuest2026!' })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Fill in both fields')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.token, data.user, data.user.role)
      toast.success(`Welcome, ${data.user.name}!`)
      navigate(ROLE_HOME[data.user.role])
    } catch (err: any) {
      const apiMsg = err.response?.data?.error || err.response?.data?.message
      const errorMsg = apiMsg 
        ? (typeof apiMsg === 'object' ? JSON.stringify(apiMsg) : apiMsg)
        : (err.message || 'Login failed due to a server error')
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4 relative overflow-hidden font-body">
      {/* Top bar: Back to Home + Theme Toggle */}
      <div className="absolute top-6 left-6 z-20">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-surface-raised transition duration-200 backdrop-blur-md text-xs font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </button>
      </div>
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-surface-raised transition duration-200 backdrop-blur-md"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-warning" /> : <Moon className="w-5 h-5 text-primary" />}
        </button>
      </div>

      {/* Premium glowing background blobs matching design system core primary & accent */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Logo + title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-accent mb-4 shadow-xl shadow-primary/20">
            <Target className="w-7 h-7 text-primary-on animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary font-heading">AtomQuest</h1>
          <p className="text-sm text-text-secondary mt-1 font-body">Enterprise Goal-Tracking Portal · Hackathon 1.0</p>
        </div>

        {/* Demo quick-fill credentials panel with glowing borders */}
        <div className="bg-primary-subtle border border-primary/20 rounded-2xl p-4 mb-6 backdrop-blur-md font-body">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2.5">Demo credentials</p>
          <div className="flex gap-2">
            {DEMO_CREDS.map(c => (
              <button
                key={c.role}
                type="button"
                onClick={() => fill(c.email)}
                className="flex-1 text-xs py-2 rounded-xl border border-primary/10 bg-surface text-primary font-bold hover:bg-primary hover:text-primary-on hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-200"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form card using glassmorphic dark theme */}
        <form
          onSubmit={submit}
          className="bg-surface rounded-2xl shadow-2xl border border-border p-8 space-y-5 backdrop-blur-xl"
        >
          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-body">
              Email address
            </label>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="you@atomquest.com"
              className="w-full px-4 py-3 rounded-xl bg-bg border border-border text-text-primary text-sm placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition duration-200 font-body"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-body">
              Password
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-11 rounded-xl bg-bg border border-border text-text-primary text-sm placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition duration-200 font-body"
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit button with loader */}
          <Button
            type="submit"
            loading={loading}
            variant="primary"
            className="w-full py-3 text-sm font-semibold active:scale-[0.98]"
          >
            Sign in
          </Button>
        </form>

        <p className="text-center text-xs text-text-disabled mt-6 tracking-wide font-body">
          AtomQuest Hackathon 1.0 · All rights reserved
        </p>
      </div>
    </div>
  )
}
