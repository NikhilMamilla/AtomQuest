import { useState, useEffect } from 'react'
import { Modal, Input, Select, Textarea, Button } from '../common'
import { goalsService, UOM_OPTIONS, THRUST_AREAS } from '../../services/goals'
import type { Goal, GoalPayload } from '../../services/goals'
import { Sparkles, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface GoalFormModalProps {
  open?: boolean
  isOpen?: boolean
  onClose: () => void
  onSaved?: () => void
  onSave?: () => void
  editing?: Goal | null
  goalToEdit?: Goal | null
  usedWeightage?: number
  currentGoals?: Goal[]
}

const EMPTY: GoalPayload = {
  thrust_area: '',
  title: '',
  description: '',
  uom: '',
  target: undefined,
  deadline: '',
  weightage: 0,
}

export default function GoalFormModal({ 
  open, 
  isOpen, 
  onClose, 
  onSaved, 
  onSave, 
  editing, 
  goalToEdit, 
  usedWeightage, 
  currentGoals 
}: GoalFormModalProps) {
  const modalOpen = open ?? isOpen ?? false
  const handleSaved = onSaved ?? onSave ?? (() => {})
  const activeGoal = editing ?? goalToEdit ?? null
  const siblingList = currentGoals ?? []

  const [form, setForm] = useState<GoalPayload>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof GoalPayload, string>>>({})
  const [saving, setSaving] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)

  // Compute used weightage of all OTHER goals in the sheet if not passed directly
  const computedUsedWeightage = usedWeightage !== undefined 
    ? usedWeightage 
    : siblingList
        .filter(g => g.id !== activeGoal?.id)
        .reduce((sum, g) => sum + Number(g.weightage), 0)

  useEffect(() => {
    if (activeGoal) {
      setForm({
        thrust_area: activeGoal.thrust_area,
        title: activeGoal.title,
        description: activeGoal.description || '',
        uom: activeGoal.uom,
        target: activeGoal.target ?? undefined,
        deadline: activeGoal.deadline ?? '',
        weightage: activeGoal.weightage,
      })
    } else {
      setForm(EMPTY)
    }
    setErrors({})
  }, [activeGoal, modalOpen])

  const set = (k: keyof GoalPayload, v: any) =>
    setForm(f => ({ ...f, [k]: v }))

  const optimizeGoalWithAI = async () => {
    setIsOptimizing(true)
    try {
      const result = await goalsService.optimize({
        title: form.title,
        description: form.description,
        thrust_area: form.thrust_area
      })

      setForm({
        thrust_area: result.thrust_area || form.thrust_area,
        title: result.title || form.title,
        description: result.description || form.description || '',
        uom: result.uom || form.uom || 'percent_min',
        target: result.target !== undefined ? result.target : form.target,
        deadline: result.deadline || form.deadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days out
        weightage: result.weightage !== undefined ? Number(result.weightage) : form.weightage,
      })
      toast.success('Goal successfully optimized using SMART framework!')
    } catch (err: any) {
      console.warn('[AI Optimization API Error]:', err.message)
      
      // Smart local fallback in case of network or API issues
      const inputTitle = (form.title || '').trim()
      const inputDesc = (form.description || '').trim()
      const inputThrust = (form.thrust_area || '').trim()

      // Determine target thrust area by prioritizing explicit selection, then keyword matching
      let targetThrust = 'Process Excellence'
      const textSource = (inputTitle + ' ' + inputDesc).toLowerCase()

      if (inputThrust) {
        targetThrust = inputThrust
      } else {
        // Guess from keywords
        if (textSource.includes('revenue') || textSource.includes('sales') || textSource.includes('growth') || textSource.includes('financial')) {
          targetThrust = 'Revenue Growth'
        } else if (textSource.includes('cost') || textSource.includes('optim') || textSource.includes('saving') || textSource.includes('spend')) {
          targetThrust = 'Cost Optimisation'
        } else if (textSource.includes('customer') || textSource.includes('client') || textSource.includes('success') || textSource.includes('csat') || textSource.includes('support')) {
          targetThrust = 'Customer Success'
        } else if (textSource.includes('people') || textSource.includes('culture') || textSource.includes('hr') || textSource.includes('employee') || textSource.includes('team')) {
          targetThrust = 'People & Culture'
        } else if (textSource.includes('innovat') || textSource.includes('creative') || textSource.includes('r&d') || textSource.includes('prototype')) {
          targetThrust = 'Innovation'
        } else if (textSource.includes('compliance') || textSource.includes('safety') || textSource.includes('legal') || textSource.includes('risk') || textSource.includes('audit')) {
          targetThrust = 'Compliance & Safety'
        } else if (textSource.includes('digital') || textSource.includes('tech') || textSource.includes('software') || textSource.includes('develop') || textSource.includes('pipeline')) {
          targetThrust = 'Digital & Tech'
        } else {
          targetThrust = 'Process Excellence'
        }
      }

      let optimalTitle = ''
      let optimalDesc = ''
      let optimalUom = 'percent_min'
      let optimalTarget = 100
      let optimalWeightage = 15

      switch (targetThrust) {
        case 'Revenue Growth':
          optimalTitle = 'Accelerate Quarterly Business Sales Revenue Acquisition'
          optimalDesc = 'Identify high-value business client opportunities, launch hyper-targeted email sequences, and secure new annual subscription contracts to expand quarterly sales.'
          optimalUom = 'numeric_max'
          optimalTarget = 150000
          optimalWeightage = 25
          break
        case 'Cost Optimisation':
          optimalTitle = 'Reduce Cloud Infrastructure & Third-Party Service Spend'
          optimalDesc = 'Audit compute, storage, and networking instances. Deprovision unused staging database resources, adjust scaling rules, and adopt reserved instance strategies.'
          optimalUom = 'percent_max'
          optimalTarget = 20
          optimalWeightage = 15
          break
        case 'Customer Success':
          optimalTitle = 'Improve First-Response Time (FRT) for Enterprise Support Tickets'
          optimalDesc = 'Streamline ticketing queue workflows, configure proactive template notifications, and align tier-1 routing. Maintain average first-response times of under 15 minutes and achieve 98% CSAT score.'
          optimalUom = 'percent_min'
          optimalTarget = 98
          optimalWeightage = 20
          break
        case 'People & Culture':
          optimalTitle = 'Boost Internal Technical Upskilling & Team Engagement'
          optimalDesc = 'Organize monthly peer-to-peer engineering workshops, design standardized employee onboarding paths, and maintain high internal team engagement scores.'
          optimalUom = 'percent_min'
          optimalTarget = 92
          optimalWeightage = 10
          break
        case 'Innovation':
          optimalTitle = 'Design and Prototype Next-Gen AI Assistant Feature Sets'
          optimalDesc = 'Conduct feasibility studies, wireframe conversational layouts, and build a high-fidelity proof-of-concept AI agent to accelerate client workflow tasks.'
          optimalUom = 'numeric_max'
          optimalTarget = 1
          optimalWeightage = 20
          break
        case 'Compliance & Safety':
          optimalTitle = 'Audit System Access Rules & Align with ISO Security Controls'
          optimalDesc = 'Perform complete audits of database privileges, enforce multi-factor authentication policies across active profiles, and compile standard SOC2 audit trails.'
          optimalUom = 'percent_min'
          optimalTarget = 100
          optimalWeightage = 15
          break
        case 'Digital & Tech':
          optimalTitle = 'Implement Automated CI/CD Pipelines & Quality Test Frameworks'
          optimalDesc = 'Deploy custom automated unit-testing pipelines across core billing and authentication microservices. Achieve and safeguard at least 85% test coverage to prevent production deployment regressions.'
          optimalUom = 'percent_min'
          optimalTarget = 85
          optimalWeightage = 15
          break
        case 'Process Excellence':
        default:
          optimalTitle = 'Optimize Checkout API Performance & Response Latency'
          optimalDesc = 'Identify critical bottlenecks in product search, cart operations, and payment triggers. Implement Redis caching and query indexing to reduce end-to-end checkout latency to under 200ms.'
          optimalUom = 'numeric_min'
          optimalTarget = 200
          optimalWeightage = 15
          break
      }

      setForm({
        thrust_area: targetThrust,
        title: optimalTitle,
        description: optimalDesc,
        uom: optimalUom,
        target: optimalTarget,
        deadline: form.deadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days out
        weightage: optimalWeightage,
      })
      toast.success('Goal successfully optimized using local fallback engine!')
    } finally {
      setIsOptimizing(false)
    }
  }

  const validate = (): boolean => {
    const e: Partial<Record<keyof GoalPayload, string>> = {}
    if (!form.thrust_area) e.thrust_area = 'Required'
    if (!form.title.trim()) e.title = 'Required'
    if (!form.uom) e.uom = 'Required'
    if (form.uom === 'timeline' && !form.deadline) e.deadline = 'Required for Timeline UoM'
    if (!form.weightage || form.weightage < 10) e.weightage = 'Minimum 10%'
    if (form.weightage > 100) e.weightage = 'Cannot exceed 100%'

    const projected = computedUsedWeightage + form.weightage
    if (projected > 100) {
      e.weightage = `Adding ${form.weightage}% exceeds 100% (currently ${computedUsedWeightage}% used)`
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (activeGoal) {
        await goalsService.update(activeGoal.id, form)
        toast.success('Goal updated successfully')
      } else {
        await goalsService.create(form)
        toast.success('Goal added successfully')
      }
      handleSaved()
      onClose()
    } catch (err: any) {
      const msg = err.response?.data?.errors?.join(', ') || err.response?.data?.error || 'Failed to save'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const needsTarget = form.uom && !['zero'].includes(form.uom)
  const needsDeadline = form.uom === 'timeline'
  
  // Shared manager goal rule: Employee can only edit description, deadline, or weightage. Title & Target are read-only.
  const isShared = !!activeGoal?.is_shared

  return (
    <Modal
      isOpen={modalOpen}
      onClose={onClose}
      title={activeGoal ? 'Edit Performance Objective' : 'Create Performance Objective'}
    >
      <div className="space-y-5 font-body">
        {/* SMART AI Copilot Assistant */}
        {!isShared && (
          <div className="bg-primary-subtle border border-primary/20 p-4 rounded-xl space-y-3 font-body">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">SMART AI Goal Copilot</span>
              </div>
              <button
                type="button"
                onClick={optimizeGoalWithAI}
                disabled={isOptimizing}
                className="text-xs py-1.5 px-3 rounded-lg bg-gradient-to-r from-primary to-accent hover:from-primary-emphasis hover:to-accent-strong text-primary-on font-bold flex items-center gap-1.5 shadow-md shadow-primary/10 transition-all duration-200 disabled:opacity-50"
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-current" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-current" />
                    Refine with AI
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Enter a basic idea in Title/Description, choose a Thrust Area, and click <strong className="text-primary">Refine</strong>. The AI will instantly draft a professional SMART target for you!
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Thrust Area"
            value={form.thrust_area}
            onChange={e => set('thrust_area', e.target.value)}
            options={THRUST_AREAS}
            placeholder="Select area..."
            error={errors.thrust_area}
          />
          <Select
            label="Unit of Measurement (UoM)"
            value={form.uom}
            onChange={e => set('uom', e.target.value)}
            options={UOM_OPTIONS}
            placeholder="Select UoM..."
            error={errors.uom}
            disabled={isShared}
          />
        </div>

        <Input
          label="Goal Title"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="e.g. Achieve Q3 release milestones for project Atomquest"
          error={errors.title}
          disabled={isShared}
        />

        <Textarea
          label="Description (Optional)"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Enter context, metric parameters, and evaluation milestones..."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {needsTarget && (
            <Input
              label={needsDeadline ? 'Target (Optional)' : 'Target'}
              type="number"
              value={form.target ?? ''}
              onChange={e => set('target', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="e.g. 50"
              disabled={isShared}
            />
          )}
          {needsDeadline && (
            <Input
              label="Deadline"
              type="date"
              value={form.deadline}
              onChange={e => set('deadline', e.target.value)}
              error={errors.deadline}
            />
          )}
        </div>

        {/* Weightage Allocation Section */}
        <div className="space-y-2 bg-surface border border-border p-4 rounded-xl">
          <div className="flex justify-between items-center text-xs font-semibold text-text-secondary uppercase tracking-wider">
            <span>Weightage (%)</span>
            <span className="text-primary font-numeric font-bold">
              Remaining Capacity: {100 - computedUsedWeightage}%
            </span>
          </div>
          <Input
            type="number"
            min={10}
            max={100}
            value={form.weightage || ''}
            onChange={e => set('weightage', parseFloat(e.target.value) || 0)}
            placeholder="Min 10%"
            error={errors.weightage}
          />
          {/* Live Weightage Allocation Visual bar */}
          <div className="h-2 bg-surface-raised rounded-full overflow-hidden relative mt-3">
            <div
              className={`h-full rounded-full transition-all duration-300 bg-gradient-to-r ${
                computedUsedWeightage + form.weightage > 100 
                  ? 'from-danger to-rose-400' 
                  : computedUsedWeightage + form.weightage === 100 
                    ? 'from-success to-accent' 
                    : 'from-primary to-accent'
              }`}
              style={{ width: `${Math.min(computedUsedWeightage + form.weightage, 100)}%` }}
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving} variant="primary">
            {activeGoal ? 'Save Objective' : 'Create Objective'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
