import api from './api'

export interface AchievementGoal {
  goal_id: number
  employee_id: number
  thrust_area: string
  title: string
  description: string | null
  uom: string
  target: number | null
  deadline: string | null
  weightage: number
  goal_status: string
  cycle_year: number
  achievement_id: number | null
  quarter: string | null
  actual: number | null
  completion_date: string | null
  progress_status: 'not_started' | 'on_track' | 'off_track' | 'completed' | null
  score: number | null
  updated_at: string | null
}

export interface AchievementPayload {
  goal_id: number
  quarter: string
  actual?: number | null
  completion_date?: string | null
  progress_status?: 'not_started' | 'on_track' | 'off_track' | 'completed' | null
}

export interface CheckinComment {
  id: number
  employee_id: number
  manager_id: number
  quarter: string
  comment: string
  created_at: string
  employee_name?: string
  manager_name?: string
}

export const achievementsService = {
  /**
   * Fetches goals joined with achievements for a given quarter
   */
  list: (params: { quarter: string; employee_id?: number; cycle_year?: number }) =>
    api.get<AchievementGoal[]>('/achievements', { params }).then(r => r.data),

  /**
   * Logs or updates a quarterly achievement actual value and status (upsert)
   */
  log: (payload: AchievementPayload) =>
    api.post<AchievementGoal>('/achievements', payload).then(r => r.data),

  /**
   * Updates an existing quarterly achievement log by id
   */
  update: (id: number, payload: Omit<AchievementPayload, 'goal_id' | 'quarter'>) =>
    api.put<AchievementGoal>(`/achievements/${id}`, payload).then(r => r.data),

  /**
   * Posts checkin or revision comment from manager
   */
  postComment: (payload: { employee_id: number; quarter: string; comment: string }) =>
    api.post<CheckinComment>('/checkins/comment', payload).then(r => r.data),

  /**
   * Retrieves all check-in comments for the active user
   */
  getComments: () =>
    api.get<CheckinComment[]>('/checkins').then(r => r.data),
}
