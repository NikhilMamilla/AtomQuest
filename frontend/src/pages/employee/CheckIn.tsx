import { useEffect, useState, Fragment } from 'react'
import { 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  Compass,
  Check,
  Activity
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Badge, Button } from '../../components/common'
import { achievementsService } from '../../services/achievements'
import type { AchievementGoal } from '../../services/achievements'
import { calcScore } from '../../utils/scoreCalc'
import { useAuthStore } from '../../store/authStore'

// Map raw database UoM keys to beautiful display labels
const UOM_LABEL: Record<string, string> = {
  numeric_min: 'Numeric (Min - Higher is Better)',
  percent_min: 'Percentage (Min - Higher is Better)',
  numeric_max: 'Numeric (Max - Lower is Better)',
  percent_max: 'Percentage (Max - Lower is Better)',
  timeline: 'Timeline-Based (Date-Based)',
  zero: 'Zero Tolerance (Zero = Success)',
}

// Maps progress status values to semantic labels and styling
const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', variant: 'slate' },
  { value: 'on_track', label: 'On Track', variant: 'indigo' },
  { value: 'off_track', label: 'Off Track', variant: 'amber' },
  { value: 'completed', label: 'Completed', variant: 'emerald' },
] as const

export default function CheckIn() {
  const { user } = useAuthStore()
  const [quarter, setQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1')
  const [goals, setGoals] = useState<AchievementGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  
  // Track local edits per goal_id to display live computed scores
  const [edits, setEdits] = useState<Record<number, {
    actual: string
    completion_date: string
    progress_status: 'not_started' | 'on_track' | 'off_track' | 'completed'
  }>>({})

  // Determine active quarter based on month: July = Q1, October = Q2, January = Q3, March/April = Q4
  const currentMonth = new Date().getMonth() + 1 // 1-indexed (1=Jan, 2=Feb, etc.)
  let openQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null = null
  if (currentMonth === 7) openQuarter = 'Q1'
  else if (currentMonth === 10) openQuarter = 'Q2'
  else if (currentMonth === 1) openQuarter = 'Q3'
  else if (currentMonth === 3 || currentMonth === 4) openQuarter = 'Q4'

  const isWindowOpen = openQuarter === quarter
  const canEdit = isWindowOpen || user?.role === 'admin'

  // Pre-select current active quarter if window is open
  useEffect(() => {
    if (openQuarter) {
      setQuarter(openQuarter)
    }
  }, [openQuarter])

  // Fetch performance objectives joined with achievement actuals
  const fetchAchievements = async () => {
    try {
      setLoading(true)
      const data = await achievementsService.list({ quarter })
      setGoals(data)
      
      // Initialize local edits dictionary
      const initialEdits: typeof edits = {}
      data.forEach(g => {
        initialEdits[g.goal_id] = {
          actual: g.actual !== null ? String(g.actual) : '',
          completion_date: g.completion_date || '',
          progress_status: g.progress_status || 'not_started'
        }
      })
      setEdits(initialEdits)
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to load objectives achievements history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAchievements()
  }, [quarter])

  // Handle updates in local input states
  const handleInputChange = (goalId: number, field: keyof typeof edits[number], value: string) => {
    setEdits(prev => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        [field]: value
      }
    }))
  }

  // Calculate scores on the fly for live indicators
  const getLiveScore = (goal: AchievementGoal) => {
    const edit = edits[goal.goal_id]
    if (!edit) return 0

    const actualNum = parseFloat(edit.actual) || 0
    const targetNum = goal.target || 0
    
    try {
      const score = calcScore(goal.uom, targetNum, actualNum, goal.deadline || undefined, edit.completion_date || undefined)
      if (isNaN(score) || !isFinite(score)) return 0
      return score
    } catch {
      return 0
    }
  }

  // Persist local achievements records to the database
  const handleSave = async (goal: AchievementGoal) => {
    const edit = edits[goal.goal_id]
    if (!edit) return

    try {
      setSavingId(goal.goal_id)
      
      const actualVal = edit.actual.trim() !== '' ? parseFloat(edit.actual) : null
      const payload = {
        goal_id: goal.goal_id,
        quarter,
        actual: actualVal,
        completion_date: edit.completion_date || null,
        progress_status: edit.progress_status
      }

      await achievementsService.log(payload)
      toast.success(`Successfully saved progress for "${goal.title}"`)
      
      // Refresh database records
      await fetchAchievements()
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Error occurred while saving progress')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16 font-body">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-base min-[375px]:text-lg xs:text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight font-heading flex items-center gap-2 sm:gap-2.5 whitespace-nowrap">
            <Activity className="w-5 h-5 min-[375px]:w-5.5 min-[375px]:h-5.5 sm:w-6 sm:h-6 text-primary shrink-0" />
            <span>Quarterly Performance Check-in</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-body">
            Log actual quarterly achievement figures and update completion milestones on your approved targets.
          </p>
        </div>

        {/* Quarter Selection Switcher */}
        <div className="flex items-center gap-1 bg-surface-raised border border-border p-1 rounded-xl w-full sm:w-auto">
          {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => (
            <button
              key={q}
              onClick={() => setQuarter(q)}
              className={`flex-1 sm:flex-initial text-center justify-center px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
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

      {/* Quarter Logging Window Banner */}
      {openQuarter ? (
        isWindowOpen ? (
          <div className="bg-success-bg border border-success/30 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-success font-body">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold">Active Logging Window Open:</span> The logging month for <strong className="font-semibold text-text-primary">{quarter}</strong> is open now. You can enter achievements and actual performance metrics below.
            </div>
          </div>
        ) : (
          <div className="bg-warning-bg border border-warning/30 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-warning font-body">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold">Quarter Out of Window:</span> The logging window for <strong className="font-semibold text-text-primary">{quarter}</strong> is currently closed. (Open window is <strong>{openQuarter}</strong>). Displaying history in <span className="font-bold uppercase">view-only mode</span>.
            </div>
          </div>
        )
      ) : (
        <div className="bg-warning-bg border border-warning/30 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-warning font-body">
          <Lock className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-bold">Logging Windows Closed:</span> No active quarterly check-in windows are open this month. (July=Q1, Oct=Q2, Jan=Q3, Mar/Apr=Q4). Viewing data in <span className="font-bold uppercase">read-only mode</span>.
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          <p className="text-text-secondary text-xs">Loading performance goals...</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
          <Compass className="w-12 h-12 text-text-disabled mx-auto animate-pulse" />
          <div>
            <h3 className="text-base font-bold text-text-primary">No Objectives Available</h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              {user?.role === 'admin' 
                ? 'You do not have any approved goals for the current cycle year. Head to "My Goals" to create and publish your objectives first.'
                : 'You do not have any approved goals for the current cycle year. Achievements can only be tracked once your sheet is approved by your manager.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {goals.map((goal, idx) => {
            const edit = edits[goal.goal_id] || { actual: '', completion_date: '', progress_status: 'not_started' }
            const liveScore = getLiveScore(goal)
            const isSaved = goal.achievement_id !== null && 
                            String(goal.actual) === edit.actual && 
                            (goal.completion_date || '') === edit.completion_date && 
                            goal.progress_status === edit.progress_status

            return (
              <Fragment key={goal.goal_id}>
                {/* Desktop Version Card (hidden sm:flex) */}
                <div 
                  key={goal.goal_id}
                  className="hidden sm:flex bg-surface border border-border rounded-2xl p-6 transition-all duration-300 hover:border-primary/25 relative overflow-hidden group shadow-sm flex-col md:flex-row justify-between gap-6"
                >
                  {/* Left Side: Goal details & configurations */}
                  <div className="space-y-4 flex-1">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-text-secondary bg-surface-raised border border-border px-2 py-0.5 rounded font-numeric">
                          Goal #{idx + 1}
                        </span>
                        <Badge variant="indigo">{goal.thrust_area}</Badge>
                        <span className="text-[10px] text-text-disabled font-semibold font-numeric">
                          Weightage: {goal.weightage}%
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-text-primary font-heading leading-snug">{goal.title}</h3>
                      {goal.description && (
                        <p className="text-xs text-text-secondary mt-1 leading-relaxed max-w-2xl">{goal.description}</p>
                      )}
                    </div>

                    {/* Targets Information Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-bg border border-border/60 p-3.5 rounded-xl">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-text-disabled block">Metric Target</span>
                        <span className="text-xs font-extrabold text-text-secondary font-numeric mt-0.5 block">
                          {goal.target !== null ? goal.target : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-text-disabled block">UoM Schema</span>
                        <span className="text-xs font-semibold text-text-secondary mt-0.5 block truncate" title={UOM_LABEL[goal.uom]}>
                          {goal.uom === 'zero' ? 'Zero Tolerance' : goal.uom === 'timeline' ? 'Timeline' : UOM_LABEL[goal.uom]?.split(' ')[0]}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-text-disabled block">Target Deadline</span>
                        <span className="text-xs font-semibold text-text-secondary font-numeric mt-0.5 block">
                          {goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Logging Inputs & Live Score Indicator */}
                  <div className="w-full md:w-[320px] shrink-0 border-t md:border-t-0 md:border-l border-border/80 pt-6 md:pt-0 md:pl-6 flex flex-col justify-between gap-5">
                    <div className="space-y-4">
                      {/* Input logic based on UOM type */}
                      {goal.uom !== 'timeline' ? (
                        <div>
                          <label className="text-xs font-bold text-text-secondary block mb-1">
                            Actual Progress Value
                          </label>
                          <input
                            type="number"
                            disabled={!canEdit}
                            placeholder="Enter numerical actual..."
                            value={edit.actual}
                            onChange={(e) => handleInputChange(goal.goal_id, 'actual', e.target.value)}
                            className="w-full bg-surface-raised border border-border focus:border-primary rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-numeric"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="text-xs font-bold text-text-secondary block mb-1">
                            Actual Completion Date
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              disabled={!canEdit}
                              value={edit.completion_date}
                              onChange={(e) => handleInputChange(goal.goal_id, 'completion_date', e.target.value)}
                              className="w-full bg-surface-raised border border-border focus:border-primary rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-numeric"
                            />
                          </div>
                        </div>
                      )}

                      {/* Progress Status Dropdown */}
                      <div>
                        <label className="text-xs font-bold text-text-secondary block mb-1">
                          Progress Status State
                        </label>
                        <select
                          disabled={!canEdit}
                          value={edit.progress_status}
                          onChange={(e) => handleInputChange(goal.goal_id, 'progress_status', e.target.value as any)}
                          className="w-full bg-surface-raised border border-border focus:border-primary rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-body"
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* dynamic live score & save buttons */}
                    <div className="flex items-center justify-between gap-4 pt-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-text-disabled">Live Progress Score</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-lg font-black text-text-primary font-numeric">
                            {Math.round(liveScore * 100)}%
                          </span>
                          <span className="text-[10px] font-bold text-text-disabled font-numeric">
                            ({liveScore.toFixed(2)})
                          </span>
                        </div>
                      </div>

                      {canEdit && (
                        <Button
                          variant={isSaved ? 'outline' : 'primary'}
                          size="sm"
                          disabled={savingId === goal.goal_id}
                          onClick={() => handleSave(goal)}
                          className="px-4 py-2 shrink-0 flex items-center gap-1.5"
                        >
                          {savingId === goal.goal_id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-current"></div>
                          ) : isSaved ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-success" />
                              Saved
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              Save
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Version Card (flex sm:hidden) */}
                <div className="flex sm:hidden flex-col bg-surface border border-border rounded-2xl p-5 gap-5 hover:border-primary/25 relative overflow-hidden shadow-sm font-body">
                  {/* Header Tag Cluster */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] font-bold text-text-secondary bg-surface-raised border border-border px-2 py-0.5 rounded-lg font-numeric">
                        Goal #{idx + 1}
                      </span>
                      <Badge variant="indigo" className="text-[9px] px-2 py-0.5">{goal.thrust_area}</Badge>
                      <span className="text-[9px] font-bold text-primary bg-primary-subtle border border-primary/20 px-2 py-0.5 rounded-lg font-numeric">
                        Weight: {goal.weightage}%
                      </span>
                    </div>
                    
                    <h3 className="text-sm font-bold text-text-primary leading-snug font-heading">
                      {goal.title}
                    </h3>
                    {goal.description && (
                      <p className="text-xs text-text-secondary leading-relaxed bg-bg/40 p-2.5 rounded-xl border border-border/40">
                        {goal.description}
                      </p>
                    )}
                  </div>

                  {/* Targets Overview list */}
                  <div className="bg-bg border border-border/50 rounded-xl p-3.5 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-text-disabled">Metric Target</span>
                      <span className="font-extrabold text-text-secondary font-numeric">
                        {goal.target !== null ? goal.target : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/30 pt-2.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-text-disabled">UoM Schema</span>
                      <span className="font-semibold text-text-secondary truncate max-w-[160px]" title={UOM_LABEL[goal.uom]}>
                        {goal.uom === 'zero' ? 'Zero Tolerance' : goal.uom === 'timeline' ? 'Timeline' : UOM_LABEL[goal.uom]?.split(' ')[0]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/30 pt-2.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-text-disabled">Deadline</span>
                      <span className="font-mono text-text-secondary font-numeric">
                        {goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Inputs Fields Section */}
                  <div className="space-y-4 border-t border-border/60 pt-4">
                    {goal.uom !== 'timeline' ? (
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider block">
                          Actual Progress Value
                        </label>
                        <input
                          type="number"
                          disabled={!canEdit}
                          placeholder="Enter numerical actual..."
                          value={edit.actual}
                          onChange={(e) => handleInputChange(goal.goal_id, 'actual', e.target.value)}
                          className="w-full bg-surface-raised border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-numeric shadow-inner"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider block">
                          Actual Completion Date
                        </label>
                        <input
                          type="date"
                          disabled={!canEdit}
                          value={edit.completion_date}
                          onChange={(e) => handleInputChange(goal.goal_id, 'completion_date', e.target.value)}
                          className="w-full bg-surface-raised border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-numeric shadow-inner"
                        />
                      </div>
                    )}

                    {/* Progress Status dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider block">
                        Progress Status State
                      </label>
                      <select
                        disabled={!canEdit}
                        value={edit.progress_status}
                        onChange={(e) => handleInputChange(goal.goal_id, 'progress_status', e.target.value as any)}
                        className="w-full bg-surface-raised border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-body shadow-inner"
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Score & Full-width Save CTA Button */}
                  <div className="bg-surface-raised border border-border/60 p-4 rounded-xl flex items-center justify-between gap-4 mt-1">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-text-disabled">Live Score</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-base font-black text-text-primary font-numeric">
                          {Math.round(liveScore * 100)}%
                        </span>
                        <span className="text-[9px] font-bold text-text-disabled font-numeric">
                          ({liveScore.toFixed(2)})
                        </span>
                      </div>
                    </div>

                    {canEdit && (
                      <Button
                        variant={isSaved ? 'outline' : 'primary'}
                        size="sm"
                        disabled={savingId === goal.goal_id}
                        onClick={() => handleSave(goal)}
                        className="px-4 py-2 shrink-0 flex items-center gap-1.5 text-xs shadow-md"
                      >
                        {savingId === goal.goal_id ? (
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-current"></div>
                        ) : isSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-success" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            Save
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}
