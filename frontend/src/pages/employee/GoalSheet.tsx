import { useEffect, useState, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import {
  ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip,
  AreaChart, Area
} from 'recharts'
import { 
  Plus, 
  Send, 
  Edit3, 
  Trash2, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Info,
  RotateCcw,
  Target,
  BarChart3,
  Zap,
  Star,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Badge, Button, WeightageBar } from '../../components/common'
import GoalFormModal from '../../components/employee/GoalFormModal'
import { goalsService } from '../../services/goals'
import type { Goal } from '../../services/goals'
import CheckIn from './CheckIn'
import { useAuthStore } from '../../store/authStore'
import { achievementsService } from '../../services/achievements'
import type { AchievementGoal, CheckinComment } from '../../services/achievements'
import { calcScore } from '../../utils/scoreCalc'


// Map raw database UoM keys to beautiful display labels
const UOM_LABEL: Record<string, string> = {
  numeric_min: 'Numeric (Min)',
  percent_min: 'Percentage (Min)',
  numeric_max: 'Numeric (Max)',
  percent_max: 'Percentage (Max)',
  timeline: 'Timeline',
  zero: 'Zero Tolerance',
}

// Render stylized glassmorphic badges based on goal states
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return <Badge variant="emerald">Approved</Badge>
    case 'pending':
    case 'submitted':
      return <Badge variant="indigo">In Review</Badge>
    case 'returned':
      return <Badge variant="rose">Returned</Badge>
    default:
      return <Badge variant="slate">Draft</Badge>
  }
}

// ==========================================
// GOAL ROW COMPONENT
// ==========================================
function GoalRow({
  goal,
  onEdit,
  onDelete,
  canEdit,
  index,
}: {
  goal: Goal
  onEdit: (g: Goal) => void
  onDelete: (id: number) => void
  canEdit: boolean
  index: number
}) {
  const isGoalShared = !!goal.is_shared
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <tr className="hover:bg-surface-raised transition-colors group">
      {/* Index (Numeric) */}
      <td className="px-6 py-4 font-bold text-text-disabled font-numeric text-sm w-12">
        {index + 1}
      </td>
      
      {/* Goal Details */}
      <td className="px-6 py-4 max-w-md">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-text-primary text-sm leading-snug font-body">{goal.title}</span>
          {isGoalShared && (
            <Badge variant="indigo">Shared</Badge>
          )}
        </div>
        {goal.description && (
          <p className="text-xs text-text-secondary mt-1 line-clamp-1 leading-relaxed font-body">
            {goal.description}
          </p>
        )}
      </td>

      {/* Thrust Area */}
      <td className="px-6 py-4 w-44">
        <span className="text-xs font-semibold text-text-secondary bg-bg border border-border px-2.5 py-1 rounded-lg font-body whitespace-nowrap">
          {goal.thrust_area}
        </span>
      </td>

      {/* Target & UoM */}
      <td className="px-6 py-4 text-text-secondary text-sm w-44 font-body">
        {goal.target !== null ? (
          <div className="font-semibold text-text-primary">
            <span className="font-numeric">{goal.target.toLocaleString()}</span>{' '}
            <span className="text-text-secondary text-xs font-medium">({UOM_LABEL[goal.uom] || goal.uom})</span>
          </div>
        ) : goal.uom === 'zero' ? (
          <div className="font-semibold text-text-primary">
            <span className="font-numeric">0</span>{' '}
            <span className="text-text-secondary text-xs font-medium">({UOM_LABEL[goal.uom] || goal.uom})</span>
          </div>
        ) : (
          <span className="text-text-disabled font-medium">—</span>
        )}
      </td>

      {/* Weightage (Numeric) */}
      <td className="px-6 py-4 text-center w-28">
        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-numeric ${
          Number(goal.weightage) < 10 
            ? 'bg-danger-bg text-danger border border-danger/40' 
            : 'bg-primary-subtle text-primary border border-primary/40'
        }`}>
          {goal.weightage}%
        </span>
      </td>

      {/* Status */}
      <td className="px-6 py-4 w-32">
        <StatusBadge status={goal.status} />
      </td>

      {/* Deadline (Mono date) */}
      <td className="px-6 py-4 text-text-secondary text-xs font-medium font-mono w-36">
        {formatDate(goal.deadline)}
      </td>

      {/* Actions */}
      <td className="px-6 py-4 w-24">
        <div className="flex justify-end items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {canEdit && !goal.locked ? (
            <>
              <button
                onClick={() => onEdit(goal)}
                title="Edit Goal"
                className="p-2 bg-surface-raised border border-border hover:border-primary hover:bg-primary-subtle text-text-secondary hover:text-primary rounded-lg transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              {['draft', 'returned'].includes(goal.status) && (
                <button
                  onClick={() => onDelete(goal.id)}
                  title="Delete Goal"
                  className="p-2 bg-surface-raised border border-border hover:border-danger hover:bg-danger-bg text-text-secondary hover:text-danger rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          ) : (
            goal.locked && <Lock className="w-3.5 h-3.5 text-text-disabled mr-2" />
          )}
        </div>
      </td>
    </tr>
  )
}

// ==========================================
// GOALS PAGE COMPONENT
// ==========================================
function GoalsPage() {
  const { user } = useAuthStore()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await goalsService.list()
      setGoals(data)
    } catch {
      toast.error('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const goalCount = goals.length
  const totalWeightage = goals.reduce((s, g) => s + Number(g.weightage), 0)
  
  // Sheet-level derived statuses
  const hasApproved = goals.some(g => g.status === 'approved')
  const isSheetFullyApproved = goals.length > 0 && goals.every(g => g.status === 'approved') && Math.round(totalWeightage) === 100
  const isSheetFullySubmitted = goals.length > 0 && goals.every(g => g.status === 'approved' || g.status === 'submitted') && Math.round(totalWeightage) === 100
  const isSheetReturned = goals.length > 0 && goals.some(g => g.status === 'returned')
  
  let sheetStatus: 'approved' | 'submitted' | 'returned' | 'draft' = 'draft'
  if (isSheetFullyApproved) {
    sheetStatus = 'approved'
  } else if (isSheetFullySubmitted) {
    sheetStatus = 'submitted'
  } else if (isSheetReturned) {
    sheetStatus = 'returned'
  } else {
    sheetStatus = 'draft'
  }

  // individual goal locked check
  const isLocked = isSheetFullyApproved || isSheetFullySubmitted
  const canEdit = !isLocked
  
  // Rule check states
  const isCountValid = goalCount > 0 && goalCount <= 8
  const isWeightageValid = Math.round(totalWeightage) === 100
  const allWeightagesValid = goals.every((g) => Number(g.weightage) >= 10)
  
  // Can add goals if total weightage is not yet 100% and count < 8
  const canAdd = Math.round(totalWeightage) < 100 && goalCount < 8
  const hasSubmittable = goals.some((g) => ['draft', 'returned'].includes(g.status))
  const canSubmit = isCountValid && isWeightageValid && allWeightagesValid && hasSubmittable

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (g: Goal) => {
    setEditing(g)
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this goal?')) return
    try {
      await goalsService.delete(id)
      toast.success('Goal deleted successfully')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Delete failed')
    }
  }

  const handleSubmit = async () => {
    if (!isWeightageValid) {
      toast.error(`Total weightage is ${totalWeightage}%. Must be exactly 100% before submitting.`)
      return
    }
    const isAdmin = user?.role === 'admin'
    const confirmMsg = isAdmin 
      ? 'Publish and auto-approve all your performance goals?'
      : 'Submit all draft goals for manager approval?'
    
    if (!confirm(confirmMsg)) return
    setSubmitting(true)
    try {
      await goalsService.submit()
      toast.success(isAdmin ? 'Goals auto-approved and published!' : 'Goals submitted for approval!')
      load()
    } catch (err: any) {
      const errs = err.response?.data?.errors
      toast.error(errs ? errs.join(', ') : err.response?.data?.error || 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }


  // Group weightages by thrust area for segment breakdown visualization
  const thrustAreaDistribution = goals.reduce((acc, g) => {
    const area = g.thrust_area || 'Unassigned'
    acc[area] = (acc[area] || 0) + Number(g.weightage)
    return acc
  }, {} as Record<string, number>)

  const thrustColors: Record<string, string> = {
    'Process Excellence': 'bg-violet-500',      // Deep Purple/Violet
    'Customer Success': 'bg-amber-500',        // Golden Amber/Orange
    'Digital & Tech': 'bg-sky-500',            // Electric Sky Blue
    'Cost Optimisation': 'bg-rose-500',         // Hot Rose/Red
    'People & Culture': 'bg-teal-500',          // Cool Teal
    'Compliance & Safety': 'bg-emerald-500',    // Safe Emerald Green
    'Innovation': 'bg-fuchsia-500',            // Futuristic Fuchsia
    'Unassigned': 'bg-text-disabled'            // Muted Gray
  }

  // Status banner display matching context-aware semantic tokens exactly
  const renderStatusBanner = () => {
    switch (sheetStatus) {
      case 'approved':
        const isAdmin = user?.role === 'admin'
        return (
          <div className="bg-success-bg border border-success/40 rounded-2xl p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 backdrop-blur-md font-body">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-surface border border-success rounded-xl text-success">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-text-primary">
                  {isAdmin ? 'Goal Sheet Published & Approved' : 'Goal Sheet Approved & Locked'}
                </h4>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  {isAdmin 
                    ? 'Your goals have been published and auto-approved as Admin. Objectives are locked for changes.' 
                    : 'Your goals have been approved. Objectives are locked for changes. Quarterly check-ins open in July.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start md:self-center px-4 py-2 bg-surface border border-success rounded-xl text-success font-bold text-xs uppercase tracking-wider">
              <Lock className="w-4 h-4" /> Locked
            </div>
          </div>
        )
      case 'submitted':
        return (
          <div className="bg-primary-subtle border border-primary/40 rounded-2xl p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 backdrop-blur-md font-body">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-surface border border-primary rounded-xl text-primary">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-text-primary">Awaiting Manager Approval</h4>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  Your goals have been submitted for evaluation. Manager approval is pending.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start md:self-center px-4 py-2 bg-surface border border-primary rounded-xl text-primary font-bold text-xs uppercase tracking-wider">
              <Lock className="w-4 h-4 animate-pulse" /> Locked (In Review)
            </div>
          </div>
        )
      case 'returned':
        return (
          <div className="bg-danger-bg border border-danger/40 rounded-2xl p-6 mb-6 backdrop-blur-md font-body">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-surface border border-danger rounded-xl text-danger">
                <RotateCcw className="w-6 h-6 text-danger" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-text-primary">Revision Required — Goal Sheet Returned</h4>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  Your manager has returned your goal sheet for rework. Please modify the returned goals and re-submit.
                </p>
                <div className="mt-4 p-4 rounded-xl bg-surface border border-danger text-danger text-sm flex gap-2.5 items-start">
                  <Info className="w-4 h-4 mt-0.5 text-danger flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-text-primary">Rework Notice:</span> Check the returned goals for feedback, adjust targets or weightage, and click Submit.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        if (hasApproved) {
          return (
            <div className="bg-warning-bg border border-warning/40 rounded-2xl p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 backdrop-blur-md font-body animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-surface border border-warning rounded-xl text-warning">
                  <Sparkles className="w-6 h-6 text-warning animate-pulse" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-text-primary">Goal Sheet Partially Approved</h4>
                  <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                    Your manager has approved some objectives ({totalWeightage}% weightage). Please add goals for the remaining {100 - totalWeightage}% to complete your sheet.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start md:self-center px-4 py-2 bg-surface border border-warning rounded-xl text-warning font-bold text-xs uppercase tracking-wider">
                <Unlock className="w-4 h-4 text-warning" /> Action Required
              </div>
            </div>
          )
        }
        return (
          <div className="bg-surface border border-border rounded-2xl p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 backdrop-blur-md font-body">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary-subtle border border-primary rounded-xl text-primary">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-text-primary">Drafting Performance Goals</h4>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  Add objectives for FY {new Date().getFullYear()}. Weightage must sum to exactly 100% across 1 to 8 goals (min 10% each) to submit.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start md:self-center px-4 py-2 bg-bg border border-border rounded-xl text-text-secondary font-bold text-xs uppercase tracking-wider">
              <Unlock className="w-4 h-4 text-primary" /> Open for Edits
            </div>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6 font-body">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5 font-heading">
            <Target className="w-6 h-6 text-primary" /> 
            {user?.role === 'admin' 
              ? 'Admin Goal Dashboard' 
              : user?.role === 'manager' 
                ? 'Manager Goal Dashboard' 
                : 'Goal Sheet Dashboard'}
          </h1>
          <p className="text-sm text-text-secondary mt-1 font-medium">
            {user?.role === 'admin'
              ? `Admin Portal · Personal Performance Goals for FY ${new Date().getFullYear()}`
              : user?.role === 'manager'
                ? `Manager Portal · Personal Performance Goals for FY ${new Date().getFullYear()}`
                : `Welcome to the Employee Portal · FY ${new Date().getFullYear()} Goals`}
          </p>
        </div>
        
        {/* Header Actions */}
        {canAdd && (
          <Button 
            onClick={openAdd} 
            variant="primary" 
            icon={<Plus className="w-4 h-4" />}
            disabled={goalCount >= 8}
          >
            Add New Goal
          </Button>
        )}
      </div>

      {/* Annual appraisal cycle timeline visualizer */}
      <div className="bg-surface border border-border rounded-2xl p-6 font-body shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-4">
          <div className="space-y-1 shrink-0">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              FY Cycle Timeline
            </h3>
            <p className="text-xs text-text-secondary">Track your annual goal milestones</p>
          </div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-0 lg:flex-1 lg:max-w-3xl lg:justify-end pl-2 sm:pl-0 w-full sm:w-auto">
            {/* Mobile Vertical Timeline Connector Line */}
            <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-border/50 block sm:hidden" />

            {/* Step 1 */}
            <div className="flex items-center gap-3 sm:gap-2 relative group flex-1 w-full sm:w-auto">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-numeric border shrink-0 transition-all duration-300 z-10 ${
                ['draft', 'returned'].includes(sheetStatus)
                  ? 'bg-primary-subtle text-primary border-primary animate-pulse shadow-md shadow-primary/20 scale-105'
                  : 'bg-success-bg text-success border-success'
              }`}>
                {['draft', 'returned'].includes(sheetStatus) ? '1' : '✓'}
              </div>
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-xs font-bold text-text-primary">Drafting Goals</span>
                <span className="text-[10px] text-text-secondary leading-tight truncate font-medium">
                  {user?.role === 'admin' ? 'Admin builds sheet' : user?.role === 'manager' ? 'Manager builds sheet' : 'Employee builds sheet'}
                </span>
              </div>
              <div className="hidden sm:block flex-1 h-0.5 bg-border mx-2 min-w-[20px]" />
            </div>
            {/* Step 2 */}
            <div className="flex items-center gap-3 sm:gap-2 relative group flex-1 w-full sm:w-auto">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-numeric border shrink-0 transition-all duration-300 z-10 ${
                sheetStatus === 'submitted'
                  ? 'bg-primary-subtle text-primary border-primary animate-pulse shadow-md shadow-primary/20 scale-105'
                  : sheetStatus === 'approved'
                    ? 'bg-success-bg text-success border-success'
                    : 'bg-surface-raised text-text-disabled border-border'
              }`}>
                {sheetStatus === 'approved' ? '✓' : '2'}
              </div>
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-xs font-bold text-text-primary">Manager Review</span>
                <span className="text-[10px] text-text-secondary leading-tight truncate font-medium">Evaluation & approval</span>
              </div>
              <div className="hidden sm:block flex-1 h-0.5 bg-border mx-2 min-w-[20px]" />
            </div>
            {/* Step 3 */}
            <div className="flex items-center gap-3 sm:gap-2 relative group flex-1 w-full sm:w-auto">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-numeric border bg-surface-raised text-text-disabled border-border shrink-0 transition-all duration-300 z-10">
                3
              </div>
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-xs font-bold text-text-primary">Mid-Year Review</span>
                <span className="text-[10px] text-text-secondary leading-tight truncate font-medium">Continuous feedback</span>
              </div>
              <div className="hidden sm:block flex-1 h-0.5 bg-border mx-2 min-w-[20px]" />
            </div>
            {/* Step 4 */}
            <div className="flex items-center gap-3 sm:gap-2 relative group w-full sm:w-auto">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-numeric border bg-surface-raised text-text-disabled border-border shrink-0 transition-all duration-300 z-10">
                4
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-text-primary">Annual Appraisal</span>
                <span className="text-[10px] text-text-secondary leading-tight truncate font-medium">Final cycle scoring</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sheet Status Banner */}
      {renderStatusBanner()}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Goal Count */}
        <div className="bg-surface border border-border rounded-2xl p-5 backdrop-blur-md font-body shadow-sm h-full flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">Goal Count</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-text-primary font-numeric">{goalCount}</span>
              <span className="text-text-secondary text-sm font-numeric">/ Max 8 objectives</span>
            </div>
          </div>
          <div className="w-full bg-surface-raised h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${goalCount > 8 ? 'bg-danger' : 'bg-primary'}`}
              style={{ width: `${Math.min((goalCount / 8) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Goal Allocations (WeightageBar) */}
        <div className="md:col-span-2 flex flex-col">
          <WeightageBar totalWeightage={totalWeightage} />
        </div>
      </div>

      {/* Thrust Area Segment Distribution Breakdown */}
      {goals.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-5 font-body shadow-sm">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">Thrust Area Weightage Balance</span>
          <div className="h-4 bg-surface-raised rounded-full overflow-hidden flex mt-4 border border-border">
            {Object.entries(thrustAreaDistribution).map(([area, weight]) => (
              <div
                key={area}
                className={`${thrustColors[area] || 'bg-primary'} h-full transition-all duration-300`}
                style={{ width: `${(weight / totalWeightage) * 100}%` }}
                title={`${area}: ${weight}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-[10px] font-semibold">
            {Object.entries(thrustAreaDistribution).map(([area, weight]) => (
              <div key={area} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${thrustColors[area] || 'bg-primary'}`} />
                <span className="text-text-primary">{area}</span>
                <span className="text-text-secondary font-numeric">({weight}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals Table Card */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden backdrop-blur-md shadow-sm">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="text-text-secondary text-sm tracking-wide">Loading performance goals...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-surface border border-border rounded-2xl inline-flex items-center justify-center text-text-disabled mb-4">
              <Target className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">No goals added yet</h3>
            <p className="text-sm text-text-secondary mt-1.5 max-w-sm mx-auto leading-relaxed">
              Get started by creating your first performance objective. Remember that your total weightage must sum to exactly 100%.
            </p>
            {canEdit && (
              <Button onClick={openAdd} variant="primary" size="sm" className="mt-4" icon={<Plus className="w-4 h-4" />}>
                Add First Goal
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-bg text-[10px] font-bold text-text-secondary uppercase tracking-widest font-body">
                  <th className="px-6 py-4 w-12 font-semibold">#</th>
                  <th className="px-6 py-4 font-semibold">Goal Details</th>
                  <th className="px-6 py-4 w-44 font-semibold">Thrust Area</th>
                  <th className="px-6 py-4 w-44 font-semibold">Target & UoM</th>
                  <th className="px-6 py-4 w-28 text-center font-semibold">Weight</th>
                  <th className="px-6 py-4 w-32 font-semibold">Status</th>
                  <th className="px-6 py-4 w-36 font-semibold">Deadline</th>
                  <th className="px-6 py-4 w-24 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {goals.map((g, index) => (
                  <GoalRow
                    key={g.id}
                    goal={g}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    canEdit={canEdit && !['approved', 'submitted'].includes(g.status)}
                    index={index}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-bg text-xs font-semibold text-text-primary font-body">
                  <td colSpan={4} className="px-6 py-4 text-text-secondary">
                    Total objectives: <span className="font-numeric">{goalCount}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-numeric border ${
                      isWeightageValid 
                        ? 'bg-success-bg text-success border-success/40' 
                        : 'bg-danger-bg text-danger border-danger/40'
                    }`}>
                      {totalWeightage}%
                    </span>
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile Goal Cards List (sm:hidden) */}
          <div className="block sm:hidden divide-y divide-border/60">
            {goals.map((g, index) => {
              const isGoalShared = !!g.is_shared
              const formatDate = (dateStr: string | null) => {
                if (!dateStr) return '-'
                const d = new Date(dateStr)
                return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
              }
              const goalCanEdit = canEdit && !['approved', 'submitted'].includes(g.status)

              return (
                <div key={g.id} className="p-4 space-y-3.5 hover:bg-surface-raised/20 transition-all duration-200 animate-fade-in">
                  {/* Row 1: Index, Title, Shared Badge & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="font-bold text-text-disabled font-numeric text-xs shrink-0 mt-0.5">
                        #{index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-text-primary text-sm leading-snug break-words">
                            {g.title}
                          </span>
                          {isGoalShared && <Badge variant="indigo">Shared</Badge>}
                        </div>
                        {g.description && (
                          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                            {g.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={g.status} />
                    </div>
                  </div>

                  {/* Row 2: Grid of Thrust Area, Target & Weightage */}
                  <div className="grid grid-cols-2 gap-3 bg-surface-raised/40 p-3 rounded-xl border border-border/50 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-bold">Thrust Area</span>
                      <span className="font-semibold text-text-primary break-words">{g.thrust_area}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-bold">Weight</span>
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold font-numeric ${
                        Number(g.weightage) < 10 
                          ? 'bg-danger-bg text-danger border border-danger/25' 
                          : 'bg-primary-subtle text-primary border-primary/25'
                      }`}>
                        {g.weightage}%
                      </span>
                    </div>

                    <div className="space-y-1 col-span-2 border-t border-border/40 pt-2 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-bold">Target</span>
                        <span className="font-bold text-text-primary font-numeric text-xs mt-0.5 block">
                          {g.target !== null ? g.target.toLocaleString() : g.uom === 'zero' ? '0' : '—'}{' '}
                          <span className="text-text-secondary text-[10px] font-medium">({UOM_LABEL[g.uom] || g.uom})</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-bold">Deadline</span>
                        <span className="font-mono text-[10px] text-text-secondary font-medium mt-0.5 block">{formatDate(g.deadline)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Action Buttons */}
                  {goalCanEdit && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEdit(g)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
                        icon={<Edit3 className="w-3.5 h-3.5" />}
                      >
                        Edit Goal
                      </Button>
                      {['draft', 'returned'].includes(g.status) && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(g.id)}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                  {g.locked && (
                    <div className="flex items-center justify-end gap-1.5 text-text-disabled text-[10px] font-semibold pt-1 italic">
                      <Lock className="w-3.5 h-3.5" /> Locked (Active/Submitted)
                    </div>
                  )}
                </div>
              )
            })}

            {/* Mobile Card Footer Summary */}
            <div className="bg-surface-raised/40 border-t border-border/60 p-4 font-body">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-text-secondary">Total Objectives: <span className="font-numeric text-text-primary">{goalCount}</span></span>
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary">Total Weight:</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-numeric border ${
                    isWeightageValid 
                      ? 'bg-success-bg text-success border-success/40' 
                      : 'bg-danger-bg text-danger border-danger/40'
                  }`}>
                    {totalWeightage}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      </div>

      {/* Floating/Bottom Submit Actions Bar */}
      {goals.length > 0 && hasSubmittable && canEdit && (
        <div className="bg-primary-subtle border border-primary/20 rounded-2xl p-6 backdrop-blur-md flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
              Submit Checklist
            </h4>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 font-body">
                <span className={isCountValid ? 'text-success animate-pulse' : 'text-text-disabled'}>
                  {isCountValid ? '✓' : '✗'}
                </span>
                <span className={isCountValid ? 'text-text-primary' : 'text-text-disabled'}>
                  Goal Count (<span className="font-numeric">{goalCount}</span> of Max 8)
                </span>
              </span>
              <span className="flex items-center gap-1.5 font-body">
                <span className={allWeightagesValid ? 'text-success animate-pulse' : 'text-text-disabled'}>
                  {allWeightagesValid ? '✓' : '✗'}
                </span>
                <span className={allWeightagesValid ? 'text-text-primary' : 'text-text-disabled'}>
                  Min 10% per Goal Check
                </span>
              </span>
              <span className="flex items-center gap-1.5 font-body">
                <span className={isWeightageValid ? 'text-success animate-pulse' : 'text-text-disabled'}>
                  {isWeightageValid ? '✓' : '✗'}
                </span>
                <span className={isWeightageValid ? 'text-text-primary' : 'text-text-disabled'}>
                  Total Weightage equals <span className="font-numeric">100%</span>
                </span>
              </span>
            </div>
          </div>
          
          <Button
            onClick={handleSubmit}
            variant="success"
            disabled={!canSubmit}
            loading={submitting}
            size="lg"
            className="shadow-xl w-full lg:w-auto justify-center"
            icon={<Send className="w-4.5 h-4.5" />}
          >
            {user?.role === 'admin' ? 'Publish & Auto-Approve Sheet' : 'Submit Goal Sheet'}
          </Button>
        </div>
      )}

      {/* Goal Form Modal */}
      <GoalFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={load}
        goalToEdit={editing}
        currentGoals={goals}
      />
    </div>
  )
}

// ==========================================
// 1. GOAL INSIGHTS PAGE (ANALYTICS)
// ==========================================
function GoalInsightsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [quarterlyScores, setQuarterlyScores] = useState<Record<string, number>>({ Q1: 0, Q2: 0, Q3: 0, Q4: 0 })

  useEffect(() => {
    setLoading(true)
    Promise.all([
      goalsService.list(),
      achievementsService.list({ quarter: 'Q1' }).catch(() => []),
      achievementsService.list({ quarter: 'Q2' }).catch(() => []),
      achievementsService.list({ quarter: 'Q3' }).catch(() => []),
      achievementsService.list({ quarter: 'Q4' }).catch(() => []),
    ])
    .then(([goalsData, q1Data, q2Data, q3Data, q4Data]) => {
      setGoals(goalsData)
      
      const computeWeightedQuarterScore = (achievementGoals: AchievementGoal[]) => {
        if (!achievementGoals || achievementGoals.length === 0) return 0
        let totalWeighted = 0
        let totalWeightageInQuarter = 0
        
        achievementGoals.forEach(g => {
          const w = Number(g.weightage || 0)
          totalWeightageInQuarter += w
          
          const actualNum = g.actual !== null ? Number(g.actual) : 0
          const targetNum = g.target !== null ? Number(g.target) : 0
          
          let score = 0
          try {
            score = calcScore(g.uom, targetNum, actualNum, g.deadline || undefined, g.completion_date || undefined)
            if (isNaN(score) || !isFinite(score)) score = 0
          } catch {
            score = 0
          }
          
          totalWeighted += (score * w) / 100
        })
        
        return totalWeightageInQuarter > 0 ? Math.round((totalWeighted / totalWeightageInQuarter) * 100) : 0
      }

      setQuarterlyScores({
        Q1: computeWeightedQuarterScore(q1Data),
        Q2: computeWeightedQuarterScore(q2Data),
        Q3: computeWeightedQuarterScore(q3Data),
        Q4: computeWeightedQuarterScore(q4Data),
      })
    })
    .catch(() => toast.error('Failed to load insights data'))
    .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-body">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <p className="text-text-secondary text-sm mt-4 animate-pulse">Analyzing objectives data...</p>
      </div>
    )
  }

  const goalCount = goals.length
  const totalWeightage = goals.reduce((s, g) => s + Number(g.weightage), 0)
  
  const thrustAreaDistribution = goals.reduce((acc, g) => {
    const area = g.thrust_area || 'Unassigned'
    acc[area] = (acc[area] || 0) + Number(g.weightage)
    return acc
  }, {} as Record<string, number>)

  const activeThrustAreasCount = Object.keys(thrustAreaDistribution).filter(k => k !== 'Unassigned').length
  const alignmentScore = goals.length === 0 ? 0 : Math.min(100, Math.round((activeThrustAreasCount / 4) * 100))

  // Run diagnostics checks
  const warnings: string[] = []
  if (goals.some(g => Number(g.weightage) < 15)) {
    warnings.push('Some objectives have low weightage allocation (< 15%). Consider focusing impact.')
  }
  if (goals.some(g => !g.target)) {
    warnings.push('Draft goals missing numerical targets or UOM definitions detected.')
  }
  if (goals.length > 0 && activeThrustAreasCount < 2) {
    warnings.push('Objectives are concentrated in a single thrust area. Consider diversifying focus.')
  }

  const thrustColors: Record<string, string> = {
    'Process Excellence': 'bg-violet-500',      // Deep Purple/Violet
    'Customer Success': 'bg-amber-500',        // Golden Amber/Orange
    'Digital & Tech': 'bg-sky-500',            // Electric Sky Blue
    'Cost Optimisation': 'bg-rose-500',         // Hot Rose/Red
    'People & Culture': 'bg-teal-500',          // Cool Teal
    'Compliance & Safety': 'bg-emerald-500',    // Safe Emerald Green
    'Innovation': 'bg-fuchsia-500',            // Futuristic Fuchsia
    'Unassigned': 'bg-text-disabled'            // Muted Gray
  }

  const thrustColorsHex: Record<string, string> = {
    'Process Excellence': '#8b5cf6',      // Violet
    'Customer Success': '#f59e0b',        // Amber
    'Digital & Tech': '#06b6d4',          // Cyan
    'Cost Optimisation': '#f43f5e',       // Rose
    'People & Culture': '#14b8a6',        // Teal
    'Compliance & Safety': '#10b981',      // Emerald
    'Innovation': '#d946ef',              // Fuchsia
    'Unassigned': '#9ca3af'               // Gray
  }

  const isDemoActive = goals.length === 0
  const activeGoals = goals.length > 0 ? goals : [
    { title: 'Optimize API Response Latency', weightage: 30, thrust_area: 'Digital & Tech', locked: true, status: 'approved' },
    { title: 'Redesign Mobile Dashboard Experience', weightage: 25, thrust_area: 'Process Excellence', locked: true, status: 'approved' },
    { title: 'Establish 99.9% Core Service Uptime', weightage: 25, thrust_area: 'Compliance & Safety', locked: true, status: 'approved' },
    { title: 'Integrate Smart AI Goal CoPilot', weightage: 20, thrust_area: 'Innovation', locked: true, status: 'approved' },
  ] as Goal[]

  // Recalculate demo distribution if no goals exist
  const displayDistribution = isDemoActive ? {
    'Digital & Tech': 30,
    'Process Excellence': 25,
    'Compliance & Safety': 25,
    'Innovation': 20
  } : thrustAreaDistribution

  const displayCount = isDemoActive ? 4 : goalCount
  const displayWeightage = isDemoActive ? 100 : totalWeightage
  const displayActiveAreas = isDemoActive ? 4 : activeThrustAreasCount
  const displayAlignment = isDemoActive ? 100 : alignmentScore

  const distData = Object.keys(displayDistribution)
    .filter(k => displayDistribution[k] > 0)
    .map(area => ({
      name: area,
      value: displayDistribution[area] || 0
    }))

  const barData = activeGoals.map(g => ({
    name: g.title.length > 25 ? g.title.substring(0, 22) + '...' : g.title,
    weightage: Number(g.weightage),
    fullName: g.title
  }))

  const hasRealQuarterlyScores = Object.values(quarterlyScores).some(s => s > 0)
  
  const displayQuarterlyScores = hasRealQuarterlyScores ? quarterlyScores : {
    Q1: 72,
    Q2: 84,
    Q3: 91,
    Q4: 96
  }

  const areaData = [
    { name: 'Q1', score: displayQuarterlyScores.Q1 },
    { name: 'Q2', score: displayQuarterlyScores.Q2 },
    { name: 'Q3', score: displayQuarterlyScores.Q3 },
    { name: 'Q4', score: displayQuarterlyScores.Q4 },
  ]

  return (
    <div className="space-y-8 animate-fade-in font-body">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight font-heading">Goal Analytics & Insights</h1>
          <p className="text-sm text-text-secondary mt-1">
            Visual metrics and SMART alignment diagnostics for your active objectives.
          </p>
        </div>
        {isDemoActive && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-primary-subtle text-primary border border-primary/20 shadow-sm self-start sm:self-auto animate-fade-in">
            <BarChart3 className="w-3.5 h-3.5 animate-pulse" /> Simulated Demo Insights
          </span>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Goals */}
        <div className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/40 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Objectives count</span>
            <span className="p-2 bg-primary-subtle text-primary border border-primary/20 rounded-xl group-hover:scale-110 transition-transform">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary font-numeric">{displayCount}</span>
            <span className="text-xs font-medium text-text-disabled">/ 8 max</span>
          </div>
          <p className="text-xs text-text-secondary mt-2">Optimal allocation: 3 to 6 goals.</p>
        </div>

        {/* Total Weightage */}
        <div className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/40 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Weightage Allocated</span>
            <span className={`p-2 rounded-xl group-hover:scale-110 transition-transform ${
              Math.round(displayWeightage) === 100 
                ? 'bg-success-bg text-success border border-success/20' 
                : 'bg-danger-bg text-danger border border-danger/20'
            }`}>
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary font-numeric">{displayWeightage}%</span>
            <span className="text-xs font-medium text-text-disabled">/ 100%</span>
          </div>
          <p className="text-xs text-text-secondary mt-2">
            {Math.round(displayWeightage) === 100 ? 'Perfect weightage distribution!' : 'Must sum to exactly 100%.'}
          </p>
        </div>

        {/* Thrust Area Focus */}
        <div className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/40 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Area Alignment</span>
            <span className="p-2 bg-primary-subtle text-primary border border-primary/20 rounded-xl group-hover:scale-110 transition-transform">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary font-numeric">{displayActiveAreas}</span>
            <span className="text-xs font-medium text-text-disabled">/ 4 Areas</span>
          </div>
          <p className="text-xs text-text-secondary mt-2">Addressing core performance dimensions.</p>
        </div>

        {/* Corporate Alignment Index */}
        <div className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/40 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Alignment Index</span>
            <span className="p-2 bg-primary-subtle text-primary border border-primary/20 rounded-xl group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary font-numeric">{displayAlignment}%</span>
          </div>
          <p className="text-xs text-text-secondary mt-2">Core corporate strategy integration rate.</p>
        </div>
      </div>

      {/* Dynamic Recharts Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        
        {/* Thrust Area Distribution Donut Chart */}
        <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-sm transition-all duration-300 hover:shadow-md min-w-0 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-heading font-bold text-text-primary text-base">Thrust Area Weightage Balance</h3>
            <p className="text-xs text-text-secondary mt-0.5">Visual split of weightage across performance pillars</p>
          </div>
          
          <div className="h-60 w-full flex items-center justify-center relative">
            {distData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={distData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {distData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={thrustColorsHex[entry.name] || '#9ca3af'} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      backgroundColor: 'var(--color-surface)', 
                      border: '1px solid var(--color-border)', 
                      boxShadow: 'var(--shadow-lg)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-text-disabled py-10">No active goal distributions to display</div>
            )}
          </div>
          
          {/* Custom Legend to make it extremely premium */}
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-3 pt-3 border-t border-border/40">
            {distData.map((entry, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px] font-semibold text-text-secondary">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: thrustColorsHex[entry.name] }} />
                <span>{entry.name}: {entry.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Goal Weightage Breakdown Bar Chart */}
        <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-sm transition-all duration-300 hover:shadow-md min-w-0 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-heading font-bold text-text-primary text-base">Goal Impact Breakdown</h3>
            <p className="text-xs text-text-secondary mt-0.5">Comparing relative weights of each objective</p>
          </div>
          
          <div className="h-60 w-full">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={barData} layout="vertical" margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <defs>
                    <linearGradient id="goalBarGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--color-primary-subtle)" stopOpacity={0.6}/>
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--color-text-secondary)', fontWeight: 600 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: 'var(--color-text-secondary)', fontWeight: 600 }} tickLine={false} axisLine={false} width={80} />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(99, 102, 241, 0.03)', radius: 6 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-surface border border-border p-3 rounded-xl shadow-lg font-body text-xs space-y-1 max-w-[200px]">
                            <p className="font-bold text-text-primary leading-snug">{data.fullName}</p>
                            <p className="text-text-secondary font-medium">Weightage: <span className="font-bold text-primary font-numeric">{data.weightage}%</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="weightage" name="Weightage" fill="url(#goalBarGradient)" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-text-disabled py-10 flex items-center justify-center h-full">No active objectives to display</div>
            )}
          </div>
          <div className="text-[10px] text-text-disabled text-center mt-3 pt-3 border-t border-border/40 w-full">
            Higher weightage represents critical core strategic focus.
          </div>
        </div>

      </div>

      {/* Continuous Performance Velocity (Full Width Area Chart) */}
      <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-sm transition-all duration-300 hover:shadow-md min-w-0 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading font-bold text-text-primary text-base">Continuous Performance Velocity</h3>
            <p className="text-xs text-text-secondary mt-0.5">Calculated score progress across the quarterly milestones</p>
          </div>
          {!hasRealQuarterlyScores && (
            <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-primary-subtle text-primary border border-primary/20 animate-pulse">Demo Trajectory</span>
          )}
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)', fontWeight: 600 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--color-text-secondary)', fontWeight: 600 }} tickLine={false} axisLine={false} />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-surface border border-border p-3 rounded-xl shadow-lg font-body text-xs space-y-1">
                        <p className="font-bold text-text-primary leading-snug">{data.name} Performance Score</p>
                        <p className="text-text-secondary font-medium">Achievement Index: <span className="font-bold text-primary font-numeric">{data.score}%</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#scoreAreaGradient)" dot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-surface)' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Proportions Breakdown & SMART Auditor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Proportions balance */}
        <div className="bg-surface border border-border rounded-2xl p-6 lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Thrust Area Focus Proportions</h3>
            <p className="text-xs text-text-secondary mt-0.5">Proportional weightage distribution of active performance targets.</p>
          </div>

          <div className="space-y-5">
            {Object.keys(thrustColors).filter(c => c !== 'Unassigned').map((area) => {
              const weight = displayDistribution[area] || 0
              const percent = displayWeightage > 0 ? Math.round((weight / displayWeightage) * 100) : 0
              return (
                <div key={area} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-text-primary">{area}</span>
                    <span className="text-text-secondary font-numeric">{weight}% ({percent}%)</span>
                  </div>
                  <div className="h-2 w-full bg-surface-raised rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${thrustColors[area] || 'bg-primary'} transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: SMART Diagnostics */}
        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-warning">
              <ShieldAlert className="w-5 h-5 text-warning" />
              <h3 className="text-base font-semibold text-text-primary">SMART Diagnostics</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Automatic validation engine scanning for structural optimization suggestions.
            </p>

            <div className="space-y-3 pt-2">
              {warnings.length > 0 ? (
                warnings.map((warn, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-text-secondary bg-surface-raised p-3 rounded-xl border border-border">
                    <span className="text-warning font-bold">!</span>
                    <span>{warn}</span>
                  </div>
                ))
              ) : (
                <div className="bg-success-bg border border-success/30 text-success p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <span>✓</span> All objectives are fully SMART optimized!
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <p className="text-[10px] text-text-disabled text-center">
              Diagnostics scans run in realtime during draft edits.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 2. MANAGER FEEDBACK PAGE (CONTINUOUS REVIEW)
// ==========================================
function FeedbackPage() {
  const { user } = useAuthStore()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [responseNote, setResponseNote] = useState('')
  const [savingResponse, setSavingResponse] = useState(false)
  const [selectedQuarter, setSelectedQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1')
  const [comments, setComments] = useState<CheckinComment[]>([])

  // Dynamic names for dialogue thread based on logged-in user's role
  let dialogueEmployeeName = user?.name || 'Sreemouna'
  let dialogueSupervisorName = 'Hansika'
  let dialogueSupervisorRole = 'Team Manager'
  let dialogueSupervisorAvatar = 'H'

  if (user?.role === 'manager') {
    dialogueEmployeeName = 'Hansika'
    dialogueSupervisorName = 'Nikhil'
    dialogueSupervisorRole = 'Director of Engineering'
    dialogueSupervisorAvatar = 'N'
  } else if (user?.role === 'admin') {
    dialogueEmployeeName = 'Nikhil'
    dialogueSupervisorName = 'Alok'
    dialogueSupervisorRole = 'VP of Engineering / CEO'
    dialogueSupervisorAvatar = 'A'
  }

  const fetchDialogueStream = useCallback(async () => {
    try {
      const [goalsData, commentsData] = await Promise.all([
        goalsService.list(),
        achievementsService.getComments().catch(() => [])
      ])
      setGoals(goalsData)
      setComments(commentsData)
    } catch {
      toast.error('Failed to load review dialogue stream')
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchDialogueStream().finally(() => setLoading(false))
  }, [fetchDialogueStream])

  const handleSaveResponse = async () => {
    if (!responseNote.trim()) {
      toast.error('Response remarks cannot be empty')
      return
    }
    if (!user?.id) {
      toast.error('Session expired. Please log in again.')
      return
    }

    try {
      setSavingResponse(true)
      await achievementsService.postComment({
        employee_id: user.id,
        quarter: selectedQuarter,
        comment: responseNote.trim()
      })
      toast.success(`Self-review remarks successfully posted for ${selectedQuarter}!`)
      setResponseNote('')
      // Refresh stream
      const commentsData = await achievementsService.getComments().catch(() => [])
      setComments(commentsData)
    } catch {
      toast.error('Failed to transmit dialogue remarks')
    } finally {
      setSavingResponse(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-body">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <p className="text-text-secondary text-sm mt-4 animate-pulse">Loading review dialogue stream...</p>
      </div>
    )
  }

  const sheetStatus = goals.length > 0 ? goals[0].status : 'draft'
  const returnedGoals = goals.filter(g => g.status === 'returned')
  const hasApproved = goals.some(g => g.status === 'approved')
  const totalWeightage = goals.reduce((sum, g) => sum + (g.status === 'approved' ? Number(g.weightage || 0) : 0), 0)

  // Filter comments for the active selected quarter
  const activeComments = comments.filter(c => c.quarter === selectedQuarter)

  return (
    <div className="space-y-8 animate-fade-in font-body">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight font-heading">Continuous Review Feedback</h1>
        <p className="text-sm text-text-secondary mt-1">
          Review historical sign-offs, {user?.role === 'employee' ? 'manager evaluations' : 'supervisor evaluations'}, and submit responses.
        </p>
      </div>

      {/* Review Status Banner (Full Width) */}
      {sheetStatus === 'returned' && (
        <div className="bg-danger-bg border border-danger/40 rounded-2xl p-5 flex items-start gap-4">
          <span className="p-3 bg-surface border border-danger rounded-xl text-danger">
            <ShieldAlert className="w-5 h-5" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-text-primary">Goals Returned for Revision</h4>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Your manager has returned {returnedGoals.length} objective(s) requesting changes. Please review comments and adjust weightage or description fields below.
            </p>
          </div>
        </div>
      )}

      {sheetStatus === 'submitted' && (
        <div className="bg-primary-subtle border border-primary/40 rounded-2xl p-5 flex items-start gap-4">
          <span className="p-3 bg-surface border border-primary rounded-xl text-primary">
            <Clock className="w-5 h-5 animate-pulse" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-text-primary">Review in Progress</h4>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Your goal sheet was submitted and is under manager review. Updates will appear here as soon as approved or returned.
            </p>
          </div>
        </div>
      )}

      {sheetStatus === 'approved' && (
        <div className="bg-success-bg border border-success/40 rounded-2xl p-5 flex items-start gap-4">
          <span className="p-3 bg-surface border border-success rounded-xl text-success">
            <CheckCircle2 className="w-5 h-5" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-text-primary">Goal Cycle Locked & Approved</h4>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Your goal sheet has been signed off. Objectives are locked. Mid-Year check-ins open in July.
            </p>
          </div>
        </div>
      )}

      {sheetStatus === 'draft' && (
        <div className={`border rounded-2xl p-5 flex items-start gap-4 ${
          hasApproved
            ? 'bg-warning-bg border-warning/40'
            : 'bg-surface border-border'
        }`}>
          <span className={`p-3 bg-surface border rounded-xl ${
            hasApproved ? 'border-warning text-warning' : 'border-border text-text-secondary'
          }`}>
            <Info className="w-5 h-5" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-text-primary">
              {hasApproved ? 'Goal Sheet Partially Approved' : 'Goal Sheet in Draft'}
            </h4>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              {hasApproved
                ? `Your manager has approved some goals (${totalWeightage}% weightage). Please click "+ Add New Goal" to allocate the remaining ${100 - totalWeightage}% and submit for approval.`
                : 'Submit your goal sheet for manager review once your total weightage equals exactly 100%.'
              }
            </p>
          </div>
        </div>
      )}

      {/* Review Dialogue & Response Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left/Middle Columns: Dialogue Stream */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div>
                <h3 className="text-base font-semibold text-text-primary">Appraisal Review Dialogue</h3>
                <p className="text-xs text-text-secondary mt-0.5">Continuous feedback history and manager alignments</p>
              </div>
              
              {/* Quarter Selector Switcher */}
              <div className="w-full sm:w-auto grid grid-cols-4 sm:flex items-center gap-1 bg-surface-raised border border-border p-1 rounded-xl">
                {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => (
                  <button
                    key={q}
                    onClick={() => setSelectedQuarter(q)}
                    className={`w-full sm:w-auto sm:px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                      selectedQuarter === q
                        ? 'bg-primary text-primary-on shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Comments Dialogue Feed */}
            <div className="space-y-5 max-h-[350px] overflow-y-auto pr-1">
              {activeComments.length > 0 ? (
                <div className="relative border-l border-border pl-6 space-y-6 ml-3 py-2">
                  {activeComments.map((c, i) => {
                    const isManager = c.manager_name && !c.employee_name;
                    return (
                      <div key={c.id || i} className="relative">
                        <span className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-surface flex items-center justify-center text-[8px] text-white ${
                          isManager ? 'bg-amber-500' : 'bg-primary'
                        }`}>
                          {isManager ? dialogueSupervisorAvatar : 'E'}
                        </span>
                        <div className="bg-surface-raised border border-border/60 rounded-2xl p-4 space-y-1.5 shadow-sm transition-all hover:border-primary/25">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-text-primary">
                              {isManager ? `${c.manager_name || dialogueSupervisorName} (${dialogueSupervisorRole})` : `${c.employee_name || dialogueEmployeeName} (You)`}
                            </span>
                            <span className="text-[9px] font-bold text-text-disabled uppercase font-mono">
                              {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                            {c.comment}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="relative border-l border-border pl-6 space-y-6 ml-3 py-2">
                  {/* Default Events to keep it extremely professional if no custom comments exist */}
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-success border-2 border-surface flex items-center justify-center text-[8px] text-white">✓</span>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-text-disabled uppercase font-mono">Cycle Initialization</span>
                      <h4 className="text-xs font-bold text-text-primary">Goal Sheet Drafting Completed</h4>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Goal sheet finalized and submitted with balanced SMART objectives across 4 core Thrust Areas.
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-primary border-2 border-surface flex items-center justify-center text-[8px] text-white">i</span>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-text-disabled uppercase font-mono">AI Verification</span>
                      <h4 className="text-xs font-bold text-text-primary">SMART AI Optimization Complete</h4>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Goal descriptions adjusted and polished using the integrated SMART AI Goal Copilot assistant.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dialogue response widget */}
        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3 flex-1 flex flex-col">
            <h3 className="text-base font-semibold text-text-primary">Continuous Dialogue Remarks</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Add a summary evaluation, request a touch base, or reply to {user?.role === 'employee' ? 'manager feedback' : 'supervisor feedback'} for <strong className="font-semibold">{selectedQuarter}</strong> directly inside this thread.
            </p>
            <textarea
              value={responseNote}
              onChange={(e) => setResponseNote(e.target.value)}
              placeholder={`Add your ${selectedQuarter} remarks here...`}
              className="w-full flex-1 min-h-[140px] px-3 py-2.5 text-xs bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary placeholder-text-disabled leading-relaxed resize-none"
            />
          </div>
          <Button
            onClick={handleSaveResponse}
            loading={savingResponse}
            variant="primary"
            size="sm"
            className="w-full shadow-md"
            icon={<Send className="w-3.5 h-3.5" />}
          >
            Transmit Dialogue
          </Button>
        </div>

      </div>
    </div>
  )
}

// ==========================================
// 3. APPRAISAL BOARD PAGE (FINAL CYCLE)
// ==========================================
function AppraisalPage() {
  const { user } = useAuthStore()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    goalsService.list()
      .then(setGoals)
      .catch(() => toast.error('Failed to load appraisal board'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-body">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <p className="text-text-secondary text-sm mt-4 animate-pulse">Loading appraisal scorecard...</p>
      </div>
    )
  }

  // Dynamic sign-off verification details based on current user role
  let signoffHeader = 'Manager Verification'
  let signoffName = 'Hansika'
  let signoffRole = 'Team Manager'
  let signoffAvatar = 'H'
  let signoffComment = `"Consistently drove core technology optimizations and led team goals to completion. Performance metrics on target metrics are exceptional."`

  if (user?.role === 'manager') {
    signoffHeader = 'Supervisor Verification'
    signoffName = 'Nikhil'
    signoffRole = 'Director of Engineering'
    signoffAvatar = 'N'
    signoffComment = `"Hansika displayed outstanding leadership, successfully aligning team objectives with corporate goals. Her engineering team met all milestones ahead of schedule."`
  } else if (user?.role === 'admin') {
    signoffHeader = 'Executive Board Verification'
    signoffName = 'Alok'
    signoffRole = 'VP of Engineering / CEO'
    signoffAvatar = 'A'
    signoffComment = `"Exceptional governance and strategic alignment. Nikhil spearheaded robust operations and led organizational performance scaling perfectly."`
  }

  // Competency Ratings mock list
  const competencies = [
    { name: 'Technical Execution & Speed', score: 4.8, description: 'Demonstrated exceptional quality and rapid turnarounds in standard feature deliveries.' },
    { name: 'Innovation & SMART Design Solutions', score: 5.0, description: 'Spearheaded premium UI upgrades and integrated dynamic SMART AI modules seamlessly.' },
    { name: 'Cross-Functional Collaboration', score: 4.5, description: 'Aligned goal objectives directly with strategic enterprise partners and team missions.' },
    { name: 'Self-Drive & Enterprise Ownership', score: 4.6, description: 'Consistently took ownership of process efficiency targets across complex workflows.' }
  ]

  return (
    <div className="space-y-8 animate-fade-in font-body">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight font-heading">Annual Appraisal Scorecard</h1>
        <p className="text-sm text-text-secondary mt-1">
          Final performance scoring, core competency ratings, and corporate sign-offs.
        </p>
      </div>

      {/* Cycle Progress Visualizer */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-5">Appraisal Cycle</h3>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
          <div className="hidden md:block absolute top-[15px] left-10 right-10 h-0.5 bg-border -z-0" />
          
          <div className="flex items-center gap-3 bg-surface px-3 py-1 rounded-xl z-10 w-full md:w-auto">
            <span className="w-7 h-7 rounded-full bg-success text-white flex items-center justify-center text-xs font-bold font-numeric shadow-md">✓</span>
            <span className="text-xs font-semibold text-text-primary">Self Evaluation</span>
          </div>

          <div className="flex items-center gap-3 bg-surface px-3 py-1 rounded-xl z-10 w-full md:w-auto">
            <span className="w-7 h-7 rounded-full bg-success text-white flex items-center justify-center text-xs font-bold font-numeric shadow-md">✓</span>
            <span className="text-xs font-semibold text-text-primary">Manager Review</span>
          </div>

          <div className="flex items-center gap-3 bg-surface px-3 py-1 rounded-xl z-10 w-full md:w-auto">
            <span className="w-7 h-7 rounded-full bg-primary-subtle text-primary border border-primary/30 flex items-center justify-center text-xs font-bold font-numeric shadow-md">3</span>
            <span className="text-xs font-semibold text-primary font-bold">Appraisal Finalized</span>
          </div>
        </div>
      </div>

      {/* Appraisal ratings & Manager sign-off summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Core Competencies Matrix */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex flex-col h-full space-y-6">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Core Competencies Assessment</h3>
              <p className="text-xs text-text-secondary mt-0.5">Ratings assigned across core performance dimensions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
              {competencies.map((comp) => (
                <div 
                  key={comp.name} 
                  className="bg-bg border border-border rounded-xl p-5 flex flex-col justify-between hover:border-primary/45 hover:bg-surface-raised/10 transition-all duration-300 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-xs font-bold text-text-primary leading-tight group-hover:text-primary transition-colors">{comp.name}</span>
                      <div className="flex items-center gap-1 bg-primary-subtle text-primary border border-primary/20 px-2 py-0.5 rounded-lg text-xs font-bold font-numeric shrink-0 shadow-sm">
                        <Star className="w-3 h-3 fill-primary text-primary" /> {comp.score}
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{comp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side: Overall appraisal summary score */}
        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex flex-col h-full justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-text-primary">Appraisal Summary</h3>
              
              <div className="bg-bg border border-border rounded-xl p-5 flex flex-col items-center justify-center py-6">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider text-[10px]">Overall score</span>
                <span className="text-4xl font-extrabold text-text-primary font-numeric mt-2">4.7 <span className="text-lg text-text-disabled font-normal">/ 5.0</span></span>
                <span className="text-[10px] font-bold text-success bg-success-bg border border-success/30 px-2.5 py-1 rounded-full uppercase tracking-wider mt-4">
                  Exceeds Expectations
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-text-primary">{signoffHeader}</span>
                <div className="bg-surface-raised p-4 rounded-xl border border-border space-y-3 shadow-inner">
                  <p className="text-xs text-text-secondary leading-relaxed italic">
                    {signoffComment}
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary font-heading uppercase">
                      {signoffAvatar}
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <span className="text-[10px] font-bold text-text-primary">{signoffName}</span>
                      <span className="text-[9px] text-text-disabled font-medium">({signoffRole})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4 text-center mt-auto">
              <p className="text-[10px] text-text-disabled">
                Appraisal Cycle Year: FY2026. Verified with {goals.length} active objectives. Signed off by HR Operations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// EXPORT COMPONENT WITH ROUTING WRAPPER
// ==========================================
export default function GoalSheet() {
  return (
    <Routes>
      <Route index element={<GoalsPage />} />
      <Route path="insights" element={<GoalInsightsPage />} />
      <Route path="feedback" element={<FeedbackPage />} />
      <Route path="appraisal" element={<AppraisalPage />} />
      <Route path="checkin" element={<CheckIn />} />
      <Route path="*" element={<Navigate to="/employee" replace />} />
    </Routes>
  )
}

