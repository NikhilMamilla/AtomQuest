import { useEffect, useState } from 'react'
import { Download, RotateCcw, BarChart3, TrendingUp, Users, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Badge, Button } from '../../components/common'
import { adminService } from '../../services/admin'
import type { AchievementRow, CompletionRow } from '../../services/admin'

export default function ReportsTab() {
  const [activeSection, setActiveSection] = useState<'achievement' | 'completion'>('achievement')

  // Achievement report state
  const [achievements, setAchievements] = useState<AchievementRow[]>([])
  const [loadingAch, setLoadingAch] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Completion report state
  const [completion, setCompletion] = useState<CompletionRow[]>([])
  const [loadingComp, setLoadingComp] = useState(false)

  const fetchAchievements = () => {
    setLoadingAch(true)
    adminService.achievementReport()
      .then(setAchievements)
      .catch(() => toast.error('Failed to load achievement report'))
      .finally(() => setLoadingAch(false))
  }

  const fetchCompletion = () => {
    setLoadingComp(true)
    adminService.completionReport()
      .then(setCompletion)
      .catch(() => toast.error('Failed to load completion report'))
      .finally(() => setLoadingComp(false))
  }

  useEffect(() => { fetchAchievements() }, [])

  useEffect(() => {
    if (activeSection === 'completion' && completion.length === 0) {
      fetchCompletion()
    }
  }, [activeSection])

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const response = await adminService.exportAchievementCSV()
      const blob = new Blob([response as any], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'employee_achievements_report.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('CSV downloaded successfully')
    } catch {
      toast.error('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  const progressColor = (pct: number) => {
    if (pct >= 100) return 'bg-success'
    if (pct >= 50) return 'bg-primary'
    if (pct > 0) return 'bg-warning'
    return 'bg-surface-raised'
  }

  const statusBadgeVariant = (status: string | null): 'emerald' | 'amber' | 'indigo' | 'rose' | 'slate' => {
    if (!status) return 'slate'
    const map: Record<string, 'emerald' | 'amber' | 'indigo' | 'rose' | 'slate'> = {
      completed: 'emerald',
      on_track: 'indigo',
      off_track: 'rose',
      not_started: 'slate',
    }
    return map[status] || 'slate'
  }

  const achievementsByEmployee = achievements.reduce<Record<string, AchievementRow[]>>((acc, row) => {
    const key = `${row.employee_id}-${row.employee_name}`
    if (!acc[key]) acc[key] = []
    acc[key].push(row)
    return acc
  }, {})

  // Group completion data by employee
  const completionByEmployee = completion.reduce<Record<string, CompletionRow[]>>((acc, row) => {
    const key = `${row.employee_id}-${row.employee_name}`
    if (!acc[key]) acc[key] = []
    acc[key].push(row)
    return acc
  }, {})

  return (
    <div className="space-y-6 font-body animate-fade-in">
      {/* Section Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveSection('achievement')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
            activeSection === 'achievement'
              ? 'bg-primary-subtle text-primary border-primary/20 shadow-md shadow-primary-subtle/25'
              : 'bg-surface text-text-secondary border-border hover:text-text-primary hover:bg-surface-raised'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Achievement Report
        </button>
        <button
          onClick={() => setActiveSection('completion')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
            activeSection === 'completion'
              ? 'bg-primary-subtle text-primary border-primary/20 shadow-md shadow-primary-subtle/25'
              : 'bg-surface text-text-secondary border-border hover:text-text-primary hover:bg-surface-raised'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Completion Dashboard
        </button>
      </div>

      {/* ─── ACHIEVEMENT REPORT SECTION ─── */}
      {activeSection === 'achievement' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              <span className="font-bold font-numeric text-text-primary">{achievements.length}</span> achievement records
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={fetchAchievements} icon={<RotateCcw className="w-3.5 h-3.5" />}>
                Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={handleExportCSV} loading={exporting} icon={<Download className="w-3.5 h-3.5" />}>
                Export CSV
              </Button>
            </div>
          </div>

          {loadingAch ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              <p className="text-text-secondary text-sm mt-4 animate-pulse">Compiling achievement data...</p>
            </div>
          ) : Object.keys(achievementsByEmployee).length === 0 ? (
            <div className="bg-surface p-12 rounded-2xl border border-border/80 text-center space-y-3 shadow-sm">
              <TrendingUp className="w-8 h-8 text-text-disabled mx-auto" />
              <p className="text-text-secondary text-sm">No achievement data recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(achievementsByEmployee).map(([key, rows]) => {
                const empName = rows[0].employee_name || 'Unknown Employee'
                const dept = rows[0].department || 'Department Not Specified'
                
                return (
                  <div key={key} className="bg-surface border border-border/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300">
                    <div className="px-5 py-4 border-b border-border/50 bg-gradient-to-r from-surface-raised/40 to-transparent flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-on font-heading font-extrabold text-sm shadow-md shadow-primary/20">
                        {empName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-text-primary">{empName}</h3>
                        <p className="text-xs text-text-secondary">{dept}</p>
                      </div>
                      <div className="ml-auto">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-bg px-3 py-1.5 rounded-lg border border-border">
                          {rows.length} {rows.length === 1 ? 'Record' : 'Records'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[10px] uppercase font-extrabold text-text-secondary border-b border-border/50 bg-bg/40 tracking-wider">
                            <th className="px-5 py-3 w-40">Thrust Area</th>
                            <th className="px-5 py-3 min-w-[200px]">Goal Objective</th>
                            <th className="px-5 py-3 text-center w-24">Quarter</th>
                            <th className="px-5 py-3 text-center w-24">Planned</th>
                            <th className="px-5 py-3 text-center w-24">Actual</th>
                            <th className="px-5 py-3 text-center w-24">Score</th>
                            <th className="px-5 py-3 text-center w-32">Progress</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {rows.map((row, idx) => (
                            <tr key={`${row.goal_id}-${row.quarter}-${idx}`} className="group hover:bg-surface-raised/30 transition-colors duration-150">
                              <td className="px-5 py-3.5">
                                <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold bg-surface-raised border border-border/80 text-primary uppercase font-numeric tracking-wider shadow-sm">
                                  {row.thrust_area}
                                </span>
                              </td>
                              <td className="px-5 py-3.5">
                                <p className="text-xs font-semibold text-text-primary line-clamp-2 leading-relaxed">{row.title}</p>
                              </td>
                              <td className="px-5 py-3.5 text-center">
                                {row.quarter ? (
                                  <Badge variant="indigo">{row.quarter}</Badge>
                                ) : (
                                  <span className="text-[10px] text-text-disabled">—</span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-center text-xs font-bold font-numeric text-text-primary">
                                {row.target ?? '—'}
                              </td>
                              <td className="px-5 py-3.5 text-center text-xs font-bold font-numeric text-text-primary">
                                {row.actual ?? '—'}
                              </td>
                              <td className="px-5 py-3.5 text-center">
                                {row.score !== null ? (
                                  <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg text-xs font-bold font-numeric shadow-sm ${
                                    row.score >= 80 ? 'bg-success-bg text-success border border-success/30' :
                                    row.score >= 50 ? 'bg-warning-bg text-warning border border-warning/30' :
                                    'bg-danger-bg text-danger border border-danger/30'
                                  }`}>
                                    {row.score}%
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-text-disabled">—</span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-center">
                                {row.progress_status ? (
                                  <Badge variant={statusBadgeVariant(row.progress_status)}>
                                    {row.progress_status.replace('_', ' ')}
                                  </Badge>
                                ) : (
                                  <span className="text-[10px] text-text-disabled">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── COMPLETION DASHBOARD SECTION ─── */}
      {activeSection === 'completion' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              Quarter-wise check-in completion rates per employee
            </p>
            <Button variant="secondary" size="sm" onClick={fetchCompletion} icon={<RotateCcw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
          </div>

          {loadingComp ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              <p className="text-text-secondary text-sm mt-4 animate-pulse">Compiling completion rates...</p>
            </div>
          ) : Object.keys(completionByEmployee).length === 0 ? (
            <div className="bg-surface p-12 rounded-2xl border border-border/80 text-center space-y-3">
              <Users className="w-8 h-8 text-text-disabled mx-auto" />
              <p className="text-text-secondary text-sm">No completion data available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Object.entries(completionByEmployee).map(([key, rows]) => {
                const empName = rows[0].employee_name
                const mgrName = rows[0].manager_name
                const dept = rows[0].department

                return (
                  <div key={key} className="bg-surface rounded-2xl border border-border shadow-md p-5 space-y-4 hover:border-primary/20 transition-all duration-300">
                    {/* Employee Header */}
                    <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                      <div className="w-9 h-9 rounded-full bg-primary-subtle border border-primary/30 flex items-center justify-center text-primary font-heading font-extrabold text-sm shrink-0">
                        {empName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-text-primary">{empName}</p>
                        <p className="text-[10px] text-text-disabled">
                          {dept || '—'} · Manager: {mgrName}
                        </p>
                      </div>
                    </div>

                    {/* Quarter Progress Bars */}
                    <div className="space-y-3">
                      {rows.map(row => {
                        const pct = row.total_goals_count > 0
                          ? Math.round((row.logged_actuals_count / row.total_goals_count) * 100)
                          : 0

                        return (
                          <div key={row.quarter} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                                <BarChart3 className="w-3 h-3 text-text-disabled" />
                                {row.quarter}
                              </span>
                              <div className="flex items-center gap-3 text-[10px]">
                                <span className="text-text-secondary">
                                  Actuals: <span className="font-bold font-numeric text-text-primary">{row.logged_actuals_count}/{row.total_goals_count}</span>
                                </span>
                                <span className={`font-bold ${row.manager_submitted ? 'text-success' : 'text-text-disabled'}`}>
                                  {row.manager_submitted ? '✓ Manager Reviewed' : '○ Pending Review'}
                                </span>
                              </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full h-2 bg-surface-raised rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ease-out ${progressColor(pct)}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
