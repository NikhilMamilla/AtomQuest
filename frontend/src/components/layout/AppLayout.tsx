import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Target, TrendingUp, Users, Shield, Sun, Moon, BarChart3, MessageSquare, Award, Clock, CalendarRange, AlertTriangle, PieChart, ScrollText, Menu, X, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import toast from 'react-hot-toast'
import EmailSimulationDrawer from './EmailSimulationDrawer'


interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

interface Props {
  navItems?: NavItem[]
  children: React.ReactNode
}

export default function AppLayout({ navItems, children }: Props) {
  const { user, logout } = useAuthStore()
  const role = user?.role
  const navigate = useNavigate()
  const { theme, toggleTheme } = useThemeStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const roleColor: Record<string, string> = {
    employee: 'bg-primary-subtle text-primary border border-primary/20',
    manager:  'bg-warning-bg text-warning border border-warning/20',
    admin:    'bg-info-bg text-info border border-info/20',
  }

  // Dynamic navigation items based on role
  const defaultNavItems: NavItem[] = []

  if (role === 'employee') {
    defaultNavItems.push(
      {
        to: '/employee',
        label: 'My Goals',
        icon: <TrendingUp className="w-4 h-4" />
      },
      {
        to: '/employee/checkin',
        label: 'Quarterly Check-in',
        icon: <Clock className="w-4 h-4" />
      },
      {
        to: '/employee/insights',
        label: 'Goal Insights',
        icon: <BarChart3 className="w-4 h-4" />
      },
      {
        to: '/employee/feedback',
        label: 'Manager Feedback',
        icon: <MessageSquare className="w-4 h-4" />
      },
      {
        to: '/employee/appraisal',
        label: 'Appraisal Board',
        icon: <Award className="w-4 h-4" />
      }
    )
  } else if (role === 'manager') {
    defaultNavItems.push(
      {
        to: '/employee',
        label: 'My Goals',
        icon: <TrendingUp className="w-4 h-4" />
      },
      {
        to: '/employee/checkin',
        label: 'Quarterly Check-in',
        icon: <Clock className="w-4 h-4" />
      },
      {
        to: '/employee/insights',
        label: 'Goal Insights',
        icon: <BarChart3 className="w-4 h-4" />
      },
      {
        to: '/employee/feedback',
        label: 'Supervisor Feedback',
        icon: <MessageSquare className="w-4 h-4" />
      },
      {
        to: '/employee/appraisal',
        label: 'Appraisal Board',
        icon: <Award className="w-4 h-4" />
      },
      {
        to: '/manager',
        label: 'Team Approvals',
        icon: <CheckCircle2 className="w-4 h-4" />
      },
      {
        to: '/manager/checkins',
        label: 'Team Check-ins',
        icon: <CalendarRange className="w-4 h-4" />
      },
      {
        to: '/manager/analytics',
        label: 'Team Analytics',
        icon: <PieChart className="w-4 h-4" />
      }
    )
  } else if (role === 'admin') {
    defaultNavItems.push(
      {
        to: '/admin',
        label: 'Users',
        icon: <Users className="w-4 h-4" />
      },
      {
        to: '/admin/goals',
        label: 'Org Goals',
        icon: <Target className="w-4 h-4" />
      },
      {
        to: '/admin/checkins',
        label: 'Org Check-ins',
        icon: <CalendarRange className="w-4 h-4" />
      },
      {
        to: '/admin/reports',
        label: 'Reports',
        icon: <BarChart3 className="w-4 h-4" />
      },
      {
        to: '/admin/escalations',
        label: 'Escalations',
        icon: <AlertTriangle className="w-4 h-4" />
      },
      {
        to: '/admin/analytics',
        label: 'Analytics',
        icon: <PieChart className="w-4 h-4" />
      },
      {
        to: '/admin/audit',
        label: 'Audit Log',
        icon: <ScrollText className="w-4 h-4" />
      },
      {
        to: '/employee',
        label: 'My Goals',
        icon: <TrendingUp className="w-4 h-4" />
      },
      {
        to: '/employee/checkin',
        label: 'My Check-in',
        icon: <Clock className="w-4 h-4" />
      }
    )
  }

  const activeNavItems = navItems || defaultNavItems

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg text-text-primary font-body">
      
      {/* ── Mobile Header Bar (Sticky Top) ── */}
      <div className="flex md:hidden items-center justify-between h-14 px-4 bg-surface border-b border-border sticky top-0 z-10 shadow-sm shadow-black/5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 rounded-lg hover:bg-surface-raised border border-border/60 text-text-secondary hover:text-text-primary transition-colors"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Target className="w-4 h-4 text-primary-on" />
            </div>
            <span className="font-semibold text-text-primary text-sm tracking-wider font-heading">AtomQuest</span>
          </div>
        </div>
        
        <button
          onClick={toggleTheme}
          className="p-1.5 bg-surface-raised border border-border hover:bg-primary-subtle text-text-secondary hover:text-primary rounded-lg transition-all"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-primary" />}
        </button>
      </div>

      {/* ── Desktop Sidebar - Prinstine and untouched, hidden md:flex ── */}
      <aside className="hidden md:flex w-60 h-screen sticky top-0 bg-surface border-r border-border flex-col shrink-0 overflow-hidden">
        {/* Brand/Header with Bricolage display font */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Target className="w-4 h-4 text-primary-on animate-pulse" />
          </div>
          <span className="font-semibold text-text-primary text-sm tracking-wider font-heading">AtomQuest</span>
        </div>

        {/* Nav links using Geist body font and dynamic theme states */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-hidden">
          {activeNavItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/employee' || item.to === '/manager' || item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 font-body ${
                  isActive
                    ? 'bg-primary-subtle text-primary font-semibold border-l-2 border-primary shadow-md shadow-primary-subtle/25'
                    : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary'
                }`
              }
            >
              <span className="w-4 h-4 shrink-0 flex items-center justify-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User profile footer - clean variables, no hardcoded colors */}
        <div className="p-3 border-t border-border bg-surface font-body">
          <div className="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-border pb-2">
            <span className="text-xs font-semibold text-text-secondary">Theme</span>
            <button
              onClick={toggleTheme}
              className="p-1.5 bg-surface-raised border border-border hover:bg-primary-subtle text-text-secondary hover:text-primary rounded-lg transition-all"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-warning" /> : <Moon className="w-3.5 h-3.5 text-primary" />}
            </button>
          </div>
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-primary-subtle border border-primary flex items-center justify-center text-xs font-bold text-primary font-numeric shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex items-center gap-2 flex-1">
              <p className="text-xs font-extrabold text-text-primary truncate shrink" title={user?.name}>
                {user?.name}
              </p>
              <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider shrink-0 border ${roleColor[role!] || 'bg-surface-raised text-text-secondary'}`}>
                {role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-danger hover:bg-danger-bg rounded-lg transition-colors font-body"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile Sidebar Drawer overlaybackdrop ── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar Drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-surface border-r border-border flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Target className="w-4 h-4 text-primary-on" />
            </div>
            <span className="font-semibold text-text-primary text-sm tracking-wider font-heading">AtomQuest</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-raised rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {activeNavItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/employee' || item.to === '/manager' || item.to === '/admin'}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 font-body ${
                  isActive
                    ? 'bg-primary-subtle text-primary font-semibold border-l-2 border-primary shadow-md shadow-primary-subtle/25'
                    : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary'
                }`
              }
            >
              <span className="w-4 h-4 shrink-0 flex items-center justify-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Drawer Footer profile information */}
        <div className="p-3 border-t border-border bg-surface font-body">
          <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-primary-subtle border border-primary flex items-center justify-center text-xs font-bold text-primary font-numeric shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex items-center gap-2 flex-1">
              <p className="text-xs font-extrabold text-text-primary truncate shrink" title={user?.name}>
                {user?.name}
              </p>
              <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider shrink-0 border ${roleColor[role!] || 'bg-surface-raised text-text-secondary'}`}>
                {role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-danger hover:bg-danger-bg rounded-lg transition-colors font-body"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content viewport */}
      <main className="flex-1 overflow-y-auto bg-bg p-4 md:p-8">
        {children}
      </main>

      {/* Floating Email Simulation Center Drawer */}
      <EmailSimulationDrawer />
    </div>
  )
}
