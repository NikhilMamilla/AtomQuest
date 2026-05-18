const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()

app.use(cors({
  origin: function (origin, callback) {
    // Automatically allow local development, production Vercel app, and any Vercel preview deploys
    callback(null, true)
  },
  credentials: true
}))
app.use(express.json())

app.get('/health', (_, res) => res.json({ ok: true, ts: new Date() }))
app.get('/api/health', (_, res) => res.json({ ok: true, ts: new Date() }))

// Email simulation log endpoints
app.get('/api/emails', (req, res) => {
  const { emailLog } = require('./services/mailer')
  res.json(emailLog)
})
app.delete('/api/emails', (req, res) => {
  const { emailLog } = require('./services/mailer')
  emailLog.length = 0
  res.json({ ok: true, message: 'Email log cleared' })
})

app.use('/api/auth', require('./routes/auth'))

// Phase 2+ routes added here
app.use('/api/goals', require('./routes/goals'))
app.use('/api/checkins', require('./routes/checkins'))
app.use('/api/achievements', require('./routes/achievements'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/escalations', require('./routes/escalations'))

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

// Initialize background jobs
const { initCronJobs } = require('./jobs/reminderCron')
initCronJobs()

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`✅ Backend on :${PORT}`))