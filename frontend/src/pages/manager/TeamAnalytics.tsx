import { useEffect, useState } from 'react'
import { 
  CheckCircle2, 
  RotateCcw, 
  Users, 
  Award, 
  TrendingUp, 
  BarChart3,
  PieChart as PieIcon,
  ChevronDown,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  Target as TargetIcon
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts'
import toast from 'react-hot-toast'
import { Badge, Button } from '../../components/common'
import { checkinsService } from '../../services/checkins'
import type { Goal } from '../../services/goals'

interface EmployeeGroup {
  employeeId: number
  employeeName: string
  employeeEmail: string
  department: string
  status: 'draft' | 'submitted' | 'approved' | 'returned' | 'pending'
  goals: Goal[]
}

export default function TeamAnalytics() {
  const [teamGoals, setTeamGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTeamGoals = () => {
    setLoading(true)
    checkinsService.listTeamGoals()
      .then(setTeamGoals)
      .catch(() => toast.error('Failed to load team objectives'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTeamGoals()
  }, [])

  // Group goals by employee
  const employees: EmployeeGroup[] = []
  teamGoals.forEach(goal => {
    let group = employees.find(e => e.employeeId === goal.employee_id)
    if (!group) {
      group = {
        employeeId: goal.employee_id,
        employeeName: goal.employee_name || 'Team Member',
        employeeEmail: (goal as any).employee_email || '',
        department: (goal as any).department || 'Technology',
        status: goal.status as any,
        goals: []
      }
      employees.push(group)
    }
    if (goal.id) {
      group.goals.push(goal)
    }
  })

  // --- Dynamic Team Analytics Calculations ---
  const totalEmployeesCount = employees.length
  const approvedCount = employees.filter(e => e.goals.length > 0 && e.goals.every(g => g.status === 'approved')).length
  const pendingCount = employees.filter(e => e.goals.some(g => g.status === 'pending')).length
  const returnedCount = employees.filter(e => e.goals.some(g => g.status === 'returned')).length
  const draftingCount = Math.max(0, totalEmployeesCount - approvedCount - pendingCount - returnedCount)

  const pieData = [
    { name: 'Approved & Locked', value: approvedCount, fill: '#30d68a' },
    { name: 'Awaiting Review', value: pendingCount, fill: '#f5a524' },
    { name: 'Returned / Revision', value: returnedCount, fill: '#f26b55' },
    { name: 'Drafting / Not Started', value: draftingCount, fill: '#94a3b8' }
  ].filter(d => d.value > 0)

  const thrustSums: Record<string, number> = {
    FINANCIAL: 0,
    CUSTOMER: 0,
    OPERATIONAL: 0,
    LEARNING: 0
  }
  
  let totalGoalsCount = 0
  employees.forEach(e => {
    totalGoalsCount += e.goals.length
    e.goals.forEach(g => {
      const area = (g.thrust_area || '').toUpperCase()
      if (area.includes('FINANCIAL')) thrustSums.FINANCIAL += Number(g.weightage)
      else if (area.includes('CUSTOMER')) thrustSums.CUSTOMER += Number(g.weightage)
      else if (area.includes('OPERATIONAL')) thrustSums.OPERATIONAL += Number(g.weightage)
      else if (area.includes('LEARNING')) thrustSums.LEARNING += Number(g.weightage)
    })
  })

  const avgGoalsCount = totalEmployeesCount > 0 ? (totalGoalsCount / totalEmployeesCount).toFixed(1) : '0'

  // Normalize/Scale to average weightage per area across team
  const barData = [
    { name: 'Financial', Weightage: totalEmployeesCount > 0 ? Math.round(thrustSums.FINANCIAL / totalEmployeesCount) : 0, fill: 'var(--color-primary)' },
    { name: 'Customer', Weightage: totalEmployeesCount > 0 ? Math.round(thrustSums.CUSTOMER / totalEmployeesCount) : 0, fill: 'var(--color-accent)' },
    { name: 'Operational', Weightage: totalEmployeesCount > 0 ? Math.round(thrustSums.OPERATIONAL / totalEmployeesCount) : 0, fill: '#f5a524' },
    { name: 'Learning & Growth', Weightage: totalEmployeesCount > 0 ? Math.round(thrustSums.LEARNING / totalEmployeesCount) : 0, fill: '#30d68a' }
  ]

  // Dynamic Horizontal Team Loading chart (Direct Report vs Goals Count)
  const employeeGoalsData = employees.map(e => ({
    name: e.employeeName.split(' ')[0], // First name only
    Goals: e.goals.length,
    Weightage: e.goals.reduce((sum, g) => sum + Number(g.weightage), 0)
  })).sort((a, b) => b.Goals - a.Goals)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-body">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <p className="text-text-secondary text-sm mt-4 animate-pulse">Loading team analytics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-body pb-12 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border/80 shadow-lg animate-fade-in">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-text-primary tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Team Analytics & Insights
          </h1>
          <p className="text-text-secondary text-sm mt-1 leading-relaxed">
            Real-time status overview, strategic thrust alignment, and load distribution across direct reports.
          </p>
        </div>
        <Button 
          variant="secondary" 
          size="sm"
          onClick={fetchTeamGoals}
          icon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Refresh Data
        </Button>
      </div>

      {employees.length === 0 ? (
        <div className="bg-surface p-12 rounded-2xl border border-border/80 text-center space-y-4 shadow-sm animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center mx-auto text-text-disabled">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-text-primary font-bold">No direct reports found</p>
            <p className="text-text-secondary text-xs">There are no direct reports assigned to your management profile.</p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Statistics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            {/* Direct Reports Card */}
            <div className="bg-surface border border-border/80 rounded-2xl p-5 flex items-center gap-4 hover:border-primary/30 transition-all duration-200 shadow-sm">
              <div className="p-3.5 bg-primary-subtle text-primary border border-primary/10 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Direct Reports</span>
                <span className="text-2xl font-extrabold text-text-primary mt-0.5 block font-numeric">{totalEmployeesCount}</span>
              </div>
            </div>

            {/* Approved Sheets Card */}
            <div className="bg-surface border border-border/80 rounded-2xl p-5 flex items-center gap-4 hover:border-emerald-500/30 transition-all duration-200 shadow-sm">
              <div className="p-3.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Approved & Locked</span>
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block font-numeric">
                  {approvedCount} <span className="text-xs font-semibold text-text-disabled">/ {totalEmployeesCount}</span>
                </span>
              </div>
            </div>

            {/* Awaiting Review Card */}
            <div className="bg-surface border border-border/80 rounded-2xl p-5 flex items-center gap-4 hover:border-amber-500/30 transition-all duration-200 shadow-sm">
              <div className="p-3.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Awaiting Review</span>
                <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 block font-numeric">
                  {pendingCount} <span className="text-xs font-semibold text-text-disabled">/ {totalEmployeesCount}</span>
                </span>
              </div>
            </div>

            {/* Avg Objectives Card */}
            <div className="bg-surface border border-border/80 rounded-2xl p-5 flex items-center gap-4 hover:border-indigo-500/30 transition-all duration-200 shadow-sm">
              <div className="p-3.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Avg Goals / Member</span>
                <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 block font-numeric">{avgGoalsCount}</span>
              </div>
            </div>
          </div>

          {/* Visualization Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0 animate-fade-in">
            {/* Donut Chart: Goal Cycle States */}
            <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-sm flex flex-col justify-between min-w-0">
              <div className="mb-4">
                <h4 className="font-heading font-extrabold text-text-primary text-base">Goal Sheet Cycle Status</h4>
                <p className="text-xs text-text-secondary mt-0.5">Split of direct reports' overall review progress</p>
              </div>
              <div className="h-64 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '16px',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-lg)',
                        fontFamily: 'var(--font-body)',
                        fontSize: '12px',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconSize={8} 
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {pieData.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-text-disabled">
                    No team goals logged yet
                  </div>
                )}
              </div>
            </div>

            {/* Bar Chart: Thrust Area Breakdown */}
            <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-sm flex flex-col justify-between min-w-0">
              <div className="mb-4">
                <h4 className="font-heading font-extrabold text-text-primary text-base">Average Alignment Focus Area</h4>
                <p className="text-xs text-text-secondary mt-0.5">Average focus allocated to corporate strategy pillars across reporting team members</p>
              </div>
              <div className="h-64 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="var(--color-text-secondary)" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="var(--color-text-secondary)" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      unit="%"
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '16px',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-lg)',
                        fontFamily: 'var(--font-body)',
                        fontSize: '12px',
                        color: 'var(--color-text-primary)'
                      }}
                      cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
                    />
                    <Bar 
                      dataKey="Weightage" 
                      radius={[8, 8, 0, 0]}
                      barSize={36}
                    >
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Full Width Area/Bar Chart: Team Loading Metrics */}
            <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-sm min-w-0 lg:col-span-2">
              <div className="mb-4">
                <h4 className="font-heading font-extrabold text-text-primary text-base">Team Goal Initialization Load</h4>
                <p className="text-xs text-text-secondary mt-0.5">Quantity of objectives and accumulated weightages across direct reports</p>
              </div>
              <div className="h-72 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={employeeGoalsData} margin={{ top: 20, right: 15, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorGoals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="var(--color-text-secondary)" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="var(--color-text-secondary)" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '16px',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-lg)',
                        fontFamily: 'var(--font-body)',
                        fontSize: '12px',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconSize={10} 
                      iconType="roundRect"
                      wrapperStyle={{ fontSize: '11px', fontFamily: 'var(--font-body)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Goals" 
                      stroke="var(--color-primary)" 
                      fillOpacity={1} 
                      fill="url(#colorGoals)" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Weightage" 
                      stroke="var(--color-accent)" 
                      fillOpacity={1} 
                      fill="url(#colorWeight)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
