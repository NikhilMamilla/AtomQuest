const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')
const auth = require('../middleware/auth')

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password required',
        message: 'Email and password required' 
      })
    }

    const { rows } = await db.query(
      'SELECT id, name, email, password_hash, role, manager_id, department FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    )

    const user = rows[0]
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Invalid credentials'
      })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Invalid credentials'
      })
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'your_super_secret_key_change_this',
      { expiresIn: '8h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        manager_id: user.manager_id,
        department: user.department,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ 
      error: 'Server error',
      message: 'Server error'
    })
  }
})

// GET /api/auth/me — verify token & return user
router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, email, role, manager_id, department FROM users WHERE id = $1',
      [req.user.id]
    )
    if (!rows[0]) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User not found'
      })
    }
    res.json(rows[0])
  } catch (err) {
    console.error('Auth check error:', err)
    res.status(500).json({ 
      error: 'Server error',
      message: 'Server error'
    })
  }
})

module.exports = router
