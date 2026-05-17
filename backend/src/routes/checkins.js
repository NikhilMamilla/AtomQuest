const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')
const authorize = require('../middleware/authorize')

// GET /api/checkins/team-goals — Get all goals of reporting employees grouped by name
router.get('/team-goals', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const cycleYear = parseInt(req.query.cycle_year || new Date().getFullYear())
    
    let queryStr = `
      SELECT 
        g.*, 
        u.id AS employee_id, 
        u.name AS employee_name, 
        u.email AS employee_email, 
        u.department, 
        m.name AS manager_name
      FROM users u
      LEFT JOIN goals g ON g.employee_id = u.id AND g.cycle_year = $1
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE u.role != 'admin'
    `
    const params = [cycleYear]

    // If manager, filter by their reporting lines only
    if (req.user.role === 'manager') {
      queryStr += ' AND u.manager_id = $2'
      params.push(req.user.id)
    }

    queryStr += ' ORDER BY u.name, g.created_at ASC'
    
    const { rows } = await db.query(queryStr, params)
    res.json(rows)
  } catch (err) {
    console.error('Fetch team goals error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/checkins/comment — Post checkin comment or revision comment
router.post('/comment', auth, async (req, res) => {
  try {
    const { employee_id, quarter, comment } = req.body
    
    if (!quarter || !comment) {
      return res.status(400).json({ error: 'quarter and comment are required' })
    }

    let targetEmployeeId
    let targetManagerId
    let senderId = req.user.id

    if (req.user.role === 'employee') {
      // Employee posting their own comment
      targetEmployeeId = req.user.id
      
      // Look up employee's manager
      const { rows: userRows } = await db.query('SELECT manager_id FROM users WHERE id = $1', [req.user.id])
      targetManagerId = userRows[0]?.manager_id
      
      if (!targetManagerId) {
        return res.status(400).json({ error: 'No manager is assigned to your profile.' })
      }
    } else {
      // Manager or Admin posting comment
      if (!employee_id) {
        return res.status(400).json({ error: 'employee_id is required' })
      }
      targetEmployeeId = parseInt(employee_id)
      targetManagerId = req.user.id

      // Verify manager reporting relationship if not admin
      if (req.user.role !== 'admin') {
        const { rows: reportRows } = await db.query(
          'SELECT id FROM users WHERE id = $1 AND manager_id = $2',
          [targetEmployeeId, req.user.id]
        )
        if (reportRows.length === 0) {
          return res.status(403).json({ 
            error: 'Forbidden', 
            message: 'You can only leave comments for your direct reports' 
          })
        }
      }
    }

    const { rows } = await db.query(
      `INSERT INTO checkins (employee_id, manager_id, sender_id, quarter, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [targetEmployeeId, targetManagerId, senderId, quarter, comment.trim()]
    )

    // Format returning response to match what frontend expects
    const newComment = rows[0]
    const { rows: userNames } = await db.query(
      `SELECT 
         (SELECT name FROM users WHERE id = $1) AS employee_name,
         (SELECT name FROM users WHERE id = $2) AS manager_name`,
      [targetEmployeeId, targetManagerId]
    )
    
    const responseData = {
      ...newComment,
      employee_name: senderId === targetEmployeeId ? userNames[0]?.employee_name : null,
      manager_name: senderId === targetManagerId ? userNames[0]?.manager_name : null
    }

    res.status(201).json(responseData)
  } catch (err) {
    console.error('Post checkin comment error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/checkins — Get list of checkin comments for the logged in user
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
         c.*,
         CASE WHEN COALESCE(c.sender_id, c.manager_id) = c.employee_id THEN emp.name ELSE NULL END AS employee_name,
         CASE WHEN COALESCE(c.sender_id, c.manager_id) = c.manager_id THEN mng.name ELSE NULL END AS manager_name
       FROM checkins c
       JOIN users emp ON emp.id = c.employee_id
       JOIN users mng ON mng.id = c.manager_id
       WHERE c.employee_id = $1 OR c.manager_id = $1
       ORDER BY c.created_at ASC`,
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Fetch checkins comments error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
