const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const db = require('../db')
const auth = require('../middleware/auth')
const { Parser } = require('json2csv')

// Helper middleware to verify admin privileges
function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next()
  }
  return res.status(403).json({ 
    error: 'Forbidden', 
    message: 'Forbidden: Admin access required' 
  })
}

// Guard all sub-routes with authentication and admin verification
router.use(auth)
router.use(isAdmin)

/**
 * GET /api/admin/users
 * Returns a list of all system users joined with their manager names
 */
router.get('/users', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.department, 
        u.manager_id, 
        u.created_at,
        m.name as manager_name
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      ORDER BY u.id ASC
    `)
    res.json(rows)
  } catch (err) {
    console.error('List users error:', err)
    res.status(500).json({ error: 'Server error', message: 'Server error' })
  }
})

/**
 * POST /api/admin/users
 * Creates a new user profile with password encryption
 */
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role, manager_id, department } = req.body
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        error: 'Validation error', 
        message: 'Name, email, password, and role are required' 
      })
    }

    const normalizedEmail = email.toLowerCase().trim()
    
    // Validate uniqueness
    const checkUser = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail])
    if (checkUser.rowCount > 0) {
      return res.status(400).json({ 
        error: 'Validation error', 
        message: 'User with this email already exists' 
      })
    }

    // Validate role constraint
    if (!['employee', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ 
        error: 'Validation error', 
        message: 'Invalid role. Must be employee, manager, or admin' 
      })
    }

    // Encrypt password
    const password_hash = await bcrypt.hash(password, 10)

    // Insert user row
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role, manager_id, department) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, email, role, manager_id, department`,
      [name.trim(), normalizedEmail, password_hash, role, manager_id || null, department || null]
    )

    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Create user error:', err)
    res.status(500).json({ error: 'Server error', message: 'Server error' })
  }
})

/**
 * GET /api/admin/goals
 * Lists all goals across the organization with employee details, filterable by department and status
 */
router.get('/goals', async (req, res) => {
  try {
    const { department, status } = req.query
    let query = `
      SELECT 
        g.id, g.employee_id, g.thrust_area, g.title, g.description,
        g.uom, g.target, g.deadline, g.weightage, g.status, g.locked, g.cycle_year,
        u.name as employee_name, u.email as employee_email, u.department,
        m.name as manager_name
      FROM goals g
      JOIN users u ON g.employee_id = u.id
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE 1=1
    `
    const params = []
    if (department) {
      params.push(department)
      query += ` AND u.department = $${params.length}`
    }
    if (status) {
      params.push(status)
      query += ` AND g.status = $${params.length}`
    }
    query += ' ORDER BY u.name ASC, g.id ASC'

    const { rows } = await db.query(query, params)
    res.json(rows)
  } catch (err) {
    console.error('List goals error:', err)
    res.status(500).json({ error: 'Server error', message: 'Server error' })
  }
})

/**
 * PATCH /api/admin/goals/:id/unlock
 * Admin overrides a locked goal sheet to clear appraisal lock status (logged)
 */
router.patch('/goals/:id/unlock', async (req, res) => {
  try {
    const goalId = req.params.id

    // Check if goal exists
    const goalRes = await db.query('SELECT * FROM goals WHERE id = $1', [goalId])
    if (goalRes.rowCount === 0) {
      return res.status(404).json({ error: 'Goal not found', message: 'Goal not found' })
    }

    const goal = goalRes.rows[0]

    // Reset locked state and restore to draft status for manual revisions
    await db.query('UPDATE goals SET locked = false, status = $1 WHERE id = $2', ['draft', goalId])

    // Log the override action in the performance audit feed
    await db.query(
      `INSERT INTO audit_log (user_id, goal_id, action, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        goalId,
        'UNLOCK_GOAL',
        JSON.stringify({ locked: goal.locked, status: goal.status }),
        JSON.stringify({ locked: false, status: 'draft' })
      ]
    )

    res.json({ 
      success: true, 
      message: 'Goal unlocked and returned to draft successfully',
      goal_id: goalId 
    })
  } catch (err) {
    console.error('Unlock goal error:', err)
    res.status(500).json({ error: 'Server error', message: 'Server error' })
  }
})

/**
 * GET /api/admin/report/achievement
 * Fetches all employees planned vs actual targets for performance progress reviews (JSON)
 */
router.get('/report/achievement', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        g.id as goal_id,
        g.thrust_area,
        g.title,
        g.description,
        g.uom,
        g.target,
        g.deadline,
        g.weightage,
        g.cycle_year,
        u.id as employee_id,
        u.name as employee_name,
        u.email as employee_email,
        u.department,
        m.name as manager_name,
        a.quarter,
        a.actual,
        a.completion_date,
        a.progress_status,
        a.score
      FROM goals g
      JOIN users u ON g.employee_id = u.id
      LEFT JOIN users m ON u.manager_id = m.id
      LEFT JOIN achievements a ON a.goal_id = g.id
      ORDER BY u.name ASC, g.id ASC, a.quarter ASC
    `)
    res.json(rows)
  } catch (err) {
    console.error('Achievement report error:', err)
    res.status(500).json({ error: 'Server error', message: 'Server error' })
  }
})

/**
 * GET /api/admin/report/achievement/export
 * Delivers same planned vs actual dataset as a formatted CSV spreadsheet
 */
router.get('/report/achievement/export', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        u.name as employee_name,
        u.email as employee_email,
        u.department,
        m.name as manager_name,
        g.thrust_area,
        g.title,
        g.uom,
        g.target,
        g.weightage,
        g.cycle_year,
        a.quarter,
        a.actual,
        a.completion_date,
        a.progress_status,
        a.score
      FROM goals g
      JOIN users u ON g.employee_id = u.id
      LEFT JOIN users m ON u.manager_id = m.id
      LEFT JOIN achievements a ON a.goal_id = g.id
      ORDER BY u.name ASC, g.id ASC, a.quarter ASC
    `)

    const fields = [
      { label: 'Employee Name', value: 'employee_name' },
      { label: 'Employee Email', value: 'employee_email' },
      { label: 'Department', value: 'department' },
      { label: 'Manager Name', value: 'manager_name' },
      { label: 'Thrust Area', value: 'thrust_area' },
      { label: 'Goal Title', value: 'title' },
      { label: 'UoM', value: 'uom' },
      { label: 'Planned Target', value: 'target' },
      { label: 'Weightage (%)', value: 'weightage' },
      { label: 'Cycle Year', value: 'cycle_year' },
      { label: 'Quarter', value: 'quarter' },
      { label: 'Actual Logged', value: 'actual' },
      { label: 'Completion Date', value: 'completion_date' },
      { label: 'Progress Status', value: 'progress_status' },
      { label: 'Computed Score', value: 'score' }
    ]

    const parser = new Parser({ fields })
    const csv = parser.parse(rows)

    res.header('Content-Type', 'text/csv')
    res.attachment('employee_achievements_report.csv')
    res.send(csv)
  } catch (err) {
    console.error('Export report error:', err)
    res.status(500).json({ error: 'Server error', message: 'Server error' })
  }
})

/**
 * GET /api/admin/report/completion
 * Tracks check-in completions per reporting employee and manager for each quarter
 */
router.get('/report/completion', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        u.id as employee_id,
        u.name as employee_name,
        u.department,
        m.name as manager_name,
        q.quarter,
        COALESCE(c.id IS NOT NULL, false) as manager_submitted,
        c.created_at as manager_submitted_at,
        (
          SELECT COUNT(*)::int
          FROM goals g 
          LEFT JOIN achievements a ON a.goal_id = g.id AND a.quarter = q.quarter
          WHERE g.employee_id = u.id AND a.actual IS NOT NULL
        ) as logged_actuals_count,
        (
          SELECT COUNT(*)::int
          FROM goals g 
          WHERE g.employee_id = u.id
        ) as total_goals_count
      FROM users u
      JOIN users m ON u.manager_id = m.id
      CROSS JOIN (
        SELECT 'Q1' as quarter UNION SELECT 'Q2' UNION SELECT 'Q3' UNION SELECT 'Q4'
      ) q
      LEFT JOIN checkins c ON c.employee_id = u.id AND c.quarter = q.quarter
      WHERE u.role = 'employee'
      ORDER BY u.name ASC, q.quarter ASC
    `)
    res.json(rows)
  } catch (err) {
    console.error('Completion report error:', err)
    res.status(500).json({ error: 'Server error', message: 'Server error' })
  }
})

/**
 * GET /api/admin/audit
 * Fetches the entire administrative action and security override feeds
 */
router.get('/audit', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        al.id,
        al.action,
        al.old_value,
        al.new_value,
        al.created_at,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role,
        g.title as goal_title
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN goals g ON al.goal_id = g.id
      ORDER BY al.created_at DESC
    `)
    res.json(rows)
  } catch (err) {
    console.error('Get audit log error:', err)
    res.status(500).json({ error: 'Server error', message: 'Server error' })
  }
})

// ── Analytics Endpoints (Phase 6) ─────────────────────────

/**
 * GET /api/admin/analytics/qoq
 * Quarter-over-Quarter achievement trend (average score per quarter)
 */
router.get('/analytics/qoq', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT quarter, ROUND(AVG(score), 2)::numeric as avg_score
      FROM achievements
      WHERE score IS NOT NULL
      GROUP BY quarter
      ORDER BY quarter ASC
    `)
    res.json(rows)
  } catch (err) {
    console.error('QoQ analytics error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

/**
 * GET /api/admin/analytics/distribution
 * Goal distribution by thrust area
 */
router.get('/analytics/distribution', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT thrust_area as name, COUNT(*) as value
      FROM goals
      GROUP BY thrust_area
    `)
    res.json(rows)
  } catch (err) {
    console.error('Distribution analytics error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

/**
 * GET /api/admin/analytics/manager-effectiveness
 * Average score of employees grouped by manager
 */
router.get('/analytics/manager-effectiveness', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT m.name as manager_name, ROUND(AVG(a.score), 2)::numeric as avg_score
      FROM achievements a
      JOIN goals g ON a.goal_id = g.id
      JOIN users u ON g.employee_id = u.id
      JOIN users m ON u.manager_id = m.id
      WHERE a.score IS NOT NULL
      GROUP BY m.id, m.name
      ORDER BY avg_score DESC
    `)
    res.json(rows)
  } catch (err) {
    console.error('Manager effectiveness analytics error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
