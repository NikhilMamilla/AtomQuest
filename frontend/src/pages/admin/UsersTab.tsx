import { useEffect, useState } from 'react'
import { UserPlus, RotateCcw, Mail, Building, Calendar, ArrowDown, Network, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { Badge, Button, Input, Select, Modal } from '../../components/common'
import { adminService } from '../../services/admin'
import type { AdminUser, CreateUserPayload } from '../../services/admin'

export default function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy'>('list')

  // New user form state
  const [form, setForm] = useState<CreateUserPayload>({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    manager_id: null,
    department: '',
  })

  const fetchUsers = () => {
    setLoading(true)
    adminService.listUsers()
      .then(setUsers)
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error('Name, email, and password are required')
      return
    }
    setCreating(true)
    try {
      await adminService.createUser({
        ...form,
        manager_id: form.manager_id || null,
        department: form.department || null,
      })
      toast.success(`User "${form.name}" created successfully`)
      setShowModal(false)
      setForm({ name: '', email: '', password: '', role: 'employee', manager_id: null, department: '' })
      fetchUsers()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const managers = users.filter(u => u.role === 'manager' || u.role === 'admin')
  const roots = users.filter(u => u.role === 'admin' || !u.manager_id)

  const getDirectReports = (userId: number) => {
    return users.filter(u => u.manager_id === userId)
  }

  const roleBadgeVariant = (role: string): 'emerald' | 'amber' | 'indigo' => {
    if (role === 'admin') return 'indigo'
    if (role === 'manager') return 'amber'
    return 'emerald'
  }

  // Get custom avatar background gradients based on role
  const getAvatarGradient = (role: string) => {
    if (role === 'admin') return 'from-indigo-500 to-violet-600 text-white shadow-indigo-500/20'
    if (role === 'manager') return 'from-amber-400 to-orange-500 text-white shadow-orange-500/20'
    return 'from-emerald-400 to-teal-500 text-white shadow-emerald-500/20'
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-body">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <p className="text-text-secondary text-sm mt-4 animate-pulse">Loading user directory...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-body animate-fade-in">
      {/* Toolbar Selector & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border/80 shadow-sm self-center sm:self-start">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              viewMode === 'list'
                ? 'bg-primary text-white shadow-md'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Network className="w-3.5 h-3.5" /> Directory List
          </button>
          <button
            onClick={() => setViewMode('hierarchy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              viewMode === 'hierarchy'
                ? 'bg-primary text-white shadow-md'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Org Reporting Tree
          </button>
        </div>

        <div className="flex items-center gap-2 justify-center self-center sm:self-end">
          <Button variant="secondary" size="sm" onClick={fetchUsers} icon={<RotateCcw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)} icon={<UserPlus className="w-3.5 h-3.5" />}>
            Add User
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <>
          {/* Table List View */}
          <div className="bg-surface rounded-2xl border border-border shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-raised/40 text-[10px] uppercase font-bold text-text-secondary border-b border-border/80">
                    <th className="px-6 py-3.5">Name & Role</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Reports To</th>
                    <th className="px-6 py-3.5">Joined</th>
                  </tr>
                </thead>
                 <tbody className="divide-y divide-border/60">
                  {users.map(user => (
                    <tr key={user.id} className="group hover:bg-surface-raised/20 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${getAvatarGradient(user.role)} flex items-center justify-center font-heading font-extrabold text-sm shrink-0 shadow-sm`}>
                            {user.name.charAt(0)}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-extrabold text-text-primary group-hover:text-primary transition-colors">
                              {user.name}
                            </span>
                            <Badge variant={roleBadgeVariant(user.role)}>{user.role}</Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-text-secondary flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-text-disabled" />
                          {user.email}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-text-secondary flex items-center gap-1.5 font-semibold">
                          <Building className="w-3.5 h-3.5 text-text-disabled" />
                          {user.department || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-text-secondary font-bold">
                        {user.manager_name || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-text-secondary flex items-center gap-1.5 font-numeric">
                          <Calendar className="w-3.5 h-3.5 text-text-disabled" />
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Visual Org Reporting Tree View */}
          <div className="bg-surface rounded-2xl border border-border p-4 sm:p-8 shadow-md flex flex-col items-center justify-start min-h-[460px] overflow-hidden relative">
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-primary-subtle text-primary border border-primary/20">
              <Network className="w-3.5 h-3.5" /> Interactive Org Hierarchy
            </div>

            {/* Subtle swipe indicator on mobile */}
            <div className="absolute top-4 right-4 flex md:hidden items-center gap-1 text-[9px] font-bold text-text-secondary animate-pulse">
              <span>Swipe to explore →</span>
            </div>

            <div className="w-full mt-6 pt-5 overflow-x-auto pb-6 scrollbar-thin">
              <div className="flex flex-col items-center min-w-max px-4">
                
                {/* Level 1: Roots */}
                <div className="flex justify-center gap-6">
                  {roots.map(root => (
                    <div key={root.id} className="flex flex-col items-center">
                      <div className="bg-surface-raised border-2 border-primary rounded-2xl p-4 shadow-lg flex items-center gap-3 transition-all duration-300 hover:scale-105 w-[280px] sm:w-80 relative group">
                        <div className="absolute inset-0 bg-primary/5 rounded-2xl filter blur-md -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getAvatarGradient(root.role)} flex items-center justify-center font-heading font-extrabold text-sm shadow-md`}>
                          {root.name.charAt(0)}
                        </div>
                        <div className="text-left space-y-1">
                          <div className="flex items-center gap-3">
                            <h4 className="text-sm font-extrabold text-text-primary">{root.name}</h4>
                            <Badge variant="indigo">Admin</Badge>
                          </div>
                          <p className="text-[10px] text-text-secondary font-medium">{root.department || 'Executive Leadership'}</p>
                        </div>
                        <span className="absolute -top-2.5 right-2 sm:-right-2 px-2 py-0.5 rounded-md text-[8px] font-extrabold bg-primary text-white uppercase tracking-wider shadow">
                          Superior
                        </span>
                      </div>

                      {/* Children of Root */}
                      {getDirectReports(root.id).length > 0 && (
                        <div className="flex flex-col items-center w-full">
                          {/* Connecting line from root to children */}
                          <div className="w-0.5 h-12 bg-gradient-to-b from-primary to-amber-500 relative flex items-center justify-center mb-4">
                            <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-500 animate-ping opacity-75" />
                            <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-500 border border-background shadow-md shadow-amber-500/50" />
                          </div>
                          
                          {/* Level 2: Managers */}
                          <div className="flex flex-col sm:flex-row justify-center gap-8 items-center sm:items-start">
                            {getDirectReports(root.id).map(manager => (
                              <div key={manager.id} className="flex flex-col items-center">
                                <div className="bg-surface-raised border-2 border-amber-500 rounded-2xl p-4 shadow-lg flex items-center gap-3 transition-all duration-300 hover:scale-105 w-[280px] sm:w-80 relative group">
                                  <div className="absolute inset-0 bg-amber-500/5 rounded-2xl filter blur-md -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getAvatarGradient(manager.role)} flex items-center justify-center font-heading font-extrabold text-sm shadow-md`}>
                                    {manager.name.charAt(0)}
                                  </div>
                                  <div className="text-left space-y-1">
                                    <div className="flex items-center gap-3">
                                      <h4 className="text-sm font-extrabold text-text-primary">{manager.name}</h4>
                                      <Badge variant="amber">Manager</Badge>
                                    </div>
                                    <p className="text-[10px] text-text-secondary font-medium">{manager.department || 'Operations'}</p>
                                  </div>
                                  <span className="absolute -top-2.5 right-2 sm:-right-2 px-2 py-0.5 rounded-md text-[8px] font-extrabold bg-amber-500 text-white uppercase tracking-wider shadow">
                                    Reports to {root.name}
                                  </span>
                                </div>

                                {/* Children of Manager */}
                                {getDirectReports(manager.id).length > 0 && (
                                  <div className="flex flex-col items-center w-full">
                                    {/* Connecting line from manager to employees */}
                                    <div className="w-0.5 h-12 bg-gradient-to-b from-amber-500 to-emerald-500 relative flex items-center justify-center mb-4">
                                      <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
                                      <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500 border border-background shadow-md shadow-emerald-500/50" />
                                    </div>

                                    {/* Level 3: Employees */}
                                    <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-6 max-w-4xl items-center">
                                      {getDirectReports(manager.id).map(employee => (
                                        <div key={employee.id} className="bg-surface-raised border-2 border-emerald-500 rounded-2xl p-4 shadow-lg flex items-center gap-3 transition-all duration-300 hover:scale-105 w-[260px] sm:w-72 relative group">
                                          <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl filter blur-md -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                          <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getAvatarGradient(employee.role)} flex items-center justify-center font-heading font-extrabold text-sm shadow-md`}>
                                            {employee.name.charAt(0)}
                                          </div>
                                          <div className="text-left space-y-1">
                                            <div className="flex items-center gap-3">
                                              <h4 className="text-sm font-extrabold text-text-primary">{employee.name}</h4>
                                              <Badge variant="emerald">Employee</Badge>
                                            </div>
                                            <p className="text-[10px] text-text-secondary font-medium">{employee.department || 'Operations'}</p>
                                          </div>
                                          <span className="absolute -top-2.5 right-2 sm:-right-2 px-2 py-0.5 rounded-md text-[8px] font-extrabold bg-emerald-500 text-white uppercase tracking-wider shadow">
                                            Reports to {manager.name}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </>
      )}

      {/* Create User Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Create New User"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleCreate} loading={creating} icon={<UserPlus className="w-3.5 h-3.5" />}>
              Create User
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Rahul Kumar"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. rahul@company.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Minimum 6 characters"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
          <Select
            label="Role"
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value as any })}
            options={[
              { value: 'employee', label: 'Employee' },
              { value: 'manager', label: 'Manager' },
              { value: 'admin', label: 'Admin' },
            ]}
          />
          <Input
            label="Department"
            placeholder="e.g. Engineering"
            value={form.department || ''}
            onChange={e => setForm({ ...form, department: e.target.value })}
          />
          <Select
            label="Reports To (Manager)"
            value={form.manager_id?.toString() || ''}
            onChange={e => setForm({ ...form, manager_id: e.target.value ? Number(e.target.value) : null })}
            placeholder="Select a manager"
            options={managers.map(m => ({ value: m.id, label: `${m.name} (${m.role})` }))}
          />
        </div>
      </Modal>
    </div>
  )
}
