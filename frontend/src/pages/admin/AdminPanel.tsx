import { Routes, Route, Navigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import UsersTab from './UsersTab'
import GoalsTab from './GoalsTab'
import ReportsTab from './ReportsTab'
import AuditTab from './AuditTab'
import EscalationTab from './EscalationTab'
import AnalyticsTab from './AnalyticsTab'
import CheckinView from '../manager/CheckinView'

export default function AdminPanel() {


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-lg">
        <h1 className="text-2xl font-heading font-extrabold text-text-primary tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Administration Console
        </h1>
        <p className="text-text-secondary text-sm mt-1 leading-relaxed">
          Manage users, oversee organizational goals, generate reports, and review audit trails.
        </p>
      </div>

      {/* Routed Content */}
      <div className="pt-2">
        <Routes>
          <Route index element={<UsersTab />} />
          <Route path="goals" element={<GoalsTab />} />
          <Route path="checkins" element={<CheckinView />} />
          <Route path="reports" element={<ReportsTab />} />
          <Route path="escalations" element={<EscalationTab />} />
          <Route path="analytics" element={<AnalyticsTab />} />
          <Route path="audit" element={<AuditTab />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  )
}
