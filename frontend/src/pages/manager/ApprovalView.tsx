import { useEffect, useState } from 'react'
import { 
  CheckCircle2, 
  RotateCcw, 
  Edit3, 
  Save, 
  X, 
  User, 
  Sparkles, 
  AlertCircle, 
  Calendar,
  Lock,
  Building,
  Target as TargetIcon,
  BarChart3,
  TrendingUp,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  Share2
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts'
import toast from 'react-hot-toast'
import { Badge, Button, WeightageBar } from '../../components/common'
import { goalsService } from '../../services/goals'
import type { Goal } from '../../services/goals'
import { checkinsService } from '../../services/checkins'

interface EmployeeGroup {
  employeeId: number
  employeeName: string
  employeeEmail: string
  department: string
  status: 'draft' | 'submitted' | 'approved' | 'returned' | 'pending'
  goals: Goal[]
}

export default function ApprovalView() {
  const [teamGoals, setTeamGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null)
  
  // Inline editing state
  const [editTarget, setEditTarget] = useState<number | ''>('')
  const [editWeightage, setEditWeightage] = useState<number>(10)
  
  // Return Sheet modal state
  const [returnModalEmployee, setReturnModalEmployee] = useState<EmployeeGroup | null>(null)
  const [returnComment, setReturnComment] = useState('')
  const [returningSheet, setReturningSheet] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(true)

  // Push KPI modal state
  const [showPushModal, setShowPushModal] = useState(false)
  const [pushGoalTitle, setPushGoalTitle] = useState('')
  const [pushGoalDesc, setPushGoalDesc] = useState('')
  const [pushGoalThrustArea, setPushGoalThrustArea] = useState('Revenue Growth')
  const [pushGoalUom, setPushGoalUom] = useState('numeric_min')
  const [pushGoalTarget, setPushGoalTarget] = useState<number | ''>('')
  const [pushGoalDeadline, setPushGoalDeadline] = useState('')
  const [pushSelectedEmployees, setPushSelectedEmployees] = useState<number[]>([])
  const [pushing, setPushing] = useState(false)

  // Fetch team goals from checkinsService
  const fetchTeamGoals = () => {
    setLoading(true)
    checkinsService.listTeamGoals()
      .then(setTeamGoals)
      .catch(() => toast.error('Failed to load team objectives'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTeamGoals()
  }, [])

  // Group goals by employee
  const employees: EmployeeGroup[] = []
  teamGoals.forEach(goal => {
    let group = employees.find(e => e.employeeId === goal.employee_id)
    if (!group) {
      // Map 'pending' status to 'submitted' visually if needed, but keep DB status
      group = {
        employeeId: goal.employee_id,
        employeeName: goal.employee_name || 'Team Member',
        employeeEmail: (goal as any).employee_email || '',
        department: (goal as any).department || 'Technology',
        // Overall sheet status is derived from the first goal's status
        status: goal.status as any,
        goals: []
      }
      employees.push(group)
    }
    if (goal.id) {
      group.goals.push(goal)
    }
  })

  // --- Dynamic Team Analytics Calculations ---
  const totalEmployeesCount = employees.length
  const approvedCount = employees.filter(e => e.goals.length > 0 && e.goals.every(g => g.status === 'approved')).length
  const pendingCount = employees.filter(e => e.goals.some(g => g.status === 'pending')).length
  const returnedCount = employees.filter(e => e.goals.some(g => g.status === 'returned')).length
  const draftingCount = Math.max(0, totalEmployeesCount - approvedCount - pendingCount - returnedCount)

  const pieData = [
    { name: 'Approved & Locked', value: approvedCount, fill: '#30d68a' },
    { name: 'Awaiting Review', value: pendingCount, fill: '#f5a524' },
    { name: 'Returned / Revision', value: returnedCount, fill: '#f26b55' },
    { name: 'Drafting / Not Started', value: draftingCount, fill: '#94a3b8' }
  ].filter(d => d.value > 0)

  const thrustSums: Record<string, number> = {
    FINANCIAL: 0,
    CUSTOMER: 0,
    OPERATIONAL: 0,
    LEARNING: 0
  }
  
  let totalGoalsCount = 0
  employees.forEach(e => {
    totalGoalsCount += e.goals.length
    e.goals.forEach(g => {
      const area = (g.thrust_area || '').toUpperCase()
      if (area.includes('FINANCIAL')) thrustSums.FINANCIAL += Number(g.weightage)
      else if (area.includes('CUSTOMER')) thrustSums.CUSTOMER += Number(g.weightage)
      else if (area.includes('OPERATIONAL')) thrustSums.OPERATIONAL += Number(g.weightage)
      else if (area.includes('LEARNING')) thrustSums.LEARNING += Number(g.weightage)
    })
  })

  const avgGoalsCount = totalEmployeesCount > 0 ? (totalGoalsCount / totalEmployeesCount).toFixed(1) : '0'

  const barData = [
    { name: 'Financial', Weightage: thrustSums.FINANCIAL, fill: 'var(--color-primary)' },
    { name: 'Customer', Weightage: thrustSums.CUSTOMER, fill: 'var(--color-accent)' },
    { name: 'Operational', Weightage: thrustSums.OPERATIONAL, fill: '#f5a524' },
    { name: 'Learning & Growth', Weightage: thrustSums.LEARNING, fill: '#30d68a' }
  ]

  // Start inline editing
  const startEdit = (goal: Goal) => {
    setEditingGoalId(goal.id)
    setEditTarget(goal.target !== null ? goal.target : '')
    setEditWeightage(goal.weightage)
  }

  // Cancel inline editing
  const cancelEdit = () => {
    setEditingGoalId(null)
    setEditTarget('')
    setEditWeightage(10)
  }

  // Save single goal approval with inline edits
  const saveGoalApproval = async (goal: Goal) => {
    try {
      const payload: { target?: number; weightage?: number } = {
        weightage: editWeightage
      }
      if (editTarget !== '') {
        payload.target = Number(editTarget)
      }

      await goalsService.approve(goal.id, payload)
      toast.success(`Goal "${goal.title}" approved and updated successfully`)
      setEditingGoalId(null)
      fetchTeamGoals()
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to approve goal'
      toast.error(errorMsg)
    }
  }

  // Approve entire sheet for an employee
  const handleApproveSheet = async (group: EmployeeGroup) => {
    try {
      // Check total weightage equals exactly 100%
      const totalWeight = group.goals.reduce((sum, g) => sum + Number(g.weightage), 0)
      if (Math.round(totalWeight) !== 100) {
        toast.error(`Cannot approve: Total weightage is ${totalWeight}%. It must sum up to exactly 100%.`)
        return
      }

      await goalsService.approveSheet(group.employeeId)
      toast.success(`Entire goal sheet for ${group.employeeName} approved!`)
      fetchTeamGoals()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to approve goal sheet')
    }
  }

  // Open return entire sheet modal
  const openReturnModal = (group: EmployeeGroup) => {
    setReturnModalEmployee(group)
    setReturnComment('')
  }

  // Close return entire sheet modal
  const closeReturnModal = () => {
    setReturnModalEmployee(null)
    setReturnComment('')
  }

  // Return entire sheet for revision
  const handleReturnSheet = async () => {
    if (!returnModalEmployee) return
    if (!returnComment.trim()) {
      toast.error('Please specify a revision comment for the employee')
      return
    }

    setReturningSheet(true)
    try {
      await goalsService.returnSheet(returnModalEmployee.employeeId, undefined, returnComment.trim())
      toast.success(`Goal sheet returned to ${returnModalEmployee.employeeName} for revision`)
      closeReturnModal()
      fetchTeamGoals()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to return goal sheet')
    } finally {
      setReturningSheet(false)
    }
  }

  // Push a new KPI goal to selected team members
  const handlePushKPI = async () => {
    if (!pushGoalTitle.trim()) {
      toast.error('Goal title is required')
      return
    }
    if (pushSelectedEmployees.length === 0) {
      toast.error('Select at least one team member')
      return
    }
    setPushing(true)
    try {
      // First create the master goal for the manager
      const masterGoal = await goalsService.create({
        thrust_area: pushGoalThrustArea,
        title: pushGoalTitle.trim(),
        description: pushGoalDesc.trim(),
        uom: pushGoalUom,
        target: pushGoalTarget !== '' ? Number(pushGoalTarget) : undefined,
        deadline: pushGoalDeadline || undefined,
        weightage: 10,
      })
      // Now push it to selected employees
      const result = await goalsService.pushGoal(masterGoal.id, pushSelectedEmployees)
      toast.success(`KPI pushed to ${result.pushed_count} team member(s)!`)
      setShowPushModal(false)
      setPushGoalTitle('')
      setPushGoalDesc('')
      setPushSelectedEmployees([])
      fetchTeamGoals()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to push KPI')
    } finally {
      setPushing(false)
    }
  }

  if (loading && teamGoals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-body">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <p className="text-text-secondary text-sm mt-4 animate-pulse">Loading reporting team goals...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 font-body pb-12 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border/80 shadow-lg">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-text-primary tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            Team Goals & Approvals
          </h1>
          <p className="text-text-secondary text-sm mt-1 leading-relaxed">
            Review, adjust weightages, and sign off on submitted performance matrices for your direct reports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setShowPushModal(true)}
            icon={<Share2 className="w-3.5 h-3.5" />}
          >
            Push KPI to Team
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={fetchTeamGoals}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="bg-surface p-12 rounded-2xl border border-border/80 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center mx-auto text-text-disabled">
            <User className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-text-primary font-bold">No active reports</p>
            <p className="text-text-secondary text-xs max-w-sm mx-auto">
              There are currently no employees assigned to report to you, or they have not initialized their goals yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {employees.map(group => {
            const totalWeight = group.goals.reduce((sum, g) => sum + Number(g.weightage), 0)
            const isPendingApproval = group.goals.some(g => g.status === 'pending')
            const isAllApproved = group.goals.length > 0 && group.goals.every(g => g.status === 'approved')
            const isReturned = group.goals.some(g => g.status === 'returned')
            const isDrafting = group.goals.length === 0 || group.goals.some(g => g.status === 'draft')

            return (
              <div 
                key={group.employeeId} 
                className="bg-surface rounded-2xl border border-border shadow-md overflow-hidden transition-all duration-300 hover:border-primary/20"
              >
                {/* Employee Header Metadata */}
                <div className="p-6 bg-surface-raised border-b border-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-subtle border border-primary/30 flex items-center justify-center text-primary font-heading font-extrabold text-sm">
                      {group.employeeName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                        {group.employeeName}
                        {isAllApproved && <Badge variant="emerald">All Locked & Approved</Badge>}
                        {isPendingApproval && <Badge variant="amber">Awaiting Review</Badge>}
                        {isReturned && <Badge variant="rose">Returned for Revision</Badge>}
                        {isDrafting && !isPendingApproval && !isReturned && !isAllApproved && (
                           <Badge variant="slate">Drafting / Not Started</Badge>
                        )}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary mt-0.5">
                        <span className="flex items-center gap-1"><Building className="w-3 h-3 text-text-disabled" /> {group.department}</span>
                        <span className="text-text-disabled">•</span>
                        <span>{group.employeeEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Weightage Summary & Master Actions */}
                  <div className="flex items-center gap-6 flex-wrap md:flex-nowrap shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-text-secondary block">Total Weightage</span>
                        <span className={`text-sm font-black font-numeric block mt-0.5 ${Math.round(totalWeight) === 100 ? 'text-success' : 'text-warning'}`}>
                          {totalWeight}% / 100%
                        </span>
                      </div>
                      
                      {/* Modern, sleek mini weightage bar */}
                      <div className="w-24 h-2 bg-bg border border-border/60 rounded-full overflow-hidden shrink-0 relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r ${
                            totalWeight === 100 
                              ? 'from-success to-emerald-400' 
                              : totalWeight > 100 
                                ? 'from-danger to-rose-400' 
                                : 'from-primary to-accent'
                          }`}
                          style={{ width: `${Math.min((totalWeight / 100) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {isPendingApproval && (
                      <div className="flex items-center gap-2.5 shrink-0 border-l border-border/80 pl-6">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => openReturnModal(group)}
                          icon={<RotateCcw className="w-3.5 h-3.5" />}
                          className="font-bold shadow-sm"
                        >
                          Return Sheet
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApproveSheet(group)}
                          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          className="font-bold shadow-sm"
                        >
                          Approve Sheet
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Goals List Table or Empty Placeholder */}
                {group.goals.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-raised/40 text-[10px] uppercase font-bold text-text-secondary border-b border-border/80">
                          <th className="px-6 py-3 w-1/4">Thrust Area & Title</th>
                          <th className="px-6 py-3 w-1/3">Target Details & Description</th>
                          <th className="px-6 py-3 text-center w-32">Weightage</th>
                          <th className="px-6 py-3 w-32">Deadline</th>
                          <th className="px-6 py-3 text-right w-40">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {group.goals.map(goal => {
                          const isEditing = editingGoalId === goal.id
                          const isGoalPending = goal.status === 'pending'

                          return (
                            <tr 
                              key={goal.id} 
                              className={`group hover:bg-surface-raised/20 transition-colors duration-150 ${isEditing ? 'bg-primary-subtle/10' : ''}`}
                            >
                              {/* Title & Thrust Area */}
                              <td className="px-6 py-4 align-top">
                                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-raised border border-border text-primary uppercase font-numeric mb-1 whitespace-nowrap">
                                  {goal.thrust_area}
                                </span>
                                <div className="font-bold text-sm text-text-primary group-hover:text-primary transition-colors leading-snug">
                                  {goal.title}
                                </div>
                                {goal.is_shared && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-primary bg-primary-subtle/20 border border-primary/20 px-1.5 py-0.2 mt-1 rounded">
                                    <Sparkles className="w-2.5 h-2.5" /> Shared Goal
                                  </span>
                                )}
                              </td>

                              {/* Targets & Desc */}
                              <td className="px-6 py-4 align-top">
                                {isEditing ? (
                                  <div className="space-y-2 max-w-xs mt-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-text-secondary shrink-0 w-16">Target:</span>
                                      <input
                                        type="number"
                                        value={editTarget}
                                        onChange={e => setEditTarget(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="Target value"
                                        className="flex-1 text-xs bg-surface border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary text-text-primary"
                                      />
                                    </div>
                                    <p className="text-[10px] text-text-disabled uppercase font-bold tracking-wider">UoM: {goal.uom.replace('_', ' ')}</p>
                                  </div>
                                ) : (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                      <span className="inline-flex items-center gap-1 bg-surface-raised border border-border px-2 py-0.5 rounded-lg text-xs font-black text-text-primary font-numeric shadow-sm">
                                        <TargetIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                                        <span>{goal.target !== null ? goal.target.toLocaleString() : 'N/A'}</span>
                                      </span>
                                      <span className="inline-block px-1.5 py-0.5 rounded bg-bg text-[9px] uppercase font-bold text-text-disabled tracking-wider border border-border/40">
                                        {goal.uom.replace('_', ' ')}
                                      </span>
                                    </div>
                                    <p className="text-xs text-text-secondary leading-relaxed">
                                      {goal.description || 'No description provided.'}
                                    </p>
                                  </div>
                                )}
                              </td>

                              {/* Weightage */}
                              <td className="px-6 py-4 align-top text-center">
                                {isEditing ? (
                                  <div className="flex items-center gap-1.5 justify-center max-w-[100px] mx-auto mt-0.5">
                                    <input
                                      type="number"
                                      min="10"
                                      max="100"
                                      value={editWeightage}
                                      onChange={e => setEditWeightage(Number(e.target.value))}
                                      className="w-16 text-center text-xs bg-surface border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary text-text-primary font-bold font-numeric"
                                    />
                                    <span className="text-xs text-text-secondary">%</span>
                                  </div>
                                ) : (
                                  <div className="flex justify-center mt-0.5">
                                    <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-numeric bg-primary-subtle text-primary border border-primary/20">
                                      {goal.weightage}%
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* Deadline */}
                              <td className="px-6 py-4 align-top text-xs text-text-secondary">
                                <div className="flex items-center gap-1.5 mt-1">
                                  <Calendar className="w-3.5 h-3.5 text-text-disabled" />
                                  <span className="font-semibold font-numeric">{goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'N/A'}</span>
                                </div>
                              </td>

                              {/* Action Buttons */}
                              <td className="px-6 py-4 align-top text-right">
                                {isEditing ? (
                                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={cancelEdit}
                                      icon={<X className="w-3.5 h-3.5" />}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => saveGoalApproval(goal)}
                                      icon={<Save className="w-3.5 h-3.5" />}
                                    >
                                      Save
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end gap-2 mt-0.5">
                                    {isGoalPending && (
                                      <>
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          onClick={() => startEdit(goal)}
                                          icon={<Edit3 className="w-3.5 h-3.5" />}
                                        >
                                          Adjust
                                        </Button>
                                        <Button
                                          variant="success"
                                          size="sm"
                                          onClick={() => saveGoalApproval(goal)}
                                          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                                        >
                                          Approve
                                        </Button>
                                      </>
                                    )}
                                    {goal.status === 'approved' && (
                                      <span className="text-[10px] text-success font-bold flex items-center gap-1 justify-end">
                                        <Lock className="w-3 h-3 text-success" /> Approved & Locked
                                      </span>
                                    )}
                                    {goal.status === 'returned' && (
                                      <span className="text-[10px] text-danger font-bold flex items-center gap-1 justify-end">
                                        Returned for Revision
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 border-t border-border/40 bg-surface-raised/10 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="p-3 rounded-full bg-surface border border-border text-text-disabled shadow-sm">
                      <TargetIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-text-primary text-xs font-bold">Goal Sheet Not Initialized</p>
                      <p className="text-text-secondary text-[11px] max-w-sm mx-auto">
                        This employee has not added or submitted any performance goals for the active cycle year.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Return Sheet Confirmation & Feedback Modal */}
      {returnModalEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" />
                Return Goals for Revision
              </h3>
              <button 
                onClick={closeReturnModal}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-sm text-text-secondary">
              <p>
                You are returning the complete goal sheet of <strong className="text-text-primary">{returnModalEmployee.employeeName}</strong> for updates.
              </p>
              <p className="text-xs">
                All goals in this cycle will be unlocked, allowing the employee to edit, re-budget weightages, and re-submit.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase">
                Feedback & Rework Comment
              </label>
              <textarea
                value={returnComment}
                onChange={e => setReturnComment(e.target.value)}
                placeholder="Specify what needs adjustments (e.g. increase focus on Revenue Growth, align weights to 100%)"
                className="w-full text-xs bg-surface-raised border border-border rounded-xl p-3 focus:outline-none focus:border-primary text-text-primary min-h-[100px] leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={closeReturnModal}
                disabled={returningSheet}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={returningSheet}
                onClick={handleReturnSheet}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Confirm Return
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* ── Push KPI to Team Modal ── */}
      {showPushModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold font-heading flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" /> Push Shared KPI
                </h2>
                <p className="text-xs text-text-secondary mt-1">Create a departmental goal and push it to your team. Title & Target will be read-only for recipients.</p>
              </div>
              <button onClick={() => setShowPushModal(false)} className="p-1.5 rounded-lg hover:bg-surface-raised text-text-secondary hover:text-text-primary transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Goal Title *</label>
                <input
                  value={pushGoalTitle}
                  onChange={e => setPushGoalTitle(e.target.value)}
                  placeholder="e.g. Achieve 95% Customer Satisfaction Score"
                  className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-sm text-text-primary placeholder-text-disabled focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Description</label>
                <textarea
                  value={pushGoalDesc}
                  onChange={e => setPushGoalDesc(e.target.value)}
                  rows={2}
                  placeholder="Optional description..."
                  className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-sm text-text-primary placeholder-text-disabled focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Thrust Area</label>
                  <select
                    value={pushGoalThrustArea}
                    onChange={e => setPushGoalThrustArea(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-sm text-text-primary focus:ring-2 focus:ring-primary/30 transition"
                  >
                    {['Revenue Growth','Cost Optimisation','Customer Success','People & Culture','Process Excellence','Innovation','Compliance & Safety','Digital & Tech'].map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">UoM</label>
                  <select
                    value={pushGoalUom}
                    onChange={e => setPushGoalUom(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-sm text-text-primary focus:ring-2 focus:ring-primary/30 transition"
                  >
                    <option value="numeric_min">Numeric — Higher is better</option>
                    <option value="numeric_max">Numeric — Lower is better</option>
                    <option value="percent_min">% — Higher is better</option>
                    <option value="percent_max">% — Lower is better</option>
                    <option value="timeline">Timeline</option>
                    <option value="zero">Zero-based</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Target</label>
                  <input
                    type="number"
                    value={pushGoalTarget}
                    onChange={e => setPushGoalTarget(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 95"
                    className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-sm text-text-primary placeholder-text-disabled focus:ring-2 focus:ring-primary/30 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Deadline</label>
                  <input
                    type="date"
                    value={pushGoalDeadline}
                    onChange={e => setPushGoalDeadline(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-sm text-text-primary focus:ring-2 focus:ring-primary/30 transition"
                  />
                </div>
              </div>

              {/* Team member selection */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Push to Team Members *</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                  {employees.map(emp => (
                    <label key={emp.employeeId} className="flex items-center gap-3 p-2.5 rounded-xl bg-bg border border-border hover:border-primary/30 transition cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pushSelectedEmployees.includes(emp.employeeId)}
                        onChange={e => {
                          if (e.target.checked) {
                            setPushSelectedEmployees(prev => [...prev, emp.employeeId])
                          } else {
                            setPushSelectedEmployees(prev => prev.filter(id => id !== emp.employeeId))
                          }
                        }}
                        className="rounded border-border text-primary focus:ring-primary/30"
                      />
                      <div className="w-7 h-7 rounded-full bg-primary-subtle border border-primary/30 flex items-center justify-center text-primary font-bold text-xs">
                        {emp.employeeName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{emp.employeeName}</p>
                        <p className="text-[10px] text-text-disabled">{emp.department}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {employees.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (pushSelectedEmployees.length === employees.length) {
                        setPushSelectedEmployees([])
                      } else {
                        setPushSelectedEmployees(employees.map(e => e.employeeId))
                      }
                    }}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    {pushSelectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setShowPushModal(false)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                loading={pushing}
                onClick={handlePushKPI}
                icon={<Share2 className="w-3.5 h-3.5" />}
              >
                Push to {pushSelectedEmployees.length} Member{pushSelectedEmployees.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
