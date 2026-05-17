import { useEffect, useState } from 'react'
import { 
  CalendarRange, 
  Users, 
  FileText, 
  MessageSquare, 
  Send, 
  AlertCircle, 
  Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Badge, Button } from '../../components/common'
import { checkinsService } from '../../services/checkins'
import { achievementsService } from '../../services/achievements'
import type { AchievementGoal } from '../../services/achievements'


interface TeamMember {
  id: number
  name: string
  email: string
  department: string
  managerName?: string
}

export default function CheckinView() {
  const [quarter, setQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1')
  const [employees, setEmployees] = useState<TeamMember[]>([])
  const [selectedEmp, setSelectedEmp] = useState<TeamMember | null>(null)
  const [achievements, setAchievements] = useState<AchievementGoal[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [commentInput, setCommentInput] = useState('')
  
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)

  // Fetch team members from goals reporting registry
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoadingEmployees(true)
        const teamGoals = await checkinsService.listTeamGoals()
        
        // Group unique employees
        const empMap = new Map<number, TeamMember>()
        teamGoals.forEach((g: any) => {
          if (g.employee_id && !empMap.has(g.employee_id)) {
            empMap.set(g.employee_id, {
              id: g.employee_id,
              name: g.employee_name || 'Team Member',
              email: g.employee_email || '',
              department: g.department || 'Department Not Specified',
              managerName: g.manager_name || 'None'
            })
          }
        })

        const list = Array.from(empMap.values())
        setEmployees(list)
        if (list.length > 0) {
          setSelectedEmp(list[0])
        }
      } catch (err: any) {
        console.error(err)
        toast.error('Failed to load team reporting lines')
      } finally {
        setLoadingEmployees(false)
      }
    }
    fetchTeam()
  }, [])

  // Fetch selected employee performance actuals and manager feedback check-in comments
  const fetchDetails = async () => {
    if (!selectedEmp) return
    
    try {
      setLoadingDetails(true)
      
      // Fetch achievements list
      const data = await achievementsService.list({ 
        quarter, 
        employee_id: selectedEmp.id 
      })
      setAchievements(data)

      // Fetch comment history and filter for selected employee and quarter
      const allComments = await checkinsService.list()
      const filtered = allComments.filter(
        c => c.employee_id === selectedEmp.id && c.quarter === quarter
      )
      setComments(filtered)
    } catch (err: any) {
      console.error(err)
      toast.error('Error loading employee check-in details')
    } finally {
      setLoadingDetails(false)
    }
  }

  useEffect(() => {
    fetchDetails()
  }, [selectedEmp, quarter])

  // Submit a continuous feedback structured comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmp || !commentInput.trim()) return

    try {
      setSubmittingComment(true)
      await checkinsService.postComment(selectedEmp.id, quarter, commentInput.trim())
      toast.success('Successfully posted continuous feedback comment')
      setCommentInput('')
      
      // Refresh details
      await fetchDetails()
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to post comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  // Helper status color mapping
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge variant="emerald">Completed</Badge>
      case 'on_track':
        return <Badge variant="indigo">On Track</Badge>
      case 'off_track':
        return <Badge variant="amber">Off Track</Badge>
      default:
        return <Badge variant="slate">Not Started</Badge>
    }
  }

  // Compute aggregate statistics for selected quarter
  const averageScore = achievements.length > 0 
    ? achievements.reduce((acc, curr) => acc + (curr.score || 0) * (curr.weightage / 100), 0)
    : 0

  return (
    <div className="space-y-8 animate-fade-in pb-16 font-body">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight font-heading flex items-center gap-2.5">
            <CalendarRange className="w-6 h-6 text-primary" />
            Team Quarterly Check-ins
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-body">
            Audit team planned vs actual achievements, track live performance progress scores, and supply continuous coaching feedback.
          </p>
        </div>

        {/* Quarter Selector Tabs */}
        <div className="flex items-center gap-2 bg-surface-raised border border-border p-1.5 rounded-xl self-start">
          {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => (
            <button
              key={q}
              onClick={() => setQuarter(q)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                quarter === q
                  ? 'bg-primary text-primary-on shadow-md shadow-primary/10'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {loadingEmployees ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          <p className="text-text-secondary text-xs">Loading team roster...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
          <Users className="w-12 h-12 text-text-disabled mx-auto animate-pulse" />
          <div>
            <h3 className="text-base font-bold text-text-primary">No Direct Reports Identified</h3>
            <p className="text-xs text-text-secondary mt-1">
              You are currently not listed as the manager for any active employee profiles, or your reports have not drafted objectives.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Column: Direct reports roster list */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-disabled flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Direct Reports ({employees.length})
            </h3>
            <div className="bg-surface border border-border rounded-2xl p-3.5 space-y-2 shadow-sm">
              {employees.map(emp => {
                const isSelected = selectedEmp?.id === emp.id
                return (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedEmp(emp)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 border flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-primary-subtle text-primary border-primary/40 shadow-sm shadow-primary-subtle/10 font-semibold'
                        : 'bg-transparent text-text-secondary border-transparent hover:bg-surface-raised hover:text-text-primary'
                    }`}
                  >
                    <span className="text-xs font-bold truncate block">{emp.name}</span>
                    <div className="flex items-center justify-between gap-2 w-full text-[10px] text-text-disabled">
                      <span className="truncate">{emp.email} {emp.managerName && emp.managerName !== 'None' ? `• Mgr: ${emp.managerName}` : ''}</span>
                      <span className="shrink-0 bg-bg border border-border/80 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                        {emp.department?.substring(0, 3)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Columns: Selective reportee actual comparative matrix & coaching comments */}
          <div className="lg:col-span-3 space-y-8">
            {selectedEmp && (
              <>
                {/* Employee Performance Aggregation Header */}
                <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-44 h-44 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary font-heading leading-tight">{selectedEmp.name}</h2>
                    <p className="text-xs text-text-secondary mt-1">
                      Department: <strong className="font-semibold">{selectedEmp.department}</strong> | Manager: <strong className="font-semibold">{selectedEmp.managerName}</strong> | Active Appraisal Quarter: <strong className="font-semibold text-primary">{quarter}</strong>
                    </p>
                  </div>

                  {/* Summary Metric Gauge */}
                  <div className="bg-bg border border-border px-4 py-3 rounded-xl flex items-center gap-3 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary-subtle flex items-center justify-center text-primary text-xs shrink-0 font-bold font-numeric">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-text-disabled tracking-wider block">Avg Progress Score</span>
                      <span className="text-sm font-black text-text-primary font-numeric mt-0.5 block">
                        {Math.round(averageScore * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    <p className="text-text-secondary text-xs">Loading performance data...</p>
                  </div>
                ) : achievements.length === 0 ? (
                  <div className="bg-surface border border-border rounded-2xl p-10 text-center space-y-3">
                    <AlertCircle className="w-10 h-10 text-text-disabled mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">No Active Goals Sheet Available</h4>
                      <p className="text-xs text-text-secondary mt-1">
                        This employee does not have any goals finalized or approved for continuous check-in logging.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Planned vs Actual comparative grid table */}
                    <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                      <div className="px-6 py-4 border-b border-border/60">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          Comparative Planned vs Actuals Sheet
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-bg border-b border-border text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                              <th className="px-6 py-3.5 w-12 font-numeric text-center">#</th>
                              <th className="px-6 py-3.5">Goal Objective & Thrust Area</th>
                              <th className="px-6 py-3.5 text-center w-28">Planned Target</th>
                              <th className="px-6 py-3.5 text-center w-28">Actual Logged</th>
                              <th className="px-6 py-3.5 text-center w-36">Timeline</th>
                              <th className="px-6 py-3.5 text-center w-28">Status</th>
                              <th className="px-6 py-3.5 text-right w-24">Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60 text-xs">
                            {achievements.map((item, index) => {
                              const scoreVal = item.score || 0
                              const isTimeline = item.uom === 'timeline'

                              return (
                                <tr key={item.goal_id} className="hover:bg-surface-raised transition-all">
                                  <td className="px-6 py-4 font-bold text-text-disabled text-center font-numeric">
                                    {index + 1}
                                  </td>
                                  <td className="px-6 py-4 max-w-sm">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <Badge variant="indigo">{item.thrust_area}</Badge>
                                      <span className="text-[10px] text-text-disabled font-semibold font-numeric">W: {item.weightage}%</span>
                                    </div>
                                    <span className="font-bold text-text-primary block leading-tight">{item.title}</span>
                                    {item.description && (
                                      <p className="text-[10px] text-text-secondary leading-snug line-clamp-1 mt-0.5">{item.description}</p>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-center font-bold text-text-secondary font-numeric">
                                    {isTimeline ? 'Timeline Goal' : item.target !== null ? item.target : '-'}
                                  </td>
                                  <td className="px-6 py-4 text-center font-black text-text-primary font-numeric">
                                    {isTimeline ? '-' : item.actual !== null ? item.actual : <span className="text-text-disabled font-normal italic">Unlogged</span>}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    {isTimeline ? (
                                      <div className="flex flex-col gap-0.5 justify-center items-center">
                                        <span className="text-[10px] text-text-disabled font-numeric">D: {item.deadline ? new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}</span>
                                        {item.completion_date ? (
                                          <span className="text-[10px] text-success font-semibold font-numeric">A: {new Date(item.completion_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                        ) : (
                                          <span className="text-[10px] text-text-disabled italic">No actual logged</span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-text-disabled font-numeric">D: {item.deadline ? new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    {getStatusBadge(item.progress_status)}
                                  </td>
                                  <td className="px-6 py-4 text-right font-black font-numeric text-text-primary text-sm">
                                    {item.score !== null ? `${Math.round(scoreVal * 100)}%` : '-'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Continuous Feedback Chat / Structured Comments Panel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                      {/* Left: Comment History Feed */}
                      <div className="flex flex-col h-full space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-disabled flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-primary" />
                          Check-in Comments History ({comments.length})
                        </h4>
                        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4 shadow-sm flex-1 overflow-y-auto divide-y divide-border/40 min-h-[320px] max-h-[360px] custom-scrollbar">
                          {comments.length === 0 ? (
                            <div className="text-center py-12 space-y-2 h-full flex flex-col items-center justify-center">
                              <MessageSquare className="w-8 h-8 text-text-disabled mx-auto animate-pulse" />
                              <p className="text-[11px] text-text-secondary leading-relaxed">
                                No check-in feedback comments posted yet for {selectedEmp.name} in {quarter}.
                              </p>
                            </div>
                          ) : (
                            comments.map((c, i) => (
                              <div key={c.id} className={`flex gap-3 text-xs leading-relaxed ${i > 0 ? 'pt-4' : ''}`}>
                                <div className="w-7 h-7 rounded-full bg-primary-subtle text-primary border border-primary/20 flex items-center justify-center shrink-0 text-[10px] font-extrabold uppercase">
                                  {c.manager_name?.charAt(0) || 'M'}
                                </div>
                                <div className="space-y-1 w-full">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="font-bold text-text-primary">{c.manager_name || 'Direct Manager'}</span>
                                    <span className="text-[9px] text-text-disabled font-numeric">
                                      {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-text-secondary leading-relaxed italic bg-surface-raised p-3 border border-border/80 rounded-xl">
                                    "{c.comment}"
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Right: Post New Feedback Form */}
                      <div className="flex flex-col h-full space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-disabled flex items-center gap-2">
                          <Send className="w-4 h-4 text-primary" />
                          Add Structured Coaching Comment
                        </h4>
                        <form onSubmit={handlePostComment} className="bg-surface border border-border rounded-2xl p-5 flex flex-col justify-between shadow-sm flex-1 min-h-[320px]">
                          <div className="space-y-2 flex-1 flex flex-col">
                            <label className="text-[11px] font-bold text-text-secondary">
                              Coaching Guidance / Feedback Notes
                            </label>
                            <textarea
                              required
                              value={commentInput}
                              onChange={(e) => setCommentInput(e.target.value)}
                              placeholder={`Enter feedback guidelines, milestone notes, or performance coaching for ${selectedEmp.name} for ${quarter}...`}
                              className="w-full flex-1 bg-surface-raised border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none transition-colors leading-relaxed placeholder:opacity-60 resize-none min-h-[150px] custom-scrollbar"
                            />
                          </div>

                          <div className="pt-4 mt-auto">
                            <Button
                              type="submit"
                              variant="primary"
                              size="sm"
                              disabled={submittingComment || !commentInput.trim()}
                              className="w-full flex items-center justify-center gap-2 py-2.5 font-bold shadow-md"
                            >
                              {submittingComment ? (
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-primary-on"></div>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  Save Feedback Comment
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
