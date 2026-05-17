import { useEffect, useState } from 'react'
import { RotateCcw, Unlock, Filter, Building, Target as TargetIcon, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { Badge, Button } from '../../components/common'
import { adminService } from '../../services/admin'
import type { AdminGoal } from '../../services/admin'

export default function GoalsTab() {
  const [goals, setGoals] = useState<AdminGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [unlocking, setUnlocking] = useState<number | null>(null)

  // Filter state
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const fetchGoals = () => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (filterDept) params.department = filterDept
    if (filterStatus) params.status = filterStatus
    adminService.listGoals(params)
      .then(setGoals)
      .catch(() => toast.error('Failed to load goals'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchGoals() }, [filterDept, filterStatus])

  const handleUnlock = async (goalId: number) => {
    setUnlocking(goalId)
    try {
      await adminService.unlockGoal(goalId)
      toast.success('Goal unlocked and returned to draft')
      fetchGoals()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to unlock goal')
    } finally {
      setUnlocking(null)
    }
  }

  // Derive unique departments from loaded goals
  const departments = [...new Set(goals.map(g => g.department).filter(Boolean))] as string[]
  const statuses = ['draft', 'submitted', 'pending', 'approved', 'returned']

  if (loading && goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-body">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <p className="text-text-secondary text-sm mt-4 animate-pulse">Loading organizational goals...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-body animate-fade-in">
      {/* Toolbar with Filters */}
      <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-4 text-center md:text-left">
        <p className="text-sm text-text-secondary self-center md:self-auto">
          <span className="font-bold font-numeric text-text-primary">{goals.length}</span> goals across organization
        </p>
        <div className="flex items-center justify-center md:justify-end gap-2 flex-wrap w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Filter className="w-3.5 h-3.5 text-text-disabled" />
            Filters:
          </div>

          {/* Department filter */}
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="text-xs bg-surface border border-border rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none focus:border-primary appearance-none font-body"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-xs bg-surface border border-border rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none focus:border-primary appearance-none font-body capitalize"
          >
            <option value="">All Statuses</option>
            {statuses.map(s => (
              <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          <Button variant="secondary" size="sm" onClick={() => { setFilterDept(''); setFilterStatus('') }}>
            Clear
          </Button>
          <Button variant="secondary" size="sm" onClick={fetchGoals} icon={<RotateCcw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Goals Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-raised/40 text-[10px] uppercase font-bold text-text-secondary border-b border-border/80">
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Thrust Area & Title</th>
                <th className="px-6 py-3 text-center">Target</th>
                <th className="px-6 py-3 text-center">Weightage</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {goals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-text-secondary">
                    No goals match the selected filters.
                  </td>
                </tr>
              ) : (
                goals.map(goal => (
                  <tr key={goal.id} className="group hover:bg-surface-raised/20 transition-colors duration-150">
                    {/* Employee */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary-subtle border border-primary/30 flex items-center justify-center text-primary font-heading font-extrabold text-[10px] shrink-0">
                          {goal.employee_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-text-primary truncate">{goal.employee_name}</p>
                          <p className="text-[10px] text-text-disabled flex items-center gap-1">
                            <Building className="w-2.5 h-2.5" />
                            {goal.department || '—'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Thrust Area & Title */}
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-raised border border-border text-primary uppercase font-numeric mb-1">
                        {goal.thrust_area}
                      </span>
                      <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors truncate max-w-[250px]">
                        {goal.title}
                      </p>
                    </td>

                    {/* Target */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-text-primary">
                        <TargetIcon className="w-3 h-3 text-primary" />
                        <span className="font-bold font-numeric">{goal.target ?? '—'}</span>
                        <span className="text-[10px] text-text-secondary lowercase">({goal.uom.replace('_', ' ')})</span>
                      </div>
                    </td>

                    {/* Weightage */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-numeric bg-primary-subtle text-primary border border-primary/20">
                        {goal.weightage}%
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Badge status={goal.status} />
                        {goal.locked && (
                          <Lock className="w-3 h-3 text-warning" />
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      {goal.locked ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleUnlock(goal.id)}
                          loading={unlocking === goal.id}
                          icon={<Unlock className="w-3 h-3" />}
                        >
                          Unlock
                        </Button>
                      ) : (
                        <span className="text-[10px] text-text-disabled">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
