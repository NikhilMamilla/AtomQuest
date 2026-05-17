import { Routes, Route, Navigate } from 'react-router-dom'
import ApprovalView from './ApprovalView'
import CheckinView from './CheckinView'
import TeamAnalytics from './TeamAnalytics'

export default function TeamDashboard() {
  return (
    <div className="animate-fade-in">
      {/* Wildcard nested routing - Clean, tabless container as sidebar is primary nav */}
      <Routes>
        <Route index element={<ApprovalView />} />
        <Route path="checkins" element={<CheckinView />} />
        <Route path="analytics" element={<TeamAnalytics />} />
        <Route path="*" element={<Navigate to="/manager" replace />} />
      </Routes>
    </div>
  )
}
