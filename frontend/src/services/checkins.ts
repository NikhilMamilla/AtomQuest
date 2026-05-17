import api from './api'
import type { Goal } from './goals'

export interface CheckinComment {
  id: number
  employee_id: number
  employee_name?: string
  manager_id: number
  manager_name?: string
  quarter: string
  comment: string
  created_at: string
}

export const checkinsService = {
  /**
   * Fetches all goals of reporting team members for the manager
   */
  listTeamGoals: (year?: number) =>
    api.get<Goal[]>('/checkins/team-goals', { params: { cycle_year: year } }).then(r => r.data),

  /**
   * Submits a new review/revision or checkin comment for a reporting employee
   */
  postComment: (employeeId: number, quarter: string, comment: string) =>
    api.post<CheckinComment>('/checkins/comment', { employee_id: employeeId, quarter, comment }).then(r => r.data),

  /**
   * Fetches the checkin history comments list
   */
  list: () =>
    api.get<CheckinComment[]>('/checkins').then(r => r.data),
}
