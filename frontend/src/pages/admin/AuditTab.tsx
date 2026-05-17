import { useEffect, useState, useMemo } from 'react'
import { RotateCcw, ScrollText, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '../../components/common'
import { adminService } from '../../services/admin'
import type { AuditEntry } from '../../services/admin'

const PAGE_SIZE = 20

// ── Helpers ──────────────────────────────────────────────────



function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function groupByDate(entries: AuditEntry[]): Record<string, AuditEntry[]> {
  const groups: Record<string, AuditEntry[]> = {}
  entries.forEach(entry => {
    const d = new Date(entry.created_at)
    const today = new Date()
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)

    let key: string
    if (d.toDateString() === today.toDateString()) key = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday'
    else key = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

    if (!groups[key]) groups[key] = []
    groups[key].push(entry)
  })
  return groups
}

function actionMeta(action: string) {
  const a = action.toUpperCase()
  if (a.includes('UNLOCK'))  return { label: 'Unlocked',  dot: 'bg-amber-500',   text: 'text-amber-500',   bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
  if (a.includes('APPROVE')) return { label: 'Approved',  dot: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
  if (a.includes('RETURN'))  return { label: 'Returned',  dot: 'bg-rose-500',    text: 'text-rose-500',    bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
  if (a.includes('SUBMIT'))  return { label: 'Submitted', dot: 'bg-sky-500',     text: 'text-sky-500',     bg: 'bg-sky-500/10', border: 'border-sky-500/20' }
  if (a.includes('CREATE'))  return { label: 'Created',   dot: 'bg-indigo-500',  text: 'text-indigo-500',  bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' }
  if (a.includes('UPDATE'))  return { label: 'Updated',   dot: 'bg-violet-500',  text: 'text-violet-500',  bg: 'bg-violet-500/10', border: 'border-violet-500/20' }
  if (a.includes('DELETE'))  return { label: 'Deleted',   dot: 'bg-rose-500',    text: 'text-rose-500',    bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
  return { label: action.replace(/_/g, ' '), dot: 'bg-text-disabled', text: 'text-text-secondary', bg: 'bg-surface/50', border: 'border-border/30' }
}

function diffEntries(oldVal: Record<string, unknown> | null, newVal: Record<string, unknown> | null) {
  if (!oldVal && !newVal) return []
  const allKeys = new Set([...Object.keys(oldVal || {}), ...Object.keys(newVal || {})])
  const diffs: { key: string; from: string; to: string }[] = []
  allKeys.forEach(key => {
    const from = oldVal?.[key]
    const to = newVal?.[key]
    if (String(from) !== String(to)) {
      diffs.push({ key, from: from != null ? String(from) : '—', to: to != null ? String(to) : '—' })
    }
  })
  return diffs
}

// ── Component ────────────────────────────────────────────────

export default function AuditTab() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const fetchAudit = () => {
    setLoading(true)
    adminService.auditLog()
      .then(data => { setEntries(data); setPage(1) })
      .catch(() => toast.error('Failed to load audit log'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAudit() }, [])

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter(e =>
      (e.user_name || '').toLowerCase().includes(q) ||
      (e.action || '').toLowerCase().includes(q) ||
      (e.goal_title || '').toLowerCase().includes(q)
    )
  }, [entries, search])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageEntries = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const grouped = groupByDate(pageEntries)

  // ── Loading state ──
  if (loading && entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 font-body">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-primary"></div>
        <p className="text-text-secondary text-xs mt-4">Loading audit trail…</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 font-body animate-fade-in pb-4">

      {/* ── Header bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface p-4 rounded-2xl border border-border/80 shadow-sm text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-3 min-w-0 self-center sm:self-auto">
          <span className="text-xs text-text-secondary tabular-nums">
            Showing <span className="font-semibold text-text-primary">{filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</span>-
            <span className="font-semibold text-text-primary">{Math.min(filtered.length, page * PAGE_SIZE)}</span> of{' '}
            <span className="font-semibold text-text-primary">{filtered.length}</span> entries
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
          {/* Top Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center bg-bg border border-border/80 rounded-xl p-0.5 shadow-sm">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 text-text-secondary hover:text-text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] text-text-secondary font-mono px-3 border-x border-border/50 select-none">
                Page {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 text-text-secondary hover:text-text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-disabled pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Filter by name, action…"
              className="pl-8 pr-3 py-1.5 w-48 text-xs bg-bg border border-border rounded-lg text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={fetchAudit} icon={<RotateCcw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <ScrollText className="w-7 h-7 text-text-disabled mx-auto mb-3" />
          <p className="text-sm text-text-secondary">
            {search ? 'No entries match your search.' : 'No audit records yet.'}
          </p>
          <p className="text-xs text-text-disabled mt-1">
            {search ? 'Try a different keyword.' : 'Actions like approvals and unlocks will appear here.'}
          </p>
        </div>
      ) : (
        <>
          {/* ── Timeline ── */}
          <div className="space-y-8">
            {Object.entries(grouped).map(([dateLabel, items]) => (
              <div key={dateLabel} className="space-y-4">
                {/* Date header */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-disabled bg-surface px-2.5 py-1 rounded-md border border-border/40">{dateLabel}</span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>

                {/* Entries for this date */}
                <div className="relative pl-6 space-y-3">
                  {/* Vertical Timeline Guide Track */}
                  <div className="absolute left-[10px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-border/80 via-border/50 to-border/20 rounded-full" />

                  {items.map(entry => {
                    const meta = actionMeta(entry.action)
                    const isExpanded = expandedId === entry.id
                    const diffs = diffEntries(entry.old_value, entry.new_value)
                    const hasDiff = diffs.length > 0

                    return (
                      <div key={entry.id} className="relative group">
                        {/* Timeline Node dot */}
                        <div className={`absolute left-[-20px] top-[17px] w-3 h-3 rounded-full border-2 border-bg shadow-sm z-10 shrink-0 transition-transform duration-200 group-hover:scale-125 ${meta.dot}`} />

                        {/* Row */}
                        <button
                          type="button"
                          onClick={() => hasDiff && setExpandedId(isExpanded ? null : entry.id)}
                          className={`w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 rounded-xl border shadow-sm transition-all duration-200 ${
                            isExpanded
                              ? 'bg-surface-raised border-border shadow-md shadow-black/5'
                              : 'bg-surface border-border/80 hover:bg-surface-raised hover:border-border hover:translate-x-1'
                          } ${hasDiff ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          {/* Main content */}
                          <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide uppercase ${meta.bg} ${meta.text} border ${meta.border} shrink-0`}>
                              {meta.label}
                            </span>
                            <span className="font-extrabold text-text-primary text-xs shrink-0">{entry.user_name || 'System'}</span>
                            {entry.user_role && (
                              <span className="text-[9px] text-text-disabled uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-bg/50 border border-border/30 shrink-0">
                                {entry.user_role}
                              </span>
                            )}
                            {entry.goal_title && (
                              <span className="text-text-secondary text-xs truncate max-w-xs sm:max-w-md inline-block align-middle ml-1">
                                on <span className="text-text-primary font-semibold">"{entry.goal_title}"</span>
                              </span>
                            )}
                          </div>

                          {/* Time + expand hint */}
                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            <span className="text-[10px] text-text-disabled font-medium font-numeric bg-bg/50 px-2 py-1 rounded-md border border-border/20">
                              {formatTimestamp(entry.created_at)}
                            </span>
                            {hasDiff && (
                              <ChevronRight className={`w-3.5 h-3.5 text-text-disabled transition-transform duration-150 ${isExpanded ? 'rotate-90 text-primary' : ''}`} />
                            )}
                          </div>
                        </button>

                        {/* Expanded diff */}
                        {isExpanded && hasDiff && (
                          <div className="mt-2 mb-4 rounded-xl bg-bg border border-border/80 overflow-hidden shadow-inner animate-slide-down">
                            <div className="bg-surface/50 px-4 py-2 border-b border-border/60 flex items-center justify-between">
                              <span className="text-[9px] uppercase tracking-wider font-extrabold text-text-disabled">Detailed State Changes</span>
                              <span className="text-[9px] text-text-disabled font-mono">{diffs.length} fields modified</span>
                            </div>
                            <div className="divide-y divide-border/40">
                              {diffs.map(d => (
                                <div key={d.key} className="grid grid-cols-1 md:grid-cols-3 gap-2 px-4 py-3 items-center hover:bg-surface/20 transition-colors">
                                  <div className="text-[10px] font-mono font-bold text-text-secondary truncate">{d.key}</div>
                                  <div className="flex items-center gap-1.5 bg-rose-500/5 border border-rose-500/10 text-rose-500 px-3 py-1.5 rounded-lg font-mono text-[10px] truncate">
                                    <span className="text-[9px] font-extrabold text-rose-400 select-none">-</span> {d.from}
                                  </div>
                                  <div className="flex items-center gap-1.5 bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-lg font-mono text-[10px] truncate">
                                    <span className="text-[9px] font-extrabold text-emerald-400 select-none">+</span> {d.to}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Pagination (Left/Middle Aligned as requested for quick pagination without scrolling to bottom) */}
          {totalPages > 1 && (
            <div className="flex items-center gap-4 pt-4 border-t border-border/40 mt-6">
              <div className="flex items-center bg-surface border border-border/80 rounded-xl p-0.5 shadow-sm">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2 text-text-secondary hover:text-text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] text-text-secondary font-mono px-4 border-x border-border/50 select-none">
                  Page {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 text-text-secondary hover:text-text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs text-text-disabled font-medium">
                Showing entries {(page - 1) * PAGE_SIZE + 1} - {Math.min(filtered.length, page * PAGE_SIZE)} of {filtered.length}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
