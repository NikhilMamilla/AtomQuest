const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')

/**
 * Returns which quarter's logging window is open based on the current month.
 * July (month index 6) = Q1
 * Oct (month index 9) = Q2
 * Jan (month index 0) = Q3
 * Mar/Apr (month index 2/3) = Q4
 */
function getValidQuarterForCurrentMonth() {
  const month = new Date().getMonth() // 0-indexed JS Month: 0=Jan, 1=Feb, 2=Mar, etc.
  if (month === 6) return 'Q1'     // July
  if (month === 9) return 'Q2'     // October
  if (month === 0) return 'Q3'     // January
  if (month === 2 || month === 3) return 'Q4' // March or April
  return null
}

/**
 * Server-side score calculator mirroring frontend scoreCalc.ts
 */
function calculateAchievementScore(uom, targetVal, actualVal, deadlineVal, completionDateVal) {
  const target = parseFloat(targetVal) || 0
  const actual = parseFloat(actualVal) || 0

  switch (uom) {
    case 'numeric_min':
    case 'percent_min':
      if (target === 0) return 0
      return actual / target // higher is better
    case 'numeric_max':
    case 'percent_max':
      if (actual === 0) return 0
      return target / actual // lower is better
    case 'timeline':
      if (!deadlineVal || !completionDateVal) return 0
      return new Date(completionDateVal) <= new Date(deadlineVal) ? 1 : 0
    case 'zero':
      return actual === 0 ? 1 : 0
    default:
      return 0
  }
}

// GET /api/achievements — Fetch goals joined with achievements for a quarter
router.get('/', auth, async (req, res) => {
  try {
    const quarter = req.query.quarter
    if (!quarter) {
      return res.status(400).json({ error: 'quarter parameter is required (e.g. Q1, Q2, Q3, Q4)' })
    }

    const employeeId = parseInt(req.query.employee_id || req.user.id)
    const cycleYear = parseInt(req.query.cycle_year || new Date().getFullYear())

    // Permissions check
    if (req.user.role === 'employee' && employeeId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only view your own achievements' })
    }

    if (req.user.role === 'manager') {
      // Check reporting line if not querying self
      if (employeeId !== req.user.id) {
        const { rows: reportRows } = await db.query(
          'SELECT id FROM users WHERE id = $1 AND manager_id = $2',
          [employeeId, req.user.id]
        )
        if (reportRows.length === 0) {
          return res.status(403).json({ error: 'Forbidden', message: 'You can only view achievements of direct reports' })
        }
      }
    }

    // Retrieve goals joined with any quarterly achievements recorded
    const queryStr = `
      SELECT 
        g.id AS goal_id,
        g.employee_id,
        g.thrust_area,
        g.title,
        g.description,
        g.uom,
        g.target,
        g.deadline,
        g.weightage,
        g.status AS goal_status,
        g.cycle_year,
        a.id AS achievement_id,
        a.quarter,
        a.actual,
        a.completion_date,
        a.progress_status,
        a.score,
        a.updated_at
      FROM goals g
      LEFT JOIN achievements a ON g.id = a.goal_id AND a.quarter = $1
      WHERE g.employee_id = $2 AND g.cycle_year = $3
      ORDER BY g.created_at ASC
    `
    const { rows } = await db.query(queryStr, [quarter, employeeId, cycleYear])
    res.json(rows)
  } catch (err) {
    console.error('Fetch achievements error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/achievements — Log quarterly achievements (upsert)
router.post('/', auth, async (req, res) => {
  try {
    const { goal_id, quarter, actual, completion_date, progress_status } = req.body

    if (!goal_id || !quarter) {
      return res.status(400).json({ error: 'goal_id and quarter are required parameters' })
    }

    // Fetch the target goal
    const goalRes = await db.query('SELECT * FROM goals WHERE id = $1', [goal_id])
    if (goalRes.rowCount === 0) {
      return res.status(404).json({ error: 'Goal not found' })
    }

    const goal = goalRes.rows[0]

    // Permissions check
    if (req.user.role === 'employee' && goal.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only log achievements for your own goals' })
    }

    // Goal status must be approved before achievements can be logged
    if (goal.status !== 'approved') {
      return res.status(400).json({ 
        error: 'Goal not approved', 
        message: 'Achievements can only be logged on approved goal sheets.' 
      })
    }

    // Quarter Window Enforcement (Employees only; Admins/Managers bypass for corrections)
    if (req.user.role === 'employee') {
      const allowedQuarter = getValidQuarterForCurrentMonth()
      if (allowedQuarter !== quarter) {
        return res.status(400).json({
          error: 'Quarter window closed',
          message: `The window for logging ${quarter} achievements is closed. You can only log achievements for ${allowedQuarter || 'no active quarter'} at this time.`
        })
      }
    }

    // Compute achievements score
    const score = calculateAchievementScore(goal.uom, goal.target, actual, goal.deadline, completion_date)

    // Check if achievement record already exists for this goal and quarter
    const existRes = await db.query(
      'SELECT id FROM achievements WHERE goal_id = $1 AND quarter = $2',
      [goal_id, quarter]
    )

    let result
    if (existRes.rowCount > 0) {
      // Perform Update
      const achievementId = existRes.rows[0].id
      const updateQuery = `
        UPDATE achievements
        SET actual = $1, completion_date = $2, progress_status = $3, score = $4, updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `
      const { rows } = await db.query(updateQuery, [actual, completion_date, progress_status || 'not_started', score, achievementId])
      result = rows[0]
    } else {
      // Perform Insert
      const insertQuery = `
        INSERT INTO achievements (goal_id, quarter, actual, completion_date, progress_status, score)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `
      const { rows } = await db.query(insertQuery, [goal_id, quarter, actual, completion_date, progress_status || 'not_started', score])
      result = rows[0]
    }

    // ── Shared Goal Achievement Sync ──
    // If this goal is a master (has children via shared_from_id), sync achievements to all linked goals
    const { rows: childGoals } = await db.query(
      'SELECT id FROM goals WHERE shared_from_id = $1',
      [goal_id]
    )
    if (childGoals.length > 0) {
      for (const child of childGoals) {
        const { rows: childExist } = await db.query(
          'SELECT id FROM achievements WHERE goal_id = $1 AND quarter = $2',
          [child.id, quarter]
        )
        if (childExist.length > 0) {
          await db.query(
            `UPDATE achievements SET actual = $1, completion_date = $2, progress_status = $3, score = $4, updated_at = NOW() WHERE id = $5`,
            [actual, completion_date, progress_status || 'not_started', score, childExist[0].id]
          )
        } else {
          await db.query(
            `INSERT INTO achievements (goal_id, quarter, actual, completion_date, progress_status, score) VALUES ($1, $2, $3, $4, $5, $6)`,
            [child.id, quarter, actual, completion_date, progress_status || 'not_started', score]
          )
        }
      }
    }

    res.status(201).json(result)
  } catch (err) {
    console.error('Log achievement error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/achievements/:id — Update existing achievements log
router.put('/:id', auth, async (req, res) => {
  try {
    const achievementId = parseInt(req.params.id)

    // Fetch existing achievement
    const achRes = await db.query('SELECT * FROM achievements WHERE id = $1', [achievementId])
    if (achRes.rowCount === 0) {
      return res.status(404).json({ error: 'Achievement not found' })
    }

    const ach = achRes.rows[0]

    // Fetch the associated goal to check owner & uom
    const goalRes = await db.query('SELECT * FROM goals WHERE id = $1', [ach.goal_id])
    const goal = goalRes.rows[0]

    // Permissions check
    if (req.user.role === 'employee' && goal.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only update achievements for your own goals' })
    }

    // Quarter Window Enforcement (Employees only)
    if (req.user.role === 'employee') {
      const allowedQuarter = getValidQuarterForCurrentMonth()
      if (allowedQuarter !== ach.quarter) {
        return res.status(400).json({
          error: 'Quarter window closed',
          message: `The window for updating ${ach.quarter} achievements is closed. You can only update achievements for ${allowedQuarter || 'no active quarter'} at this time.`
        })
      }
    }

    const actual = req.body.actual !== undefined ? req.body.actual : ach.actual
    const completion_date = req.body.completion_date !== undefined ? req.body.completion_date : ach.completion_date
    const progress_status = req.body.progress_status !== undefined ? req.body.progress_status : ach.progress_status

    // Recompute score
    const score = calculateAchievementScore(goal.uom, goal.target, actual, goal.deadline, completion_date)

    const updateQuery = `
      UPDATE achievements
      SET actual = $1, completion_date = $2, progress_status = $3, score = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `
    const { rows } = await db.query(updateQuery, [actual, completion_date, progress_status, score, achievementId])

    // ── Shared Goal Achievement Sync (on update) ──
    const { rows: childGoals } = await db.query(
      'SELECT id FROM goals WHERE shared_from_id = $1',
      [ach.goal_id]
    )
    if (childGoals.length > 0) {
      for (const child of childGoals) {
        const { rows: childExist } = await db.query(
          'SELECT id FROM achievements WHERE goal_id = $1 AND quarter = $2',
          [child.id, ach.quarter]
        )
        if (childExist.length > 0) {
          await db.query(
            `UPDATE achievements SET actual = $1, completion_date = $2, progress_status = $3, score = $4, updated_at = NOW() WHERE id = $5`,
            [actual, completion_date, progress_status, score, childExist[0].id]
          )
        } else {
          await db.query(
            `INSERT INTO achievements (goal_id, quarter, actual, completion_date, progress_status, score) VALUES ($1, $2, $3, $4, $5, $6)`,
            [child.id, ach.quarter, actual, completion_date, progress_status, score]
          )
        }
      }
    }

    res.json(rows[0])
  } catch (err) {
    console.error('Update achievement error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
