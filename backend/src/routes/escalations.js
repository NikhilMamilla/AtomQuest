const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')

// Admin-only guard
function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next()
  return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' })
}

router.use(auth)
router.use(isAdmin)

// ── Escalation Rules CRUD ─────────────────────────────────

/**
 * GET /api/escalations/rules — list all escalation rules
 */
router.get('/rules', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT r.*, u.name as created_by_name
      FROM escalation_rules r
      LEFT JOIN users u ON r.created_by = u.id
      ORDER BY r.created_at DESC
    `)
    res.json(rows)
  } catch (err) {
    console.error('List rules error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

/**
 * POST /api/escalations/rules — create a new escalation rule
 */
router.post('/rules', async (req, res) => {
  try {
    const { name, trigger_type, threshold_days, action } = req.body

    if (!name || !trigger_type || !threshold_days) {
      return res.status(400).json({ error: 'name, trigger_type, and threshold_days are required' })
    }

    const validTriggers = ['goal_not_submitted', 'approval_pending', 'checkin_overdue']
    if (!validTriggers.includes(trigger_type)) {
      return res.status(400).json({ error: `Invalid trigger_type. Must be one of: ${validTriggers.join(', ')}` })
    }

    const { rows } = await db.query(
      `INSERT INTO escalation_rules (name, trigger_type, threshold_days, action, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, trigger_type, threshold_days, action || 'notify', req.user.id]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Create rule error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

/**
 * PATCH /api/escalations/rules/:id — toggle rule active/inactive
 */
router.patch('/rules/:id', async (req, res) => {
  try {
    const { is_active } = req.body
    const { rows } = await db.query(
      'UPDATE escalation_rules SET is_active = $1 WHERE id = $2 RETURNING *',
      [is_active, req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Rule not found' })
    res.json(rows[0])
  } catch (err) {
    console.error('Toggle rule error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

/**
 * DELETE /api/escalations/rules/:id — delete a rule
 */
router.delete('/rules/:id', async (req, res) => {
  try {
    // Delete associated logs first
    await db.query('DELETE FROM escalation_log WHERE rule_id = $1', [req.params.id])
    const result = await db.query('DELETE FROM escalation_rules WHERE id = $1', [req.params.id])
    if (result.rowCount === 0) return res.status(404).json({ error: 'Rule not found' })
    res.json({ success: true })
  } catch (err) {
    console.error('Delete rule error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── Escalation Log ────────────────────────────────────────

/**
 * GET /api/escalations/log — view all escalation events
 */
router.get('/log', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        el.*,
        r.name as rule_name,
        r.threshold_days,
        u.name as employee_name,
        u.email as employee_email,
        m.name as manager_name
      FROM escalation_log el
      LEFT JOIN escalation_rules r ON el.rule_id = r.id
      LEFT JOIN users u ON el.employee_id = u.id
      LEFT JOIN users m ON el.manager_id = m.id
      ORDER BY el.created_at DESC
    `)
    res.json(rows)
  } catch (err) {
    console.error('List escalation log error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

/**
 * PATCH /api/escalations/log/:id/resolve — mark an escalation as resolved
 */
router.patch('/log/:id/resolve', async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE escalation_log SET resolved = true WHERE id = $1 RETURNING *',
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Entry not found' })
    res.json(rows[0])
  } catch (err) {
    console.error('Resolve escalation error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
