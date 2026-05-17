import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { 
  Mail, 
  Trash2, 
  RefreshCw, 
  X, 
  ExternalLink, 
  Inbox, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ArrowLeft
} from 'lucide-react'

interface EmailLogItem {
  id: string
  to: string
  subject: string
  html: string
  previewUrl: string | null
  sentAt: string
  status: 'sent' | 'failed'
  error?: string
}

export default function EmailSimulationDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [emails, setEmails] = useState<EmailLogItem[]>([])
  const [selectedEmail, setSelectedEmail] = useState<EmailLogItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasNew, setHasNew] = useState(false)
  const prevEmailsLengthRef = useRef(0)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const BASE_URL = API_URL.replace('/api', '')
  const EMAILS_URL = `${BASE_URL}/api/emails`

  // Fetch emails
  const fetchEmails = async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const res = await axios.get(EMAILS_URL)
      const data = res.data as EmailLogItem[]
      
      // Sort: newest first
      const sorted = [...data].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      setEmails(sorted)

      // Check if new emails arrived
      if (sorted.length > prevEmailsLengthRef.current) {
        if (prevEmailsLengthRef.current > 0) {
          setHasNew(true)
        }
        prevEmailsLengthRef.current = sorted.length
      } else if (sorted.length < prevEmailsLengthRef.current) {
        // Log cleared
        prevEmailsLengthRef.current = sorted.length
      }
    } catch (err) {
      console.error('Failed to fetch simulated emails:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Clear emails
  const clearEmails = async () => {
    if (!window.confirm('Are you sure you want to clear the email simulation logs?')) return
    setIsLoading(true)
    try {
      await axios.delete(EMAILS_URL)
      setEmails([])
      setSelectedEmail(null)
      prevEmailsLengthRef.current = 0
      setHasNew(false)
    } catch (err) {
      console.error('Failed to clear emails:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Poll for new emails in background
  useEffect(() => {
    fetchEmails(true)
    const interval = setInterval(() => {
      fetchEmails(true)
    }, 4000) // Poll every 4 seconds

    return () => clearInterval(interval)
  }, [])

  // Reset notification dot when opening drawer
  useEffect(() => {
    if (isOpen) {
      setHasNew(false)
    }
  }, [isOpen])

  // Format date helper
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'N/A'
    }
  }

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    } catch {
      return ''
    }
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-[45] flex items-center justify-center w-14 h-14 rounded-full bg-primary hover:bg-primary-emphasis text-primary-on border border-primary/20 shadow-2xl transition-all duration-300 active:scale-95 group ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        title="Email Simulation Hub"
      >
        <Mail className="w-6 h-6 transition-transform group-hover:scale-110" />
        
        {/* Pulsing notification badge */}
        {emails.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6">
            {hasNew && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
            )}
            <span className="relative inline-flex rounded-full h-6 w-6 bg-danger border-2 border-surface text-[10px] font-black text-text-inverse items-center justify-center font-numeric">
              {emails.length}
            </span>
          </span>
        )}
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-over Drawer Pane */}
      <div
        className={`fixed top-0 right-0 h-screen w-full sm:w-[480px] md:w-[540px] z-50 bg-surface/95 backdrop-blur-xl border-l border-border/80 shadow-2xl transition-transform duration-300 ease-out flex flex-col font-body ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header - Redesigned for rich premium aesthetics */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 via-surface/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10 shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-text-primary flex items-center gap-2 font-heading tracking-tight">
                Email Simulation Log
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[8px] font-mono tracking-widest uppercase font-black">
                  <Sparkles className="w-2.5 h-2.5 text-primary" /> Dev Mode
                </span>
              </h2>
              <p className="text-[10px] text-text-secondary font-medium tracking-wide mt-0.5">Capture and preview notification emails in real-time</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-surface-raised border border-transparent hover:border-border hover:shadow-sm rounded-xl text-text-secondary hover:text-text-primary transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-5 py-3 bg-surface border-b border-border flex items-center justify-between text-xs">
          <span className="text-text-secondary font-medium">
            Total Captured: <span className="inline-block ml-1 px-1.5 py-0.5 bg-surface-raised border border-border/80 rounded font-black text-text-primary font-numeric">{emails.length}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchEmails(false)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-raised border border-border/80 text-text-secondary hover:text-text-primary rounded-xl transition-all font-bold text-[11px] shadow-sm hover:shadow active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-text-secondary ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {emails.length > 0 && (
              <button
                onClick={clearEmails}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-danger-bg border border-border/80 hover:border-danger/20 text-text-secondary hover:text-danger rounded-xl transition-all font-bold text-[11px] shadow-sm hover:shadow active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Logs
              </button>
            )}
          </div>
        </div>

        {/* Drawer Body - Split View if email is selected */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col relative custom-scrollbar">
          {emails.length === 0 ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bg/50">
              <div className="w-16 h-16 rounded-full bg-surface border border-border/80 flex items-center justify-center text-text-disabled mb-4 shadow-sm">
                <Inbox className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-text-primary mb-1">No notification emails logged</h3>
              <p className="text-xs text-text-secondary max-w-[260px] leading-relaxed">
                When you submit performance goal sheets, approve goals, or return draft goals for revision, simulated emails will appear here instantly in real-time.
              </p>
            </div>
          ) : selectedEmail ? (
            /* Active Email Details Panel */
            <div className="flex-1 flex flex-col min-h-0 bg-bg">
              {/* Back to Inbox Bar */}
              <div className="p-3 border-b border-border bg-surface flex items-center justify-between">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="text-xs text-primary font-bold hover:text-primary-emphasis flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-primary-subtle transition-all active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Log List
                </button>
                {selectedEmail.previewUrl && (
                  <a
                    href={selectedEmail.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-on hover:bg-primary-emphasis text-xs font-bold rounded-xl shadow-lg shadow-primary/10 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Ethereal Mail
                  </a>
                )}
              </div>

              {/* Email Envelope Meta Details - Redesigned as structured envelope ticket */}
              <div className="p-5 bg-surface border-b border-border space-y-4">
                <div>
                  <h3 className="text-sm font-black text-text-primary leading-snug tracking-tight">
                    {selectedEmail.subject}
                  </h3>
                </div>
                
                {/* Envelope details grid */}
                <div className="grid grid-cols-2 gap-3.5 bg-surface-raised border border-border/60 p-3.5 rounded-2xl text-xs font-body shadow-sm">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-text-disabled uppercase tracking-wider block">Sender</span>
                    <span className="text-text-primary font-semibold truncate block font-mono text-[10px]">
                      noreply@atomquest.app
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-text-disabled uppercase tracking-wider block">Recipient</span>
                    <span className="text-text-primary font-semibold truncate block font-mono text-[10px]">
                      {selectedEmail.to}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-text-disabled uppercase tracking-wider block">Delivery Status</span>
                    <div className="flex items-center gap-1">
                      {selectedEmail.status === 'sent' ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-success font-black uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" /> Delivered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-danger font-black uppercase tracking-wider">
                          <AlertCircle className="w-3.5 h-3.5 text-danger shrink-0" /> Failed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-text-disabled uppercase tracking-wider block">Timestamp</span>
                    <span className="text-text-secondary font-semibold block font-numeric text-[10px]">
                      {formatDate(selectedEmail.sentAt)} at {formatTime(selectedEmail.sentAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Styled Email Body HTML Render inside safe Iframe Mock Browser */}
              <div className="flex-1 bg-surface-raised p-4 flex flex-col">
                <div className="flex-1 bg-surface border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col">
                  {/* Email Browser Mock Chrome Header */}
                  <div className="bg-surface-raised px-4 py-2 flex items-center justify-between border-b border-border/80 shrink-0">
                    {/* Left mock browser dots */}
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-danger/20 border border-danger/40"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-warning/20 border border-warning/40"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-success/20 border border-success/40"></span>
                    </div>
                    {/* Mock URL block */}
                    <div className="flex-1 max-w-[200px] sm:max-w-xs mx-auto bg-surface border border-border/80 rounded-lg px-2.5 py-0.5 text-[9px] text-text-disabled text-center truncate font-mono select-none">
                      atomquest.app/inbox/email/{selectedEmail.id.substring(0, 8)}
                    </div>
                    {/* Right empty balance spacer */}
                    <div className="w-12"></div>
                  </div>

                  {/* Sandboxed Iframe */}
                  <iframe
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <style>
                            body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
                            .email-container { background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); border: 1px solid #e2e8f0; }
                          </style>
                        </head>
                        <body>
                          <div style="background-color: #f8fafc; padding: 20px; min-height: 100vh;">
                            <div class="email-container">
                              ${selectedEmail.html}
                            </div>
                          </div>
                        </body>
                      </html>
                    `}
                    className="flex-1 w-full border-0 bg-bg"
                    title="Rendered Email HTML Template"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Log List - Redesigned as modern inbox items */
            <div className="divide-y divide-border/60">
              {emails.map(email => {
                const isSent = email.status === 'sent'
                return (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className="p-4 border-b border-border/40 hover:bg-surface-raised/30 transition-all duration-150 cursor-pointer flex gap-3 relative group overflow-hidden"
                  >
                    {/* Status vertical bar indication */}
                    <span className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-200 ${
                      isSent 
                        ? 'bg-gradient-to-b from-success to-success/70 group-hover:w-2' 
                        : 'bg-gradient-to-b from-danger to-danger/70 group-hover:w-2'
                    }`} />

                    {/* Initials Avatar Badge */}
                    <div className="w-8 h-8 rounded-full bg-surface-raised border border-border flex items-center justify-center text-[10px] font-black text-text-secondary shrink-0 group-hover:border-primary/30 group-hover:text-primary transition-colors uppercase">
                      {email.to.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[11px] font-extrabold text-text-primary capitalize truncate">
                            {email.to.split('@')[0]}
                          </span>
                          <span className="text-[9px] font-medium text-text-disabled lowercase font-mono hidden sm:inline truncate">
                            &lt;{email.to}&gt;
                          </span>
                        </div>
                        <span className="text-[10px] text-text-secondary font-semibold font-numeric shrink-0 whitespace-nowrap">
                          {formatTime(email.sentAt)}
                        </span>
                      </div>
                      
                      <h4 className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors leading-tight line-clamp-1">
                        {email.subject}
                      </h4>
                      
                      <div className="flex items-center justify-between gap-4 mt-0.5">
                        <p className="text-[10px] text-text-secondary truncate pr-4 mt-0.5 line-clamp-1">
                          {email.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
                        </p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                          isSent ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'
                        }`}>
                          {email.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
