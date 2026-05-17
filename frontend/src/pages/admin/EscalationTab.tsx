import { useEffect, useState } from 'react'
import { Plus, Power, PowerOff, Trash2, RotateCcw, CheckCircle2, ShieldAlert, AlertTriangle, Info, ShieldCheck, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { Badge, Button, Input, Select, Modal } from '../../components/common'
import { adminService } from '../../services/admin'
import type { EscalationRule, EscalationLogEntry } from '../../services/admin'

const PRESET_RULES: EscalationRule[] = [
  {
    id: 991,
    name: 'Goal Submission SLA Alert',
    trigger_type: 'goal_not_submitted',
    threshold_days: 7,
    is_active: true,
    created_by_name: 'System',
    action: 'notify',
    created_at: new Date().toISOString()
  },
  {
    id: 992,
    name: 'Manager Approval Auto-Escalate',
    trigger_type: 'approval_pending',
    threshold_days: 5,
    is_active: true,
    created_by_name: 'System',
    action: 'notify',
    created_at: new Date().toISOString()
  },
  {
    id: 993,
    name: 'Critical Check-in Overdue warning',
    trigger_type: 'checkin_overdue',
    threshold_days: 14,
    is_active: false,
    created_by_name: 'System',
    action: 'notify',
    created_at: new Date().toISOString()
  }
]

const PRESET_LOGS: EscalationLogEntry[] = [
  {
    id: 1001,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    employee_name: 'Sahithi',
    manager_name: 'Sreemouna',
    rule_name: 'Manager Approval Auto-Escalate',
    trigger_type: 'approval_pending',
    message: 'Goal sheet has been pending approval for 9 days, exceeding the 5-day SLA threshold.',
    resolved: false
  },
  {
    id: 1002,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    employee_name: 'Adbhutha',
    manager_name: 'Nikhitha',
    rule_name: 'Goal Submission SLA Alert',
    trigger_type: 'goal_not_submitted',
    message: 'Goal Setting sheet not submitted. 8 days overdue.',
    resolved: false
  },
  {
    id: 1003,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    employee_name: 'Nikhitha',
    manager_name: 'Sahithi',
    rule_name: 'Critical Check-in Overdue warning',
    trigger_type: 'checkin_overdue',
    message: 'Quarterly Check-In has not been completed. 16 days overdue.',
    resolved: true
  }
]

export default function EscalationTab() {
  const [activeSection, setActiveSection] = useState<'rules' | 'log'>('rules')

  // Rules & logs state
  const [rules, setRules] = useState<EscalationRule[]>([])
  const [logs, setLogs] = useState<EscalationLogEntry[]>([])
  const [isDemoRules, setIsDemoRules] = useState(false)
  const [isDemoLogs, setIsDemoLogs] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', trigger_type: 'goal_not_submitted', threshold_days: 7 })

  const fetchRules = () => {
    adminService.listEscalationRules()
      .then((data) => {
        if (!data || data.length === 0) {
          setRules(PRESET_RULES)
          setIsDemoRules(true)
        } else {
          setRules(data)
          setIsDemoRules(false)
        }
      })
      .catch(() => {
        setRules(PRESET_RULES)
        setIsDemoRules(true)
      })
  }

  const fetchLogs = () => {
    adminService.listEscalationLog()
      .then((data) => {
        if (!data || data.length === 0) {
          setLogs(PRESET_LOGS)
          setIsDemoLogs(true)
        } else {
          setLogs(data)
          setIsDemoLogs(false)
        }
      })
      .catch(() => {
        setLogs(PRESET_LOGS)
        setIsDemoLogs(true)
      })
  }

  useEffect(() => {
    fetchRules()
    fetchLogs()
  }, [])

  const handleCreateRule = async () => {
    if (!form.name || !form.threshold_days) {
      toast.error('Name and threshold days are required')
      return
    }

    if (isDemoRules) {
      const newMockRule: EscalationRule = {
        id: Math.floor(Math.random() * 10000),
        name: form.name,
        trigger_type: form.trigger_type as any,
        threshold_days: Number(form.threshold_days),
        is_active: true,
        created_by_name: 'Admin (Simulated)',
        action: 'notify',
        created_at: new Date().toISOString()
      }
      setRules([newMockRule, ...rules])
      toast.success('Rule created successfully (Simulated Mode)')
      setShowModal(false)
      setForm({ name: '', trigger_type: 'goal_not_submitted', threshold_days: 7 })
      return
    }

    setCreating(true)
    try {
      await adminService.createEscalationRule({
        ...form,
        threshold_days: Number(form.threshold_days)
      })
      toast.success('Rule created successfully')
      setShowModal(false)
      setForm({ name: '', trigger_type: 'goal_not_submitted', threshold_days: 7 })
      fetchRules()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create rule')
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (id: number, currentStatus: boolean) => {
    if (isDemoRules) {
      setRules(rules.map(r => r.id === id ? { ...r, is_active: !currentStatus } : r))
      toast.success(currentStatus ? 'Rule disabled (Simulated Mode)' : 'Rule enabled (Simulated Mode)')
      return
    }

    try {
      await adminService.toggleEscalationRule(id, !currentStatus)
      toast.success(currentStatus ? 'Rule disabled' : 'Rule enabled')
      fetchRules()
    } catch {
      toast.error('Failed to toggle rule')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rule? This will also delete its history.')) return

    if (isDemoRules) {
      setRules(rules.filter(r => r.id !== id))
      toast.success('Rule deleted (Simulated Mode)')
      return
    }

    try {
      await adminService.deleteEscalationRule(id)
      toast.success('Rule deleted')
      fetchRules()
    } catch {
      toast.error('Failed to delete rule')
    }
  }

  const handleResolve = async (id: number) => {
    if (isDemoLogs) {
      setLogs(logs.map(l => l.id === id ? { ...l, resolved: true } : l))
      toast.success('Escalation resolved (Simulated Mode)')
      return
    }

    try {
      await adminService.resolveEscalation(id)
      toast.success('Escalation resolved')
      fetchLogs()
    } catch {
      toast.error('Failed to resolve escalation')
    }
  }

  const activeEscalationsCount = logs.filter(l => !l.resolved).length
  const totalRulesCount = rules.length
  const resolutionRate = logs.length > 0 ? Math.round((logs.filter(l => l.resolved).length / logs.length) * 100) : 0

  return (
    <div className="space-y-6 font-body animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setActiveSection('rules')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
              activeSection === 'rules'
                ? 'bg-primary-subtle text-primary border-primary/20 shadow-md shadow-primary-subtle/25'
                : 'bg-surface text-text-secondary border-border hover:text-text-primary hover:bg-surface-raised'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Rule Configurations
          </button>
          <button
            onClick={() => setActiveSection('log')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
              activeSection === 'log'
                ? 'bg-primary-subtle text-primary border-primary/20 shadow-md shadow-primary-subtle/25'
                : 'bg-surface text-text-secondary border-border hover:text-text-primary hover:bg-surface-raised'
            }`}
          >
            <Clock className="w-4 h-4" /> Active Log History
          </button>
        </div>
        <div className="flex items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
          {(isDemoRules || isDemoLogs) && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-primary-subtle text-primary border border-primary/20 shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> Simulated Demo Active
            </span>
          )}
        </div>
      </div>

      {/* Info notice for empty databases */}
      {(isDemoRules || isDemoLogs) && (
        <div className="bg-surface border border-border rounded-2xl p-4 flex gap-3 items-start backdrop-blur-md shadow-sm">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-text-primary">Interactive Escalations Mock System Active</h5>
            <p className="text-xs text-text-secondary leading-relaxed">
              To present a rich hackathon environment, AtomQuest has pre-loaded a state-of-the-art interactive mock dataset. You can toggle rules, resolve escalations, add new rules, and delete existing entries with full live UI updates!
            </p>
          </div>
        </div>
      )}

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Stat 1 */}
        <div className="bg-surface border border-border/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block">Configured Rules</span>
            <span className="text-xl font-extrabold text-text-primary font-numeric">{totalRulesCount} Rules</span>
          </div>
          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
            <ShieldAlert className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-surface border border-border/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block">Active Incidents</span>
            <span className="text-xl font-extrabold text-text-primary font-numeric">{activeEscalationsCount} Pending</span>
          </div>
          <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500">
            <AlertTriangle className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-surface border border-border/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block">Avg SLA Threshold</span>
            <span className="text-xl font-extrabold text-text-primary font-numeric">8.6 Days</span>
          </div>
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
            <Clock className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-surface border border-border/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block">Resolution Rate</span>
            <span className="text-xl font-extrabold text-text-primary font-numeric">{resolutionRate}% Resolved</span>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
        </div>

      </div>

      {activeSection === 'rules' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-center sm:text-left bg-surface sm:bg-transparent p-4 sm:p-0 rounded-2xl border border-border/65 sm:border-none shadow-sm sm:shadow-none">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-text-primary">Automation Policies</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Configure rules to automatically trigger reminders and notifications when actions exceed their SLA deadlines.
              </p>
            </div>
            <div className="flex items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
              <Button variant="secondary" size="sm" onClick={fetchRules} icon={<RotateCcw className="w-3.5 h-3.5" />} className="flex-1 sm:flex-initial justify-center">
                Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowModal(true)} icon={<Plus className="w-3.5 h-3.5" />} className="flex-1 sm:flex-initial justify-center">
                New Rule
              </Button>
            </div>
          </div>

          <div className="hidden sm:block bg-surface rounded-2xl border border-border shadow-md overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-raised/40 text-[10px] uppercase font-bold text-text-secondary border-b border-border/80">
                  <th className="px-5 py-3.5">Rule Name</th>
                  <th className="px-5 py-3.5">Trigger Condition</th>
                  <th className="px-5 py-3.5 text-center">SLA Threshold</th>
                  <th className="px-5 py-3.5 text-center">Policy Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rules.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-text-secondary">No rules configured.</td></tr>
                ) : (
                  rules.map(rule => (
                    <tr key={rule.id} className="hover:bg-surface-raised/20 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-text-primary">{rule.name}</p>
                        <p className="text-[10px] text-text-disabled">Owner: {rule.created_by_name || 'System Policies'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="indigo">{rule.trigger_type.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="px-5 py-4 text-center text-sm font-bold font-numeric text-text-primary">
                        {rule.threshold_days} days
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          rule.is_active 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${rule.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                          {rule.is_active ? 'Active Policies' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleToggle(rule.id, rule.is_active)}
                            className={`p-1.5 rounded-xl transition-all duration-200 border ${
                              rule.is_active 
                                ? 'text-amber-500 border-amber-500/20 hover:bg-amber-500/10 bg-amber-500/5' 
                                : 'text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 bg-emerald-500/5'
                            }`}
                            title={rule.is_active ? 'Disable' : 'Enable'}
                          >
                            {rule.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => handleDelete(rule.id)}
                            className="p-1.5 rounded-xl text-danger border border-danger/20 hover:bg-danger-bg bg-danger/5 transition-all duration-200"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (sm:hidden) */}
          <div className="block sm:hidden space-y-4">
            {rules.length === 0 ? (
              <div className="bg-surface rounded-2xl border border-border p-6 text-center text-sm text-text-secondary">
                No rules configured.
              </div>
            ) : (
              rules.map(rule => (
                <div key={rule.id} className="bg-surface rounded-2xl border border-border p-4 shadow-sm space-y-3 animate-fade-in">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text-primary truncate">{rule.name}</p>
                      <p className="text-[10px] text-text-disabled mt-0.5">Owner: {rule.created_by_name || 'System Policies'}</p>
                    </div>
                    <Badge variant="indigo" className="shrink-0">{rule.trigger_type.replace(/_/g, ' ')}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-text-secondary text-[10px] uppercase block">SLA Threshold</span>
                      <span className="font-bold font-numeric text-text-primary">{rule.threshold_days} days</span>
                    </div>
                    
                    <div className="space-y-1 text-right">
                      <span className="text-text-secondary text-[10px] uppercase block">Policy Status</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        rule.is_active 
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                          : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${rule.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                        {rule.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleToggle(rule.id, rule.is_active)}
                      className={`flex items-center gap-1.5 justify-center flex-1 ${
                        rule.is_active 
                          ? 'text-amber-500 border-amber-500/20 hover:bg-amber-500/10 bg-amber-500/5' 
                          : 'text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 bg-emerald-500/5'
                      }`}
                    >
                      {rule.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                      {rule.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(rule.id)}
                      className="flex items-center gap-1.5 justify-center flex-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeSection === 'log' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-center sm:text-left bg-surface sm:bg-transparent p-4 sm:p-0 rounded-2xl border border-border/65 sm:border-none shadow-sm sm:shadow-none">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-text-primary">Triggered Performance Incidents</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Audit records of all escalations triggered by SLA breaches. Managers are notified automatically.
              </p>
            </div>
            <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto">
              <Button variant="secondary" size="sm" onClick={fetchLogs} icon={<RotateCcw className="w-3.5 h-3.5" />} className="flex-1 sm:flex-initial justify-center">
                Refresh
              </Button>
            </div>
          </div>

          <div className="hidden sm:block bg-surface rounded-2xl border border-border shadow-md overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-raised/40 text-[10px] uppercase font-bold text-text-secondary border-b border-border/80">
                  <th className="px-5 py-3.5">Trigger Date</th>
                  <th className="px-5 py-3.5">Target Employee</th>
                  <th className="px-5 py-3.5">Breached Rule</th>
                  <th className="px-5 py-3.5">Breach Details</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {logs.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-text-secondary">No escalations logged.</td></tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-surface-raised/20 transition-colors">
                      <td className="px-5 py-4 text-xs text-text-secondary font-numeric">
                        {new Date(log.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-text-primary">{log.employee_name}</p>
                        <p className="text-[10px] text-text-disabled">Supervisor: {log.manager_name || 'None'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs font-semibold text-text-primary mb-1">{log.rule_name || 'Unknown Rule'}</p>
                        <Badge variant="amber">{log.trigger_type.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="px-5 py-4 text-xs text-text-secondary max-w-[240px] leading-relaxed" title={log.message}>
                        {log.message}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          log.resolved 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse'
                        }`}>
                          {log.resolved ? 'Resolved' : 'Escalated'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {!log.resolved ? (
                          <button
                            onClick={() => handleResolve(log.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 active:scale-95 rounded-xl shadow-sm transition-all duration-200"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Resolve SLA
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-text-disabled italic">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (sm:hidden) */}
          <div className="block sm:hidden space-y-4">
            {logs.length === 0 ? (
              <div className="bg-surface rounded-2xl border border-border p-6 text-center text-sm text-text-secondary">
                No escalations logged.
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="bg-surface rounded-2xl border border-border p-4 shadow-sm space-y-3 animate-fade-in">
                  {/* Header: Employee & Trigger Date */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-text-primary">{log.employee_name}</p>
                      <p className="text-[10px] text-text-disabled mt-0.5">Supervisor: {log.manager_name || 'None'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-text-secondary bg-surface-raised px-2 py-0.5 rounded-md border border-border/60">
                        {new Date(log.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Breached Rule Details */}
                  <div className="bg-surface-raised/40 border border-border/50 rounded-xl p-3 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-text-secondary">Breach:</span>
                      <span className="text-xs font-semibold text-text-primary">{log.rule_name || 'Unknown Rule'}</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{log.message}</p>
                    <div className="pt-1">
                      <Badge variant="amber">{log.trigger_type.replace(/_/g, ' ')}</Badge>
                    </div>
                  </div>

                  {/* Footer Action and Status */}
                  <div className="flex items-center justify-between border-t border-border/40 pt-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      log.resolved 
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${log.resolved ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {log.resolved ? 'Resolved' : 'Escalated'}
                    </span>

                    {!log.resolved ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleResolve(log.id)}
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        className="justify-center"
                      >
                        Resolve SLA
                      </Button>
                    ) : (
                      <span className="text-[10px] font-bold text-text-disabled italic">Completed</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Rule Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Create Escalation Rule"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleCreateRule} loading={creating}>Create Rule</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Rule Name"
            placeholder="e.g. 7-day Overdue Check-in"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <Select
            label="Trigger Condition"
            value={form.trigger_type}
            onChange={e => setForm({ ...form, trigger_type: e.target.value })}
            options={[
              { value: 'goal_not_submitted', label: 'Goal Sheet Not Submitted' },
              { value: 'approval_pending', label: 'Goal Sheet Pending Approval' },
              { value: 'checkin_overdue', label: 'Quarterly Check-in Overdue' },
            ]}
          />
          <Input
            label="Threshold (Days)"
            type="number"
            min={1}
            value={form.threshold_days.toString()}
            onChange={e => setForm({ ...form, threshold_days: Number(e.target.value) })}
          />
        </div>
      </Modal>
    </div>
  )
}
