import api from './api'

// ── Type Definitions ──────────────────────────────────────

export interface AdminUser {
  id: number
  name: string
  email: string
  role: 'employee' | 'manager' | 'admin'
  department: string | null
  manager_id: number | null
  manager_name: string | null
  created_at: string
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: 'employee' | 'manager' | 'admin'
  manager_id?: number | null
  department?: string | null
}

export interface AdminGoal {
  id: number
  employee_id: number
  thrust_area: string
  title: string
  description: string | null
  uom: string
  target: number | null
  deadline: string | null
  weightage: number
  status: string
  locked: boolean
  cycle_year: number
  employee_name: string
  employee_email: string
  department: string | null
  manager_name: string | null
}

export interface AchievementRow {
  goal_id: number
  thrust_area: string
  title: string
  description: string | null
  uom: string
  target: number | null
  deadline: string | null
  weightage: number
  cycle_year: number
  employee_id: number
  employee_name: string
  employee_email: string
  department: string | null
  manager_name: string | null
  quarter: string | null
  actual: number | null
  completion_date: string | null
  progress_status: string | null
  score: number | null
}

export interface CompletionRow {
  employee_id: number
  employee_name: string
  department: string | null
  manager_name: string
  quarter: string
  manager_submitted: boolean
  manager_submitted_at: string | null
  logged_actuals_count: number
  total_goals_count: number
}

export interface AuditEntry {
  id: number
  action: string
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  created_at: string
  user_name: string | null
  user_email: string | null
  user_role: string | null
  goal_title: string | null
}

export interface EscalationRule {
  id: number
  name: string
  trigger_type: 'goal_not_submitted' | 'approval_pending' | 'checkin_overdue'
  threshold_days: number
  action: string
  is_active: boolean
  created_by_name: string | null
  created_at: string
}

export interface EscalationLogEntry {
  id: number
  rule_name: string
  employee_name: string
  manager_name: string | null
  trigger_type: string
  message: string
  resolved: boolean
  created_at: string
}

export interface AnalyticsQoq {
  quarter: string
  avg_score: number
}

export interface AnalyticsDistribution {
  name: string
  value: number
}

export interface AnalyticsManagerEffectiveness {
  manager_name: string
  avg_score: number
}

// ── API Service ───────────────────────────────────────────

export const adminService = {
  // Users
  listUsers: () =>
    api.get<AdminUser[]>('/admin/users').then(r => r.data),

  createUser: (payload: CreateUserPayload) =>
    api.post<AdminUser>('/admin/users', payload).then(r => r.data),

  // Goals
  listGoals: (params?: { department?: string; status?: string }) =>
    api.get<AdminGoal[]>('/admin/goals', { params }).then(r => r.data),

  unlockGoal: (goalId: number) =>
    api.patch<{ success: boolean; message: string; goal_id: string }>(`/admin/goals/${goalId}/unlock`).then(r => r.data),

  // Reports
  achievementReport: () =>
    api.get<AchievementRow[]>('/admin/report/achievement').then(r => r.data),

  exportAchievementCSV: () =>
    api.get<string>('/admin/report/achievement/export', { responseType: 'blob' as any }).then(r => r.data),

  completionReport: () =>
    api.get<CompletionRow[]>('/admin/report/completion').then(r => r.data),

  // Audit
  auditLog: () =>
    api.get<AuditEntry[]>('/admin/audit').then(r => r.data),

  // Escalations
  listEscalationRules: () =>
    api.get<EscalationRule[]>('/escalations/rules').then(r => r.data),

  createEscalationRule: (payload: { name: string; trigger_type: string; threshold_days: number }) =>
    api.post<EscalationRule>('/escalations/rules', payload).then(r => r.data),

  toggleEscalationRule: (id: number, is_active: boolean) =>
    api.patch<EscalationRule>(`/escalations/rules/${id}`, { is_active }).then(r => r.data),

  deleteEscalationRule: (id: number) =>
    api.delete<{ success: true }>(`/escalations/rules/${id}`).then(r => r.data),

  listEscalationLog: () =>
    api.get<EscalationLogEntry[]>('/escalations/log').then(r => r.data),

  resolveEscalation: (id: number) =>
    api.patch<EscalationLogEntry>(`/escalations/log/${id}/resolve`).then(r => r.data),

  // Analytics
  getAnalyticsQoq: () =>
    api.get<AnalyticsQoq[]>('/admin/analytics/qoq').then(r => r.data),

  getAnalyticsDistribution: () =>
    api.get<AnalyticsDistribution[]>('/admin/analytics/distribution').then(r => r.data),

  getAnalyticsManagerEffectiveness: () =>
    api.get<AnalyticsManagerEffectiveness[]>('/admin/analytics/manager-effectiveness').then(r => r.data),
}
