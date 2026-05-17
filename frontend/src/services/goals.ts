import api from './api'

// ==========================================
// TYPES & SCHEMAS
// ==========================================
export interface Goal {
  id: number
  employee_id: number
  employee_name: string
  thrust_area: string
  title: string
  description: string
  uom: string
  target: number | null
  deadline: string | null
  weightage: number
  status: 'draft' | 'submitted' | 'approved' | 'returned' | 'pending'
  locked: boolean
  is_shared: boolean
  cycle_year: number
  created_at: string
}

export interface GoalPayload {
  thrust_area: string
  title: string
  description?: string
  uom: string
  target?: number
  deadline?: string
  weightage: number
}

// ==========================================
// CONSTANTS
// ==========================================
export const UOM_OPTIONS = [
  { value: 'numeric_min', label: 'Numeric — Higher is better (e.g. Revenue)' },
  { value: 'numeric_max', label: 'Numeric — Lower is better (e.g. Cost, TAT)' },
  { value: 'percent_min', label: '% — Higher is better' },
  { value: 'percent_max', label: '% — Lower is better' },
  { value: 'timeline',    label: 'Timeline — Date-based completion' },
  { value: 'zero',        label: 'Zero-based — Zero = Success (e.g. Safety incidents)' },
]

export const THRUST_AREAS = [
  { value: 'Revenue Growth',      label: 'Revenue Growth' },
  { value: 'Cost Optimisation',   label: 'Cost Optimisation' },
  { value: 'Customer Success',    label: 'Customer Success' },
  { value: 'People & Culture',    label: 'People & Culture' },
  { value: 'Process Excellence',  label: 'Process Excellence' },
  { value: 'Innovation',          label: 'Innovation' },
  { value: 'Compliance & Safety', label: 'Compliance & Safety' },
  { value: 'Digital & Tech',      label: 'Digital & Tech' },
]

// Alias to maintain cross-component naming support
export const UOMS = UOM_OPTIONS

// ==========================================
// GOALS API SERVICES
// ==========================================
export const goalsService = {
  /**
   * Fetches goals. Supports both simple year number and full filter object.
   */
  list: (arg?: number | { year?: number; employee_id?: number }) => {
    const params = typeof arg === 'number' ? { year: arg } : arg
    return api.get<Goal[]>('/goals', { params }).then(r => r.data)
  },

  /**
   * Creates a new performance goal
   */
  create: (payload: GoalPayload) =>
    api.post<Goal>('/goals', payload).then(r => r.data),

  /**
   * Updates an existing performance goal
   */
  update: (id: number, payload: Partial<GoalPayload>) =>
    api.put<Goal>(`/goals/${id}`, payload).then(r => r.data),

  /**
   * Deletes a draft performance goal
   */
  delete: (id: number) =>
    api.delete<{ success: boolean }>(`/goals/${id}`).then(r => r.data),

  /**
   * Submits all draft/returned goals for cycle evaluation
   */
  submit: () =>
    api.post<{ success: boolean; submitted: number }>('/goals/submit').then(r => r.data),

  /**
   * Approves an individual goal (with optional inline target/weightage edits)
   */
  approve: (id: number, payload?: { target?: number; weightage?: number }) =>
    api.post<Goal>(`/goals/${id}/approve`, payload).then(r => r.data),

  /**
   * Returns an individual goal for revisions with a specific rework comment
   */
  returnGoal: (id: number, comment: string) =>
    api.post<Goal>(`/goals/${id}/return`, { comment }).then(r => r.data),

  /**
   * Approves the entire sheet for an employee (Manager/Admin action)
   */
  approveSheet: (employeeId: number, cycleYear?: number) =>
    api.post<{ success: boolean }>('/goals/approve', { employee_id: employeeId, cycle_year: cycleYear }).then(r => r.data),

  /**
   * Returns the entire sheet for revisions (Manager/Admin action)
   */
  returnSheet: (employeeId: number, cycleYear?: number, comment?: string) =>
    api.post<{ success: boolean }>('/goals/return', { employee_id: employeeId, cycle_year: cycleYear, comment }).then(r => r.data),

  /**
   * Optimizes a goal using the SMART AI Copilot
   */
  optimize: (payload: { title: string; description?: string; thrust_area?: string }) =>
    api.post<GoalPayload>('/goals/optimize', payload).then(r => r.data),

  /**
   * Push a goal as a shared departmental KPI to selected employees
   */
  pushGoal: (goalId: number, employeeIds: number[]) =>
    api.post<{ success: boolean; pushed_count: number; goals: Goal[] }>(`/goals/${goalId}/push`, { employee_ids: employeeIds }).then(r => r.data),
}
