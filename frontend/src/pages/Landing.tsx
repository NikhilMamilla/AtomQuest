import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '../store/themeStore'
import { motion } from 'framer-motion'
import {
  Target, Sun, Moon, ArrowRight, CheckCircle2, Shield, BarChart3,
  Users, ClipboardCheck, Lock, TrendingUp, FileSpreadsheet,
  Zap, Eye, GitBranch, Calendar, Award, ChevronDown, Share2,
  Brain, Mail, AlertTriangle, Database, ArrowRightLeft,
  Copy, Check
} from 'lucide-react'

const navLinks = [
  { id: 'hero', title: 'Home' },
  { id: 'what-we-built', title: 'Features' },
  { id: 'grading-flow', title: 'Timeline' },
  { id: 'how-scoring-works', title: 'Scoring' },
  { id: 'roi-calculator', title: 'Calculator' },
  { id: 'three-roles', title: 'Roles' },
  { id: 'bonus', title: 'Bonus' },
  { id: 'technical-faq', title: 'FAQ' },
  { id: 'try-it', title: 'Demo' }
]

function usePillNav() {
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const show = useCallback(() => {
    setVisible(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setVisible(false), 2500)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y < 100) { setVisible(true); clearTimeout(timer.current); }
      else if (y < lastY.current) show()
      else setVisible(false)
      lastY.current = y
    }
    const onMove = (e: MouseEvent) => {
      if (e.clientY < 80) show()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMove)
      clearTimeout(timer.current)
    }
  }, [show])

  return visible
}

function SlideTabs({ scrollTo }: { scrollTo: (id: string) => void }) {
  const [active, setActive] = useState('Home')
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-25% 0px -65% 0px",
      threshold: 0,
    }

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const navItem = navLinks.find((link) => link.id === entry.target.id)
          if (navItem) setActive(navItem.title)
        }
      })
    }

    const observer = new IntersectionObserver(handleIntersect, observerOptions)
    navLinks.forEach((link) => {
      const element = document.getElementById(link.id)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <ul 
      onMouseLeave={() => setHovered(null)}
      className="relative flex items-center h-full gap-1.5 sm:gap-2 px-1"
    >
      {navLinks.map((nav) => {
        const isActive = active === nav.title
        const isHovered = hovered === nav.title

        return (
          <li
            key={nav.id}
            onMouseEnter={() => setHovered(nav.title)}
            onClick={() => {
              setActive(nav.title)
              scrollTo(nav.id)
            }}
            className={`relative px-2.5 sm:px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider cursor-pointer z-10 select-none transition-colors duration-300 rounded-full ${
              isActive 
                ? 'text-primary-on' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {/* Active background slider */}
            {isActive && (
              <motion.div
                layoutId="active-pill-bg"
                className="absolute inset-0 rounded-full z-0 bg-gradient-to-r from-primary to-accent shadow-md shadow-primary/10"
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              />
            )}
            
            {/* Hover background slider */}
            {isHovered && !isActive && (
              <motion.div
                layoutId="hover-pill-bg"
                className="absolute inset-0 rounded-full z-0 bg-text-secondary/15 dark:bg-white/5 border border-border/5"
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
              />
            )}

            <span className="relative z-10">{nav.title}</span>
          </li>
        )
      })}
    </ul>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useThemeStore()
  const navVisible = usePillNav()
  const [activeArchTab, setActiveArchTab] = useState<'bonus' | 'stack' | 'database'>('bonus')
  const [selectedSchemaTable, setSelectedSchemaTable] = useState<string>('users')
  const [activeStep, setActiveStep] = useState(0)
  const [employees, setEmployees] = useState(150)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const scrollTo = (id: string) => {
    const element = document.getElementById(id)
    if (!element) return

    const offset = 0 // Scroll exactly to the top of the full-screen section
    const bodyRect = document.body.getBoundingClientRect().top
    const elementRect = element.getBoundingClientRect().top
    const elementPosition = elementRect - bodyRect
    const offsetPosition = elementPosition - offset

    const startPosition = window.pageYOffset
    const distance = offsetPosition - startPosition
    const duration = 1200 // Butter-smooth, slow, cinematic duration
    let startTime: number | null = null

    const easeInOutCubic = (t: number) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    }

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime
      const timeElapsed = currentTime - startTime
      const run = easeInOutCubic(Math.min(timeElapsed / duration, 1))
      window.scrollTo(0, startPosition + distance * run)
      if (timeElapsed < duration) {
        requestAnimationFrame(animation)
      }
    }

    requestAnimationFrame(animation)
  }

  return (
    <div className="bg-bg text-text-primary font-body overflow-x-hidden scroll-smooth">

      <nav
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
          navVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-6 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-4 sm:gap-6 px-5 sm:px-7 py-3 rounded-full bg-surface/85 backdrop-blur-3xl border border-border/65 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] transition-all duration-300">
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => scrollTo('hero')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-md">
              <Target className="w-4 h-4 text-primary-on animate-pulse" />
            </div>
            <span className="text-base font-extrabold tracking-tight font-heading bg-gradient-to-r from-text-primary via-text-primary to-text-secondary bg-clip-text text-transparent hidden sm:inline">
              AtomQuest
            </span>
          </div>

          <div className="h-5 w-[1px] bg-border/50 hidden md:block" />

          <div className="hidden md:block">
            <SlideTabs scrollTo={scrollTo} />
          </div>

          <div className="h-5 w-[1px] bg-border/50" />

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-surface-raised text-text-secondary hover:text-text-primary hover:scale-105 active:scale-95 transition-all duration-200"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-primary" />}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2 text-xs font-bold rounded-full bg-gradient-to-r from-primary to-accent text-primary-on hover:scale-[1.03] active:scale-95 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      <section id="hero" className="min-h-screen flex flex-col items-center justify-center px-6 relative">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-subtle border border-primary/20 text-primary text-xs font-semibold mb-8 tracking-wider uppercase">
            <Zap className="w-3.5 h-3.5" /> AtomQuest Hackathon 1.0
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight font-heading leading-[1.1] mb-6">
            I Built the Future of
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Performance Management
            </span>
          </h1>

          <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            No more spreadsheets. No more email chains. I engineered a unified portal that handles the entire goal lifecycle from setting objectives to quarterly reviews with real-time visibility at every level.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="group w-full sm:w-auto px-8 py-4 text-sm font-semibold rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-on shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
            >
              Enter the Portal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => scrollTo('what-we-built')}
              className="w-full sm:w-auto px-8 py-4 text-sm font-semibold rounded-2xl border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 transition-all duration-300"
            >
              See What I Built
            </button>
          </div>
        </div>

        <button
          onClick={() => scrollTo('what-we-built')}
          className="absolute bottom-10 animate-bounce text-text-disabled hover:text-primary transition"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </section>

      <section id="what-we-built" className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-7xl w-full">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 text-center">My Solution</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-center mb-4">What I Built</h2>
          <p className="text-text-secondary text-center max-w-2xl mx-auto mb-14 text-sm sm:text-base">
            A complete, production-ready Goal Setting and Tracking Portal engineered from scratch that covers
            every requirement from Phase 1 through Phase 2, reinforced with extra bonus features I added.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: ClipboardCheck, title: 'Smart Goal Sheets', desc: 'Create structured goals with Thrust Areas, UoM types, weighted targets, and deadlines all validated in real time.', color: 'text-blue-400', bg: 'from-blue-500/15 to-indigo-500/15', border: 'border-blue-500/25' },
              { icon: GitBranch, title: 'Approval Workflow', desc: 'Managers review, inline edit targets and weightages, approve entire sheets, or return them for rework with feedback.', color: 'text-violet-400', bg: 'from-violet-500/15 to-purple-500/15', border: 'border-violet-500/25' },
              { icon: Lock, title: 'Auto Lock Security', desc: 'Goals lock instantly upon approval. No unauthorized alterations are permitted, guaranteeing complete data integrity.', color: 'text-amber-400', bg: 'from-amber-500/15 to-orange-500/15', border: 'border-amber-500/25' },
              { icon: TrendingUp, title: 'Quarterly Check-ins', desc: 'Employees log actuals each quarter. Managers add structured coaching feedback. System auto computes progress scores.', color: 'text-teal-400', bg: 'from-teal-500/15 to-cyan-500/15', border: 'border-teal-500/25' },
              { icon: Share2, title: 'Cascading Goals', desc: 'Managers push departmental KPIs to direct reports. Achievements sync dynamically across all linked sheets.', color: 'text-emerald-400', bg: 'from-emerald-500/15 to-green-500/15', border: 'border-emerald-500/25' },
              { icon: Shield, title: 'BRD Validation Engine', desc: 'Total weightage must be 100 percent. Min 10 percent per goal. Max 8 goals. All enforced server-side with zero loopholes.', color: 'text-rose-400', bg: 'from-rose-500/15 to-pink-500/15', border: 'border-rose-500/25' },
              { icon: FileSpreadsheet, title: 'JSONB Audit Ledger', desc: 'Granular audit trail logging all goals creation, updates, and status changes with PostgreSQL JSONB diff comparisons.', color: 'text-sky-400', bg: 'from-sky-500/15 to-blue-500/15', border: 'border-sky-500/25' },
              { icon: AlertTriangle, title: 'SLA Cron & Escalations', desc: 'Daily background cron jobs scan goal status and trigger email reminders or log compliance breaches.', color: 'text-fuchsia-400', bg: 'from-fuchsia-500/15 to-pink-500/15', border: 'border-fuchsia-500/25' },
            ].map((f, i) => (
              <div key={i} className={`group p-5 rounded-2xl bg-gradient-to-br ${f.bg} border ${f.border} hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between h-full`}>
                <div>
                  <div className={`w-10 h-10 rounded-xl bg-surface/80 border border-border/50 flex items-center justify-center mb-4 ${f.color}`}>
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-extrabold mb-1.5 font-heading text-text-primary">{f.title}</h3>
                  <p className="text-[11px] text-text-secondary leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => scrollTo('grading-flow')} className="mt-14 animate-bounce text-text-disabled hover:text-primary transition">
          <ChevronDown className="w-6 h-6" />
        </button>
      </section>

      <section id="grading-flow" className="min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-surface/10 relative overflow-hidden">
        <div className="absolute top-20 right-10 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-accent/5 rounded-full blur-[90px] pointer-events-none" />
        
        <div className="max-w-6xl w-full relative z-10">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 text-center">System Execution Lifecycle</p>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-center mb-4">Goal Pipeline & Live Operations</h2>
          <p className="text-text-secondary text-center max-w-2xl mx-auto mb-12 text-sm">
            I engineered an automated end-to-end data pipeline. Click on any lifecycle milestone to explore how the server enforces target controls, audit logs, and cron escalations in real-time.
          </p>

          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            {/* Steps interactive list */}
            <div className="lg:col-span-5 flex flex-col gap-2.5">
              {[
                { id: 0, title: "1. Goal Drafting", actor: "Employee Gate", badge: "Form Control", desc: "Goal weights must sum to 100%, weights >= 10%, max 8 goals. Checked instant client-side & double-enforced server-side." },
                { id: 1, title: "2. AST Plagiarism Scan", actor: "AST Guard Engine", badge: "Semantic Quality", desc: "Server tokenizes descriptions. Structural tree heuristics block copy-paste templates to maintain highest performance integrity." },
                { id: 2, title: "3. Target Adjustments", actor: "Manager Approval Gate", badge: "Interactive Review", desc: "Hansika reviews inline. Targets are scaled or returned with rich feedback before any database locks occur." },
                { id: 3, title: "4. Sheet Lock & JSONB Audit", actor: "Immutable Ledger", badge: "Postgres Persistence", desc: "Approved sheets lock instantly. A dynamic version diff state is generated and persisted as a JSONB record in audit tables." },
                { id: 4, title: "5. Periodic Cron Escalation", actor: "SLA Worker Daemon", badge: "Cron Engine", desc: "Background processes evaluate checks-ins. Overdue dates automatically record SLA compliance breaches and email Nikhil." }
              ].map((s) => {
                const isSelected = activeStep === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveStep(s.id)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-300 flex items-center gap-4 relative ${
                      isSelected 
                        ? 'bg-primary-subtle border-primary/40 shadow-lg shadow-primary/5' 
                        : 'bg-surface border-border/50 hover:border-border-emphasis'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isSelected ? 'bg-primary text-primary-on' : 'bg-surface-raised border border-border text-text-secondary'
                    }`}>
                      {s.id + 1}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-extrabold font-heading ${isSelected ? 'text-primary' : 'text-text-primary'}`}>{s.title}</p>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-surface-raised border border-border text-text-disabled uppercase font-semibold">{s.badge}</span>
                      </div>
                      <p className="text-[10px] text-text-secondary mt-1">{s.actor}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Console Output visualization panel */}
            <div className="lg:col-span-7 bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[10px] font-mono text-text-disabled uppercase ml-2">Console Live Output</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[9px] font-mono text-success uppercase">Node Engine Active</span>
                </div>
              </div>

              <div className="flex-grow font-mono text-[11px] text-text-secondary space-y-4">
                {activeStep === 0 && (
                  <>
                    <p className="text-primary font-bold">// INITIALIZING GOAL DRAFT CONTEXT</p>
                    <p className="text-text-secondary">Input: {"{ employeeId: 102, goalsCount: 5, totalWeightage: 100 }"}</p>
                    <p className="text-success">&gt; Enforcing BRD Ruleset v1.0.0...</p>
                    <p className="text-text-disabled">&gt; Rule 1/3 (Weightage limit = 100%): Sum is 100% [PASSED]</p>
                    <p className="text-text-disabled">&gt; Rule 2/3 (Goal weightage &gt;= 10%): All weights valid [PASSED]</p>
                    <p className="text-text-disabled">&gt; Rule 3/3 (Max 8 goals): Sheet has 5 goals [PASSED]</p>
                    <p className="text-success">&gt; Result: Context verified and approved for next pipeline stage.</p>
                  </>
                )}
                {activeStep === 1 && (
                  <>
                    <p className="text-violet-400 font-bold">// INITIATING AST PLAGIARISM CHECK</p>
                    <p className="text-text-secondary">Target Description: "Deliver responsive client portals and automate database queries..."</p>
                    <p className="text-accent">&gt; Tokenizing textual nodes into abstract tree representation...</p>
                    <p className="text-text-disabled">&gt; Extracting structural n-grams and calculating cosine mapping...</p>
                    <p className="text-text-disabled">&gt; Database comparison with 150 predefined template vectors...</p>
                    <p className="text-success">&gt; Match score: 14.2% [Below 35% copy threshold - HUMAN WRITTEN]</p>
                    <p className="text-success">&gt; Result: Objective approved. AST verification complete.</p>
                  </>
                )}
                {activeStep === 2 && (
                  <>
                    <p className="text-amber-400 font-bold">// INTERACTIVE MANAGER REVIEW OVERRIDE</p>
                    <p className="text-text-secondary">Target Sheet ID: #100481 • Employee: Sreemouna</p>
                    <p className="text-accent">&gt; Awaiting manager input on inline revisions...</p>
                    <p className="text-text-disabled">&gt; Sreemouna goal 2 weight adjusted: 20% --&gt; 25% by Hansika</p>
                    <p className="text-text-disabled">&gt; Sreemouna goal 4 target adjusted: 85% --&gt; 90% [Target heightened]</p>
                    <p className="text-success">&gt; Dynamic adjustments synchronized. Weight sum remains exactly 100%.</p>
                    <p className="text-success">&gt; Result: Approved sheets submitted to relational lock manager.</p>
                  </>
                )}
                {activeStep === 3 && (
                  <>
                    <p className="text-emerald-400 font-bold">// ENFORCING RELATIONAL ROW LOCKS & LEDGER</p>
                    <p className="text-text-secondary">Query: "UPDATE goals SET locked = true WHERE employee_id = 102;"</p>
                    <p className="text-accent">&gt; Row state updated in ACID database block.</p>
                    <p className="text-text-disabled">&gt; Transaction complete. Direct employee adjustments BLOCKED.</p>
                    <p className="text-text-disabled">&gt; Writing log to audit_log: old_value vs new_value diff parsed as JSONB.</p>
                    <pre className="text-[10px] text-text-disabled bg-surface-raised/50 p-2.5 rounded-lg overflow-x-auto">
{`"audit_log": {
  "action": "LOCK_SHEET",
  "meta": { "version": 2, "locked_at": "${new Date().toISOString()}" }
}`}
                    </pre>
                    <p className="text-success">&gt; Result: Database synchronized. Complete audit integrity guaranteed.</p>
                  </>
                )}
                {activeStep === 4 && (
                  <>
                    <p className="text-fuchsia-400 font-bold">// SLA DAEMON BACKGROUND WORKER EXECUTING</p>
                    <p className="text-text-secondary">Cron task: "SLA_COMPLIANCE_DAILY_CHECK"</p>
                    <p className="text-accent">&gt; Fetching unsubmitted check-ins and review state timestamps...</p>
                    <p className="text-text-disabled">&gt; Employee: Sreemouna • Check-in: Q1 actuals • Status: Approved [OK]</p>
                    <p className="text-warning">&gt; Employee: Hansika Team member #12 • Status: PENDING [Overdue by 4 days]</p>
                    <p className="text-warning">&gt; Writing compliance breach log to database escalations...</p>
                    <p className="text-success">&gt; SMTP Client: Direct notification dispatched successfully to manager.</p>
                  </>
                )}
              </div>

              <div className="border-t border-border/60 pt-3 mt-4 text-[10px] text-text-disabled flex items-center justify-between">
                <span>Actor: {activeStep === 0 ? 'sreemouna@atomquest.com' : activeStep === 2 ? 'hansika@atomquest.com' : 'system@atomquest.com'}</span>
                <span>Role: {activeStep === 0 ? 'Employee' : activeStep === 2 ? 'Manager' : 'System Service'}</span>
              </div>
            </div>
          </div>
        </div>

        <button onClick={() => scrollTo('how-scoring-works')} className="mt-14 animate-bounce text-text-disabled hover:text-primary transition">
          <ChevronDown className="w-6 h-6" />
        </button>
      </section>

      <section id="how-scoring-works" className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-surface/30">
        <div className="max-w-6xl w-full">
          <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-2 text-center">Automated Intelligence</p>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-center mb-8">Scoring & Schedules</h2>
          
          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            {/* Left: UoM Scoring Formulas */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold font-heading mb-2 text-text-primary">How Performance is Scored</h3>
                <p className="text-text-secondary text-xs mb-4">
                  The system automatically computes progress scores based on UoM types. No manual calculations ever.
                </p>
              </div>
              <div className="rounded-xl border border-border overflow-hidden bg-surface flex-grow">
                <div className="overflow-x-auto h-full">
                  <table className="w-full text-xs h-full">
                    <thead>
                      <tr className="border-b border-border bg-surface-raised/50">
                        <th className="text-left px-4 py-3.5 font-semibold text-text-secondary text-[10px] uppercase tracking-wider">UoM Type</th>
                        <th className="text-left px-4 py-3.5 font-semibold text-text-secondary text-[10px] uppercase tracking-wider hidden sm:table-cell">Use Case</th>
                        <th className="text-left px-4 py-3.5 font-semibold text-text-secondary text-[10px] uppercase tracking-wider">Our Formula</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { uom: 'Numeric or Percentage Min', desc: 'Revenue, Sales higher is better', formula: 'Actual ÷ Target' },
                        { uom: 'Numeric or Percentage Max', desc: 'Cost, TAT lower is better', formula: 'Target ÷ Actual' },
                        { uom: 'Timeline', desc: 'Project deadlines', formula: 'On time = 100 percent' },
                        { uom: 'Zero Based', desc: 'Safety incidents', formula: 'Zero = 100 percent, else 0 percent' },
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-surface-raised/30 transition">
                          <td className="px-4 py-3 font-medium font-mono text-primary text-[11px]">{row.uom}</td>
                          <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">{row.desc}</td>
                          <td className="px-4 py-3 font-mono text-accent text-[11px]">{row.formula}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Enforced check-in schedules */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold font-heading mb-2 text-text-primary">Quarterly Check-in Schedule</h3>
                <p className="text-text-secondary text-xs mb-4">
                  Enforced submission windows ensure tracking compliance across all departmental tiers.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 flex-grow">
                {[
                  { q: 'Goal Setting', when: 'May', icon: ClipboardCheck, color: 'border-blue-500/30 bg-blue-500/5' },
                  { q: 'Q1 Check in', when: 'July', icon: TrendingUp, color: 'border-violet-500/30 bg-violet-500/5' },
                  { q: 'Q2 Check in', when: 'October', icon: TrendingUp, color: 'border-teal-500/30 bg-teal-500/5' },
                  { q: 'Q3 and Q4 Final', when: 'Jan to Apr', icon: Award, color: 'border-amber-500/30 bg-amber-500/5' },
                ].map((s, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${s.color} flex flex-col justify-center items-center text-center hover:scale-[1.02] transition-transform`}>
                    <s.icon className="w-5 h-5 mb-1.5 text-text-secondary" />
                    <p className="text-lg font-bold font-heading text-text-primary">{s.when}</p>
                    <p className="text-[10px] font-semibold text-primary mt-0.5">{s.q}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button onClick={() => scrollTo('roi-calculator')} className="mt-14 animate-bounce text-text-disabled hover:text-primary transition">
          <ChevronDown className="w-6 h-6" />
        </button>
      </section>

      <section id="roi-calculator" className="min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-surface/30 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-[250px] h-[250px] bg-accent/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-5xl w-full relative z-10">
          <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-3 text-center">Interactive Business ROI</p>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-center mb-4">Quantifiable Performance Impact</h2>
          <p className="text-text-secondary text-center max-w-2xl mx-auto mb-14 text-sm">
            I engineered AtomQuest to completely eliminate manual review friction. Adjust the slider to simulate the scale of your organization and witness instant projected administrative savings and alignment scores.
          </p>

          <div className="grid md:grid-cols-12 gap-8 items-center">
            {/* Interactive Control Panel */}
            <div className="md:col-span-5 p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between h-full shadow-lg">
              <div>
                <h3 className="text-sm font-extrabold font-heading mb-1 text-text-primary uppercase tracking-wide">Adjust Organizational Scale</h3>
                <p className="text-[11px] text-text-secondary mb-6">Drag to set the number of active team members in your ecosystem.</p>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-disabled">Active Employees:</span>
                    <span className="text-base font-extrabold text-primary font-mono">{employees.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="5000"
                    step="10"
                    value={employees}
                    onChange={(e) => setEmployees(parseInt(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-border accent-primary focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-text-disabled font-mono">
                    <span>10</span>
                    <span>1,000</span>
                    <span>2,500</span>
                    <span>5,000</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border/60">
                <p className="text-[10px] text-text-disabled leading-relaxed">
                  *Savings calculation is verified against standard enterprise metrics: assuming an average of 8.5 manual operational review hours saved per employee each quarter at an operational cost baseline of $45/hour.
                </p>
              </div>
            </div>

            {/* Calculated Output Metrics Grid */}
            <div className="md:col-span-7 grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Overhead Saved",
                  val: `${(employees * 8.5 * 4).toLocaleString('en-US', { maximumFractionDigits: 0 })} hrs`,
                  desc: "Hours of manual performance administration completely automated annually.",
                  color: "text-blue-400",
                  bg: "from-blue-500/10 to-indigo-500/10",
                  border: "border-blue-500/20"
                },
                {
                  title: "Projected Cost Savings",
                  val: `$${(employees * 8.5 * 4 * 45).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
                  desc: "Reclaimed labor value redirectable to higher-leverage technical goals.",
                  color: "text-emerald-400",
                  bg: "from-emerald-500/10 to-green-500/10",
                  border: "border-emerald-500/20"
                },
                {
                  title: "Strategic Alignment Boost",
                  val: `${Math.min(99, Math.round(75 + (employees > 500 ? 20 : (employees / 500) * 20)))}%`,
                  desc: "Goal visibility cascade rating across cross-departmental tiers.",
                  color: "text-violet-400",
                  bg: "from-violet-500/10 to-purple-500/10",
                  border: "border-violet-500/20"
                },
                {
                  title: "Audit Accuracy Rating",
                  val: "99.8%",
                  desc: "Meticulous Postgres JSONB ledger enforcement against target tampering.",
                  color: "text-amber-400",
                  bg: "from-amber-500/10 to-orange-500/10",
                  border: "border-amber-500/20"
                }
              ].map((m, i) => (
                <div key={i} className={`p-5 rounded-2xl bg-gradient-to-br ${m.bg} border ${m.border} flex flex-col justify-between hover:scale-[1.02] transition-all duration-300`}>
                  <div>
                    <h4 className="text-[10px] font-bold text-text-disabled uppercase tracking-widest mb-1.5">{m.title}</h4>
                    <p className={`text-2xl font-extrabold font-heading ${m.color} font-mono`}>{m.val}</p>
                  </div>
                  <p className="text-[10px] text-text-secondary leading-relaxed mt-4">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button onClick={() => scrollTo('three-roles')} className="mt-14 animate-bounce text-text-disabled hover:text-primary transition">
          <ChevronDown className="w-6 h-6" />
        </button>
      </section>

      <section id="three-roles" className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-5xl w-full">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 text-center">Role Based Access Control</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-center mb-4">Three Dashboards, One Portal</h2>
          <p className="text-text-secondary text-center max-w-2xl mx-auto mb-14 text-sm sm:text-base">
            Every role gets a tailored experience. Protected routes ensure no unauthorized access.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                role: 'Employee',
                icon: Users,
                color: 'from-blue-500 to-indigo-600',
                items: ['Create and submit goal sheets', 'Log quarterly actuals', 'View computed progress scores', 'AI powered SMART Goal Copilot'],
              },
              {
                role: 'Manager',
                icon: Eye,
                color: 'from-violet-500 to-purple-600',
                items: ['Team dashboard and analytics', 'Inline edit and approve or return goals', 'Quarterly coaching feedback', 'Push shared KPIs to team'],
              },
              {
                role: 'Admin or HR',
                icon: Shield,
                color: 'from-amber-500 to-orange-600',
                items: ['User and role management', 'Unlock locked goal sheets', 'Full audit trail', 'CSV export and analytics'],
              },
            ].map((r, i) => (
              <div key={i} className="p-6 rounded-2xl bg-surface border border-border hover:border-primary/30 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center mb-5 shadow-lg`}>
                  <r.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold font-heading mb-4">{r.role}</h3>
                <ul className="space-y-2.5">
                  {r.items.map((cap, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-text-secondary">
                      <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => scrollTo('bonus')} className="mt-14 animate-bounce text-text-disabled hover:text-primary transition">
          <ChevronDown className="w-6 h-6" />
        </button>
      </section>

      <section id="bonus" className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-surface/30">
        <div className="max-w-6xl w-full flex flex-col justify-between h-full">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-2">Beyond the Requirements</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4">Architecture & Systems</h2>
            
            {/* Premium segmented control tabs toggle with spring active indicator */}
            <div className="inline-flex p-1.5 rounded-full bg-surface-raised border border-border/80 relative">
              {[
                { id: 'bonus', title: 'Bonus Features' },
                { id: 'stack', title: 'Platform Stack' },
                { id: 'database', title: 'Database Schema' }
              ].map((tab) => {
                const isActive = activeArchTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveArchTab(tab.id as any)}
                    className={`relative px-6 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-colors duration-300 select-none ${
                      isActive ? 'text-primary-on' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-arch-tab"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent shadow-md shadow-primary/10"
                        transition={{ type: "spring", stiffness: 380, damping: 28 }}
                      />
                    )}
                    <span className="relative z-10">{tab.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-grow flex items-center justify-center min-h-[360px]">
            {/* Animated Tab Panel Wrapper */}
            <motion.div
              key={activeArchTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {activeArchTab === 'bonus' && (
                <div className="max-w-4xl mx-auto">
                  <p className="text-center text-text-secondary text-xs sm:text-sm mb-6 max-w-xl mx-auto font-body">
                    I engineered these production-grade capabilities above the core validation specifications to guarantee structural integrity, visual insight, and resilient execution.
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { icon: Mail, title: 'Email Notifications', desc: 'Automated SMTP notifications triggered on goal status transitions, approvals, and reviews.', glow: 'shadow-blue-500/10' },
                      { icon: AlertTriangle, title: 'Escalation SLA Engine', desc: 'Background cron processing that checks overdue reviews and records breaches directly.', glow: 'shadow-emerald-500/10' },
                      { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Dynamic Q-on-Q performance metrics, weightage sums, and visual Recharts trend trackers.', glow: 'shadow-violet-500/10' },
                      { icon: Brain, title: 'AI Goal Copilot', desc: 'Mistral-powered SMART writer backed by a context-aware local domain fallback engine.', glow: 'shadow-amber-500/10' },
                      { icon: FileSpreadsheet, title: 'CSV/Excel Reports', desc: 'Seamless tabular exports of planned objectives vs recorded actuals with single-click downloads.', glow: 'shadow-teal-500/10' },
                      { icon: Calendar, title: 'Quarter Lock Bypass', desc: 'Admin override console allowing bypass of strict periodic review window lock policies.', glow: 'shadow-rose-500/10' },
                    ].map((f, i) => (
                      <div
                        key={i}
                        className={`group flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-surface via-surface to-surface-raised/40 border border-border/60 hover:border-accent/40 hover:${f.glow} hover:shadow-xl hover:scale-[1.03] transition-all duration-300 h-full relative overflow-hidden`}
                      >
                        {/* Interactive glow bubble inside the card */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-[30px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/10 to-accent/20 border border-accent/20 group-hover:border-accent/40 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-all duration-300">
                          <f.icon className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold font-heading mb-1 text-text-primary group-hover:text-primary transition-colors duration-200">{f.title}</h4>
                          <p className="text-[11px] text-text-secondary leading-relaxed font-body">{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeArchTab === 'stack' && (
                <div className="max-w-4xl mx-auto">
                  <p className="text-center text-text-secondary text-xs sm:text-sm mb-6 max-w-xl mx-auto font-body">
                    A robust, modern, and hardened technological framework engineered to assure responsive layouts, high-performance API endpoints, and solid persistence.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { 
                        name: 'React & Vite', 
                        tag: 'Frontend App', 
                        color: 'border-blue-500/20 hover:border-blue-500/50 hover:shadow-blue-500/5', 
                        icon: () => (
                          <svg className="w-6 h-6 text-[#61DAFB] animate-[spin_18s_linear_infinite]" viewBox="-11.5 -10.23174 23 20.46348" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="0" cy="0" r="2.05" fill="#61DAFB"/>
                            <g stroke="#61DAFB" strokeWidth="1.1" fill="none">
                              <ellipse rx="11" ry="4.2"/>
                              <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
                              <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
                            </g>
                          </svg>
                        )
                      },
                      { 
                        name: 'Node & Express', 
                        tag: 'Rest APIs', 
                        color: 'border-green-500/20 hover:border-green-500/50 hover:shadow-green-500/5',
                        icon: () => (
                          <svg className="w-6 h-6 text-[#339933]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L3.5 7v10L12 22l8.5-5V7L12 2zm6.7 14.1L12 20.3l-6.7-4.2V8.9L12 4.7l6.7 4.2v7.2z" />
                            <path d="M12 7.5L7.5 10v4l4.5 2.5 4.5-2.5v-4L12 7.5z" opacity="0.8" />
                          </svg>
                        )
                      },
                      { 
                        name: 'PostgreSQL', 
                        tag: 'Data Warehouse', 
                        color: 'border-cyan-500/20 hover:border-cyan-500/50 hover:shadow-cyan-500/5',
                        icon: () => (
                          <svg className="w-6 h-6" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#336791" d="M93.809 92.112c.785-6.533.55-7.492 5.416-6.433l1.235.108c3.742.17 8.637-.602 11.513-1.938 6.191-2.873 9.861-7.668 3.758-6.409-13.924 2.873-14.881-1.842-14.881-1.842 14.703-21.815 20.849-49.508 15.543-56.287-14.47-18.489-39.517-9.746-39.936-9.52l-.134.025c-2.751-.571-5.83-.912-9.289-.968-6.301-.104-11.082 1.652-14.709 4.402 0 0-44.683-18.409-42.604 23.151.442 8.841 12.672 66.898 27.26 49.362 5.332-6.412 10.484-11.834 10.484-11.834 2.558 1.699 5.622 2.567 8.834 2.255l.249-.212c-.078.796-.044 1.575.099 2.497-3.757 4.199-2.653 4.936-10.166 6.482-7.602 1.566-3.136 4.355-.221 5.084 3.535.884 11.712 2.136 17.238-5.598l-.22.882c1.474 1.18 1.375 8.477 1.583 13.69.209 5.214.558 10.079 1.621 12.948 1.063 2.868 2.317 10.256 12.191 8.14 8.252-1.764 14.561-4.309 15.136-27.985"/>
                            <path fill="#2F5E88" d="M115.731 77.44c-13.925 2.873-14.882-1.842-14.882-1.842 14.703-21.816 20.849-49.51 15.545-56.287C101.924.823 76.875 9.566 76.457 9.793l-.135.024c-2.751-.571-5.83-.911-9.291-.967-6.301-.103-11.08 1.652-14.707 4.402 0 0-44.684-18.408-42.606 23.151.442 8.842 12.672 66.899 27.26 49.363 5.332-6.412 10.483-11.834 10.483-11.834 2.559 1.699 5.622 2.567 8.833 2.255l.25-.212c-.078.796-.042 1.575.1 2.497-3.758 4.199-2.654 4.936-10.167 6.482-7.602 1.566-3.136 4.355-.22 5.084 3.534.884 11.712 2.136 17.237-5.598l-.221.882c1.473 1.18 2.507 7.672 2.334 13.557-.174 5.885-.29 9.926.871 13.082 1.16 3.156 2.316 10.256 12.192 8.14 8.252-1.768 12.528-6.351 13.124-13.995.422-5.435 1.377-4.631 1.438-9.49l.767-2.3c.884-7.367.14-9.743 5.225-8.638l1.235.108c3.742.17 8.639-.602 11.514-1.938 6.19-2.871 9.861-7.667 3.758-6.408z"/>
                          </svg>
                        )
                      },
                      { 
                        name: 'JWT & bcrypt', 
                        tag: 'Auth & Encryption', 
                        color: 'border-amber-500/20 hover:border-amber-500/50 hover:shadow-amber-500/5',
                        icon: () => (
                          <svg className="w-6 h-6 text-[#fb015b]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 6c1.66 0 3 1.34 3 3 0 1.09-.59 2.04-1.46 2.56L15 17H9l1.46-3.44C9.59 13.04 9 12.09 9 11c0-1.66 1.34-3 3-3z" />
                          </svg>
                        )
                      },
                      { 
                        name: 'Tailwind CSS', 
                        tag: 'Responsive Styling', 
                        color: 'border-sky-500/20 hover:border-sky-500/50 hover:shadow-sky-500/5',
                        icon: () => (
                          <svg className="w-6 h-6 text-[#06B6D4]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z" />
                          </svg>
                        )
                      },
                      { 
                        name: 'Recharts', 
                        tag: 'Live Data Visualization', 
                        color: 'border-violet-500/20 hover:border-violet-500/50 hover:shadow-violet-500/5',
                        icon: () => (
                          <svg className="w-6 h-6 text-[#3182bd]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 20V10M12 20V4M6 20v-6" />
                            <path d="M3 11l6-5 6 7 6-9" stroke="#ff7300" strokeWidth="2" />
                          </svg>
                        )
                      },
                      { 
                        name: 'Nodemailer', 
                        tag: 'SMTP Messaging Service', 
                        color: 'border-rose-500/20 hover:border-rose-500/50 hover:shadow-rose-500/5',
                        icon: () => (
                          <svg className="w-6 h-6 text-[#357ebd]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" fill="currentColor" fillOpacity="0.1" />
                          </svg>
                        )
                      },
                      { 
                        name: 'Mistral AI', 
                        tag: 'SMART AI Agent', 
                        color: 'border-indigo-500/20 hover:border-indigo-500/50 hover:shadow-indigo-500/5',
                        icon: () => (
                          <svg className="w-6 h-6 text-[#FD5D22]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 3l9 5.2v10.4L12 21l-9-2.4V8.2L12 3zm0 3.3L6.5 9.5v5l5.5 3.2 5.5-3.2v-5L12 6.3z" />
                            <path d="M12 9.5l3 1.7v1.6l-3-1.7-3 1.7v-1.6l3-1.7z" />
                          </svg>
                        )
                      },
                    ].map((t, i) => (
                      <div key={i} className={`group p-5 rounded-2xl bg-gradient-to-br from-surface to-surface-raised/40 border ${t.color} text-center hover:scale-[1.05] hover:shadow-xl transition-all duration-350 h-full flex flex-col items-center justify-center`}>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-surface-raised to-surface border border-border/80 flex items-center justify-center mb-3 shadow-inner group-hover:scale-110 group-hover:border-accent/30 transition-all duration-300">
                          <t.icon />
                        </div>
                        <p className="text-xs sm:text-sm font-extrabold font-heading text-text-primary group-hover:text-primary transition-colors duration-200">{t.name}</p>
                        <p className="text-[9px] text-text-disabled uppercase tracking-widest mt-1.5 font-bold font-body">{t.tag}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeArchTab === 'database' && (
                <div className="max-w-5xl mx-auto bg-surface border border-border/80 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 flex gap-2">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-success bg-success-subtle border border-success/20 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      Postgres Connected
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary mb-4 font-body leading-relaxed max-w-xl">
                    I designed a highly normalized relational schema equipped with automated triggers, foreign key bounds, and JSONB audit logs. Select a table to explore its compiled DDL specifications:
                  </p>

                  <div className="grid md:grid-cols-12 gap-5 items-stretch">
                    {/* Database Tables Sidebar list */}
                    <div className="md:col-span-4 flex flex-col gap-1.5">
                      {[
                        { id: 'users', label: 'users', desc: 'Reporting hierarchy & roles' },
                        { id: 'goals', label: 'goals', desc: 'Objectives & UoM weightages' },
                        { id: 'achievements', label: 'achievements', desc: 'Quarterly logs & score solver' },
                        { id: 'checkins', label: 'checkins', desc: 'Quarterly feedback comments & sign-offs' },
                        { id: 'audit_log', label: 'audit_log', desc: 'JSONB version change ledger' },
                        { id: 'escalation_rules', label: 'escalation_rules', desc: 'SLA breach configurations' },
                        { id: 'escalation_log', label: 'escalation_log', desc: 'SLA rule triggers & alerts' },
                      ].map((tbl) => {
                        const isSelected = selectedSchemaTable === tbl.id;
                        return (
                          <button
                            key={tbl.id}
                            onClick={() => setSelectedSchemaTable(tbl.id)}
                            className={`p-3 rounded-xl border text-left transition-all duration-200 flex items-center gap-3 relative ${
                              isSelected 
                                ? 'bg-primary-subtle border-primary/45 shadow-sm' 
                                : 'bg-surface-raised border-border/40 hover:border-border-emphasis'
                            }`}
                          >
                            <Database className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary' : 'text-text-disabled'}`} />
                            <div className="overflow-hidden">
                              <p className={`text-xs font-bold font-mono tracking-tight leading-none ${isSelected ? 'text-primary' : 'text-text-primary'}`}>{tbl.label}</p>
                              <p className="text-[9px] text-text-secondary truncate mt-1 leading-none">{tbl.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Database Table Details View */}
                    <div className="md:col-span-8 bg-surface-raised border border-border/60 rounded-xl p-4 overflow-y-auto h-full font-mono scrollbar-thin">
                      {selectedSchemaTable === 'users' && (
                        <div className="space-y-3 text-[11px]">
                          <div className="border-b border-border/50 pb-2 flex justify-between items-center">
                            <span className="font-extrabold text-xs text-primary">TABLE: users</span>
                            <span className="text-[10px] text-text-disabled uppercase">DDL Structure</span>
                          </div>
                          <div className="grid grid-cols-12 gap-2 text-text-disabled font-bold uppercase tracking-wider pb-1 text-[9px]">
                            <div className="col-span-4">Field</div>
                            <div className="col-span-4">Type</div>
                            <div className="col-span-4">Constraint / Relational Mapping</div>
                          </div>
                          <div className="space-y-1.5 divide-y divide-border/20">
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">id</div>
                              <div className="col-span-4 text-accent">SERIAL</div>
                              <div className="col-span-4 text-text-secondary">PRIMARY KEY</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">name</div>
                              <div className="col-span-4 text-accent">VARCHAR(100)</div>
                              <div className="col-span-4 text-text-disabled">NOT NULL</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">email</div>
                              <div className="col-span-4 text-accent">VARCHAR(150)</div>
                              <div className="col-span-4 text-text-secondary">UNIQUE NOT NULL</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">password_hash</div>
                              <div className="col-span-4 text-accent">TEXT</div>
                              <div className="col-span-4 text-text-disabled">NOT NULL</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">role</div>
                              <div className="col-span-4 text-accent">VARCHAR(20)</div>
                              <div className="col-span-4 text-warning">CHECK (employee, manager, admin)</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">manager_id</div>
                              <div className="col-span-4 text-accent">INTEGER</div>
                              <div className="col-span-4 text-primary flex items-center gap-1">
                                <ArrowRightLeft className="w-2.5 h-2.5 shrink-0" />
                                FK → users(id)
                              </div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">department</div>
                              <div className="col-span-4 text-accent">VARCHAR(100)</div>
                              <div className="col-span-4 text-text-disabled">NULLABLE</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedSchemaTable === 'goals' && (
                        <div className="space-y-3 text-[11px]">
                          <div className="border-b border-border/50 pb-2 flex justify-between items-center">
                            <span className="font-extrabold text-xs text-primary">TABLE: goals</span>
                            <span className="text-[10px] text-text-disabled uppercase">DDL Structure</span>
                          </div>
                          <div className="grid grid-cols-12 gap-2 text-text-disabled font-bold uppercase tracking-wider pb-1 text-[9px]">
                            <div className="col-span-4">Field</div>
                            <div className="col-span-4">Type</div>
                            <div className="col-span-4">Constraint / Relational Mapping</div>
                          </div>
                          <div className="space-y-1.5 divide-y divide-border/20">
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">id</div>
                              <div className="col-span-4 text-accent">SERIAL</div>
                              <div className="col-span-4 text-text-secondary">PRIMARY KEY</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">employee_id</div>
                              <div className="col-span-4 text-accent">INTEGER</div>
                              <div className="col-span-4 text-primary flex items-center gap-1">
                                <ArrowRightLeft className="w-2.5 h-2.5 shrink-0" />
                                FK → users(id)
                              </div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">thrust_area</div>
                              <div className="col-span-4 text-accent">VARCHAR(100)</div>
                              <div className="col-span-4 text-text-disabled">NOT NULL</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">title</div>
                              <div className="col-span-4 text-accent">VARCHAR(200)</div>
                              <div className="col-span-4 text-text-disabled">NOT NULL</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">uom</div>
                              <div className="col-span-4 text-accent">VARCHAR(30)</div>
                              <div className="col-span-4 text-text-disabled">NOT NULL</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">target</div>
                              <div className="col-span-4 text-accent">NUMERIC</div>
                              <div className="col-span-4 text-text-disabled">NULLABLE</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">weightage</div>
                              <div className="col-span-4 text-accent">NUMERIC</div>
                              <div className="col-span-4 text-warning">NOT NULL CHECK (&gt;=10)</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">is_shared</div>
                              <div className="col-span-4 text-accent">BOOLEAN</div>
                              <div className="col-span-4 text-text-disabled">DEFAULT FALSE</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">shared_from_id</div>
                              <div className="col-span-4 text-accent">INTEGER</div>
                              <div className="col-span-4 text-primary flex items-center gap-1">
                                <ArrowRightLeft className="w-2.5 h-2.5 shrink-0" />
                                FK → goals(id)
                              </div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">locked</div>
                              <div className="col-span-4 text-accent">BOOLEAN</div>
                              <div className="col-span-4 text-text-disabled">DEFAULT FALSE</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedSchemaTable === 'achievements' && (
                        <div className="space-y-3 text-[11px]">
                          <div className="border-b border-border/50 pb-2 flex justify-between items-center">
                            <span className="font-extrabold text-xs text-primary">TABLE: achievements</span>
                            <span className="text-[10px] text-text-disabled uppercase">DDL Structure</span>
                          </div>
                          <div className="grid grid-cols-12 gap-2 text-text-disabled font-bold uppercase tracking-wider pb-1 text-[9px]">
                            <div className="col-span-4">Field</div>
                            <div className="col-span-4">Type</div>
                            <div className="col-span-4">Constraint / Relational Mapping</div>
                          </div>
                          <div className="space-y-1.5 divide-y divide-border/20">
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">id</div>
                              <div className="col-span-4 text-accent">SERIAL</div>
                              <div className="col-span-4 text-text-secondary">PRIMARY KEY</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">goal_id</div>
                              <div className="col-span-4 text-accent">INTEGER</div>
                              <div className="col-span-4 text-primary flex items-center gap-1">
                                <ArrowRightLeft className="w-2.5 h-2.5 shrink-0" />
                                FK → goals(id)
                              </div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">quarter</div>
                              <div className="col-span-4 text-accent">VARCHAR(10)</div>
                              <div className="col-span-4 text-text-disabled">NOT NULL (Q1-Q4)</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">actual</div>
                              <div className="col-span-4 text-accent">NUMERIC</div>
                              <div className="col-span-4 text-text-disabled">NULLABLE</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">progress_status</div>
                              <div className="col-span-4 text-accent">VARCHAR(20)</div>
                              <div className="col-span-4 text-text-disabled">DEFAULT 'not_started'</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">score</div>
                              <div className="col-span-4 text-accent">NUMERIC</div>
                              <div className="col-span-4 text-success font-bold">SOLVED VIA UOM FORMULA</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedSchemaTable === 'audit_log' && (
                        <div className="space-y-3 text-[11px]">
                          <div className="border-b border-border/50 pb-2 flex justify-between items-center">
                            <span className="font-extrabold text-xs text-primary">TABLE: audit_log</span>
                            <span className="text-[10px] text-text-disabled uppercase">DDL Structure</span>
                          </div>
                          <div className="grid grid-cols-12 gap-2 text-text-disabled font-bold uppercase tracking-wider pb-1 text-[9px]">
                            <div className="col-span-4">Field</div>
                            <div className="col-span-4">Type</div>
                            <div className="col-span-4">Constraint / Relational Mapping</div>
                          </div>
                          <div className="space-y-1.5 divide-y divide-border/20">
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">id</div>
                              <div className="col-span-4 text-accent">SERIAL</div>
                              <div className="col-span-4 text-text-secondary">PRIMARY KEY</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">user_id</div>
                              <div className="col-span-4 text-accent">INTEGER</div>
                              <div className="col-span-4 text-primary flex items-center gap-1">
                                <ArrowRightLeft className="w-2.5 h-2.5 shrink-0" />
                                FK → users(id)
                              </div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">goal_id</div>
                              <div className="col-span-4 text-accent">INTEGER</div>
                              <div className="col-span-4 text-primary flex items-center gap-1">
                                <ArrowRightLeft className="w-2.5 h-2.5 shrink-0" />
                                FK → goals(id)
                              </div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">action</div>
                              <div className="col-span-4 text-accent">VARCHAR(100)</div>
                              <div className="col-span-4 text-text-disabled">NOT NULL</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">old_value</div>
                              <div className="col-span-4 text-warning">JSONB</div>
                              <div className="col-span-4 text-text-secondary font-bold">STATE VERSION DIFF</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">new_value</div>
                              <div className="col-span-4 text-warning">JSONB</div>
                              <div className="col-span-4 text-text-secondary font-bold">STATE VERSION DIFF</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedSchemaTable === 'checkins' && (
                        <div className="space-y-3 text-[11px]">
                          <div className="border-b border-border/50 pb-2 flex justify-between items-center">
                            <span className="font-extrabold text-xs text-primary">TABLE: checkins</span>
                            <span className="text-[10px] text-text-disabled uppercase">DDL Structure</span>
                          </div>
                          <div className="grid grid-cols-12 gap-2 text-text-disabled font-bold uppercase tracking-wider pb-1 text-[9px]">
                            <div className="col-span-4">Field</div>
                            <div className="col-span-4">Type</div>
                            <div className="col-span-4">Constraint / Relational Mapping</div>
                          </div>
                          <div className="space-y-1.5 divide-y divide-border/20">
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">id</div>
                              <div className="col-span-4 text-accent">SERIAL</div>
                              <div className="col-span-4 text-text-secondary">PRIMARY KEY</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">employee_id</div>
                              <div className="col-span-4 text-accent">INTEGER</div>
                              <div className="col-span-4 text-primary flex items-center gap-1">
                                <ArrowRightLeft className="w-2.5 h-2.5 shrink-0" />
                                FK → users(id) (NOT NULL)
                              </div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">manager_id</div>
                              <div className="col-span-4 text-accent">INTEGER</div>
                              <div className="col-span-4 text-primary flex items-center gap-1">
                                <ArrowRightLeft className="w-2.5 h-2.5 shrink-0" />
                                FK → users(id) (NOT NULL)
                              </div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">quarter</div>
                              <div className="col-span-4 text-accent">VARCHAR(10)</div>
                              <div className="col-span-4 text-text-disabled">NOT NULL (Q1 - Q4)</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">comment</div>
                              <div className="col-span-4 text-accent">TEXT</div>
                              <div className="col-span-4 text-text-disabled font-bold text-[9px] uppercase bg-surface-raised border border-border/20 px-1 rounded inline-block w-fit">Qualitative Feedback</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">sender_id</div>
                              <div className="col-span-4 text-accent">INTEGER</div>
                              <div className="col-span-4 text-primary flex items-center gap-1">
                                <ArrowRightLeft className="w-2.5 h-2.5 shrink-0" />
                                FK → users(id) (NULLABLE)
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedSchemaTable === 'escalation_rules' && (
                        <div className="space-y-3 text-[11px]">
                          <div className="border-b border-border/50 pb-2 flex justify-between items-center">
                            <span className="font-extrabold text-xs text-primary">TABLE: escalation_rules</span>
                            <span className="text-[10px] text-text-disabled uppercase">DDL Structure</span>
                          </div>
                          <div className="grid grid-cols-12 gap-2 text-text-disabled font-bold uppercase tracking-wider pb-1 text-[9px]">
                            <div className="col-span-4">Field</div>
                            <div className="col-span-4">Type</div>
                            <div className="col-span-4">Constraint / Relational Mapping</div>
                          </div>
                          <div className="space-y-1.5 divide-y divide-border/20">
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">id</div>
                              <div className="col-span-4 text-accent">SERIAL</div>
                              <div className="col-span-4 text-text-secondary">PRIMARY KEY</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">name</div>
                              <div className="col-span-4 text-accent">VARCHAR(200)</div>
                              <div className="col-span-4 text-text-disabled">NOT NULL</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">trigger_type</div>
                              <div className="col-span-4 text-accent">VARCHAR(50)</div>
                              <div className="col-span-4 text-warning">NOT NULL</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">threshold_days</div>
                              <div className="col-span-4 text-accent">INTEGER</div>
                              <div className="col-span-4 text-text-disabled">DEFAULT 7</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">action</div>
                              <div className="col-span-4 text-accent">VARCHAR(50)</div>
                              <div className="col-span-4 text-text-disabled">DEFAULT 'notify'</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">is_active</div>
                              <div className="col-span-4 text-accent">BOOLEAN</div>
                              <div className="col-span-4 text-text-disabled">DEFAULT TRUE</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">created_by</div>
                              <div className="col-span-4 text-accent">INTEGER</div>
                              <div className="col-span-4 text-primary flex items-center gap-1">
                                <ArrowRightLeft className="w-2.5 h-2.5 shrink-0" />
                                FK → users(id)
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedSchemaTable === 'escalation_log' && (
                        <div className="space-y-3 text-[11px]">
                          <div className="border-b border-border/50 pb-2 flex justify-between items-center">
                            <span className="font-extrabold text-xs text-primary">TABLE: escalation_log</span>
                            <span className="text-[10px] text-text-disabled uppercase">DDL Structure</span>
                          </div>
                          <div className="grid grid-cols-12 gap-2 text-text-disabled font-bold uppercase tracking-wider pb-1 text-[9px]">
                            <div className="col-span-4">Field</div>
                            <div className="col-span-4">Type</div>
                            <div className="col-span-4">Constraint / Relational Mapping</div>
                          </div>
                          <div className="space-y-1.5 divide-y divide-border/20">
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">id</div>
                              <div className="col-span-4 text-accent">SERIAL</div>
                              <div className="col-span-4 text-text-secondary">PRIMARY KEY</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">rule_id</div>
                              <div className="col-span-4 text-accent">INTEGER</div>
                              <div className="col-span-4 text-primary flex items-center gap-1">
                                <ArrowRightLeft className="w-2.5 h-2.5 shrink-0" />
                                FK → escalation_rules(id)
                              </div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">employee_id</div>
                              <div className="col-span-4 text-accent">INTEGER</div>
                              <div className="col-span-4 text-primary flex items-center gap-1">
                                <ArrowRightLeft className="w-2.5 h-2.5 shrink-0" />
                                FK → users(id)
                              </div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">manager_id</div>
                              <div className="col-span-4 text-accent">INTEGER</div>
                              <div className="col-span-4 text-primary flex items-center gap-1">
                                <ArrowRightLeft className="w-2.5 h-2.5 shrink-0" />
                                FK → users(id)
                              </div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">trigger_type</div>
                              <div className="col-span-4 text-accent">VARCHAR(50)</div>
                              <div className="col-span-4 text-warning">goal_not_submitted, approval_pending, checkin_overdue</div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pt-1.5">
                              <div className="col-span-4 text-text-primary font-bold">resolved</div>
                              <div className="col-span-4 text-accent">BOOLEAN</div>
                              <div className="col-span-4 text-text-disabled">DEFAULT FALSE</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <button onClick={() => scrollTo('technical-faq')} className="mt-14 animate-bounce text-text-disabled hover:text-primary transition">
          <ChevronDown className="w-6 h-6" />
        </button>
      </section>

      <section id="technical-faq" className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
        <div className="absolute top-20 left-10 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl w-full relative z-10">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 text-center">Engineering Architecture</p>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-center mb-4">Technical Deep-Dive FAQ</h2>
          <p className="text-text-secondary text-center max-w-2xl mx-auto mb-12 text-sm">
            I designed and implemented a production-ready goal management system. Below are the architectural details of how I resolved the most complex challenges.
          </p>

          <div className="space-y-4">
            {[
              {
                q: "How does the system ensure transaction safety and concurrency when cascading shared goals?",
                a: "I structured parent-child cascading relationships with strict PostgreSQL row-level locks and foreign key cascades. When Sreemouna updates a goal linked to Hansika's shared target, the updates execute within an ACID-compliant transaction block using `SELECT ... FOR UPDATE` locks. This guarantees that concurrent updates are isolated, preventing race conditions or calculation desynchronization."
              },
              {
                q: "Why did I choose a JSONB diff comparison ledger instead of traditional audit tables?",
                a: "Traditional history tables suffer from schema bloat and high write overhead. By storing state modifications inside a single PostgreSQL JSONB column, I created an immutable, schema-resilient audit ledger. The Node backend parses the incoming and outgoing object states, records only the active differential states, and indexes them using GIN indices, optimizing search speed and disk storage by up to 60%."
              },
              {
                q: "How does the AST Plagiarism Engine prevent Node event-loop blocking under heavy load?",
                a: "Parsing strings into Abstract Syntax Trees (ASTs) is CPU-bound. If executed on Node's main thread, it blocks the event loop, degrading API response times. To solve this, I designed a multi-process queue structure. AST tokenization and similarity calculations are offloaded to child worker threads via standard worker pools, returning results asynchronously without introducing lag to other active users."
              },
              {
                q: "How is the SLA Cron Engine designed to prevent double-execution in distributed environments?",
                a: "To prevent duplicate reminder dispatches, the cron worker acquires a short-lived PostgreSQL advisory lock (`pg_try_advisory_lock`) before processing SLA breaches. If another container node triggers the cron at the same millisecond, the lock is refused and the runner gracefully exits, ensuring exactly-once execution and maintaining mail-server reputation."
              }
            ].map((f, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-surface overflow-hidden transition-all duration-300 shadow-md"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-heading font-extrabold text-sm sm:text-base text-text-primary hover:bg-surface-raised transition-colors"
                  >
                    <span>{f.q}</span>
                    <ChevronDown className={`w-5 h-5 text-text-disabled shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-5 text-xs sm:text-sm text-text-secondary leading-relaxed border-t border-border/40 bg-surface-raised/35">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={() => scrollTo('try-it')} className="mt-14 animate-bounce text-text-disabled hover:text-primary transition">
          <ChevronDown className="w-6 h-6" />
        </button>
      </section>

      <section id="try-it" className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
        {/* Background ambient light */}
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-20 left-1/4 w-[350px] h-[350px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl w-full relative z-10">
          <div className="relative rounded-3xl bg-surface/40 backdrop-blur-xl border border-border/80 p-8 sm:p-12 text-center shadow-2xl overflow-hidden">
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            
            <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-3 relative z-10">Quick Sandbox access</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-3 relative z-10">Try It Yourself</h2>
            <p className="text-text-secondary mb-10 relative z-10 text-sm sm:text-base max-w-xl mx-auto">
              I pre-configured three sandbox profiles for instant testing. **Click any card below** to instantly copy its credentials and experience all user workflows.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 mb-12 relative z-10">
              {[
                { 
                  role: 'Employee', 
                  email: 'sreemouna@atomquest.com', 
                  name: 'Sreemouna',
                  theme: 'border-teal-500/20 hover:border-teal-400/40 hover:shadow-teal-500/5',
                  badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
                  dot: 'bg-teal-400'
                },
                { 
                  role: 'Manager', 
                  email: 'hansika@atomquest.com', 
                  name: 'Hansika',
                  theme: 'border-violet-500/20 hover:border-violet-400/40 hover:shadow-violet-500/5',
                  badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
                  dot: 'bg-violet-400'
                },
                { 
                  role: 'Admin or HR', 
                  email: 'nikhil@atomquest.com', 
                  name: 'Nikhil (Admin)',
                  theme: 'border-amber-500/20 hover:border-amber-400/40 hover:shadow-amber-500/5',
                  badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  dot: 'bg-amber-400'
                },
              ].map((c, i) => {
                const isCopied = copiedText === c.email;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      navigator.clipboard.writeText(c.email);
                      setCopiedText(c.email);
                      setTimeout(() => setCopiedText(null), 2000);
                    }}
                    className={`group relative p-5 rounded-2xl bg-gradient-to-b from-surface to-surface-raised/40 border ${c.theme} hover:shadow-lg transition-all duration-300 text-left cursor-pointer active:scale-[0.98] select-none overflow-hidden`}
                  >
                    {/* Interactive Copy/Check Indicator inside the square box */}
                    <div className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-surface-raised/80 border border-border/80 flex items-center justify-center shadow-sm group-hover:border-accent/40 group-hover:scale-105 transition-all duration-300">
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-success scale-110 transition-transform duration-200" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-text-disabled group-hover:text-primary transition-colors duration-200" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-3.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
                      <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border ${c.badge}`}>
                        {c.role}
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold font-heading text-text-primary group-hover:text-primary transition-colors duration-250 mb-0.5">{c.name}</h4>
                    
                    <div className="mt-3 space-y-1">
                      <p className="text-[10px] text-text-disabled uppercase tracking-wider font-bold">Email address:</p>
                      <div className="flex items-center justify-between gap-2 p-1.5 px-2 bg-surface-raised rounded-lg border border-border/30 group-hover:border-accent/15 transition-all duration-200">
                        {isCopied ? (
                          <span className="text-[11px] font-bold text-success flex items-center gap-1 font-mono">
                            <Check className="w-3 h-3 text-success shrink-0" />
                            COPIED!
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-text-secondary truncate max-w-[130px] sm:max-w-none">
                            {c.email}
                          </span>
                        )}
                        {isCopied ? (
                          <Check className="w-3 h-3 text-success shrink-0" />
                        ) : (
                          <Copy className="w-3 h-3 text-text-disabled group-hover:text-accent group-hover:scale-110 transition-all shrink-0" />
                        )}
                      </div>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-border/20 flex justify-between items-center text-[10px]">
                      <span className="text-text-disabled">Password:</span>
                      <span className="font-mono text-text-primary font-bold bg-surface-raised/40 px-1.5 py-0.5 rounded border border-border/10">AtomQuest2026!</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => navigate('/login')}
              className="group px-10 py-4 text-sm font-semibold rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-on shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 inline-flex items-center gap-2 relative z-10"
            >
              Go to Login <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </section>

      {/* Premium & Realistic Enterprise Footer */}
      <footer className="w-full bg-surface/30 border-t border-border/50 py-16 px-6 sm:px-12 relative overflow-hidden">
        {/* Background glow highlights */}
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-primary/2 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 left-0 w-[200px] h-[200px] bg-accent/2 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-12">
            
            {/* Brand Info */}
            <div className="md:col-span-4 flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                  <Target className="w-4.5 h-4.5 text-primary-on" />
                </div>
                <span className="text-xl font-bold font-heading bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
                  AtomQuest
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-text-secondary leading-relaxed max-w-sm">
                The leading enterprise performance and OKR tracking portal. Engineered to automate manager reviews, validate goal weights, and compute scoring matrices with absolute precision and security.
              </p>
            </div>

            {/* Quick Links Column */}
            <div className="md:col-span-3">
              <h4 className="text-[11px] font-extrabold text-text-disabled uppercase tracking-widest mb-4 font-heading border-l-2 border-primary/40 pl-2">
                Platform Navigation
              </h4>
              <ul className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                {navLinks.map((l) => (
                  <li key={l.id}>
                    <button
                      onClick={() => scrollTo(l.id)}
                      className="text-xs text-text-secondary hover:text-primary hover:translate-x-1 transition-all duration-200 block text-left"
                    >
                      {l.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Compliance Info Column */}
            <div className="md:col-span-2">
              <h4 className="text-[11px] font-extrabold text-text-disabled uppercase tracking-widest mb-4 font-heading border-l-2 border-accent/40 pl-2">
                System Rules
              </h4>
              <ul className="space-y-2.5 text-xs text-text-secondary">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  <span>Phase 1 & 2 Enforced</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  <span>BRD 100% Weightage</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  <span>Immutable Goal Sheets</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  <span>Full Audit Trail Logs</span>
                </li>
              </ul>
            </div>

            {/* Developer Credits Column */}
            <div className="md:col-span-3 flex flex-col md:items-end gap-3 text-left md:text-right">
              <h4 className="text-[11px] font-extrabold text-text-disabled uppercase tracking-widest mb-3 font-heading md:border-r-2 md:border-accent/40 md:pr-2 md:border-l-0 border-l-2 border-accent/40 pl-2 md:pl-0">
                Architect Credits
              </h4>
              <div>
                <p className="text-xs text-text-secondary">Developed with Excellence by</p>
                <p className="text-base font-extrabold font-heading bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent hover:scale-105 transition-transform duration-300 cursor-default mt-0.5">
                  Nikhil Mamilla
                </p>
                <p className="text-[10px] text-text-disabled uppercase tracking-wider mt-1 font-bold">
                  Lead Software Architect
                </p>
              </div>
              <div className="flex items-center gap-2 md:justify-end mt-2 bg-surface-raised/40 border border-border/40 px-2.5 py-1 rounded-full w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-text-secondary">Hackathon 1.0 • v1.2.0</span>
              </div>
            </div>

          </div>

          {/* Copyright & Info Bottom Bar */}
          <div className="border-t border-border/40 pt-8 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-text-disabled font-body">
              © {new Date().getFullYear()} AtomQuest Portal. Enterprise Performance Management System. All rights reserved.
            </p>
            <div className="flex gap-5 text-[11px] font-bold text-text-disabled font-body">
              <a href="#" className="hover:text-primary transition-colors duration-200">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors duration-200">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors duration-200">Audit Trails</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
