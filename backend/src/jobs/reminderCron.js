const cron = require('node-cron')
const db = require('../db')
const { sendCheckinReminder } = require('../services/mailer')

/**
 * Determine the current active quarter based on month
 * Q1: Jul-Sep, Q2: Oct-Dec, Q3: Jan-Mar, Q4: Apr-Jun
 */
function getCurrentQuarter() {
  const month = new Date().getMonth() + 1
  if (month >= 7 && month <= 9) return 'Q1'
  if (month >= 10 && month <= 12) return 'Q2'
  if (month >= 1 && month <= 3) return 'Q3'
  return 'Q4'
}

/**
 * Check-in reminder job: finds employees with approved goals who haven't logged actuals
 * for the current quarter, and sends them a reminder email.
 */
async function runCheckinReminders() {
  const quarter = getCurrentQuarter()
  console.log(`[Cron] Running check-in reminder job for ${quarter} at ${new Date().toISOString()}`)

  try {
    // Find employees with approved goals who have NOT logged actuals for this quarter
    const { rows } = await db.query(`
      SELECT DISTINCT u.id, u.name, u.email
      FROM users u
      JOIN goals g ON g.employee_id = u.id AND g.locked = true
      WHERE u.role = 'employee'
        AND NOT EXISTS (
          SELECT 1 FROM achievements a
          WHERE a.goal_id = g.id AND a.quarter = $1 AND a.actual IS NOT NULL
        )
    `, [quarter])

    console.log(`[Cron] Found ${rows.length} employees with pending ${quarter} check-ins`)

    for (const emp of rows) {
      await sendCheckinReminder(emp.email, emp.name, quarter)
    }

    console.log(`[Cron] Check-in reminder job completed`)
  } catch (err) {
    console.error('[Cron] Check-in reminder error:', err.message)
  }
}

/**
 * Escalation job: checks all active escalation rules and logs violations
 */
async function runEscalationChecks() {
  console.log(`[Cron] Running escalation checks at ${new Date().toISOString()}`)

  try {
    const { rows: rules } = await db.query(
      'SELECT * FROM escalation_rules WHERE is_active = true'
    )

    for (const rule of rules) {
      let violators = []

      if (rule.trigger_type === 'goal_not_submitted') {
        // Employees who have draft goals older than threshold days
        const { rows } = await db.query(`
          SELECT DISTINCT u.id as employee_id, u.name as employee_name, u.manager_id,
                 MIN(g.created_at) as oldest_goal
          FROM users u
          JOIN goals g ON g.employee_id = u.id AND g.status = 'draft'
          WHERE u.role = 'employee'
            AND g.created_at < NOW() - INTERVAL '1 day' * $1
          GROUP BY u.id, u.name, u.manager_id
        `, [rule.threshold_days])
        violators = rows

      } else if (rule.trigger_type === 'approval_pending') {
        // Goals in pending/submitted status older than threshold days
        const { rows } = await db.query(`
          SELECT DISTINCT u.id as employee_id, u.name as employee_name, u.manager_id
          FROM users u
          JOIN goals g ON g.employee_id = u.id AND g.status IN ('pending', 'submitted')
          WHERE g.created_at < NOW() - INTERVAL '1 day' * $1
        `, [rule.threshold_days])
        violators = rows

      } else if (rule.trigger_type === 'checkin_overdue') {
        // Employees with locked goals but no actuals for current quarter
        const quarter = getCurrentQuarter()
        const { rows } = await db.query(`
          SELECT DISTINCT u.id as employee_id, u.name as employee_name, u.manager_id
          FROM users u
          JOIN goals g ON g.employee_id = u.id AND g.locked = true
          WHERE u.role = 'employee'
            AND NOT EXISTS (
              SELECT 1 FROM achievements a
              WHERE a.goal_id = g.id AND a.quarter = $1 AND a.actual IS NOT NULL
            )
        `, [quarter])
        violators = rows
      }

      // Log escalations for each violator (avoid duplicates within 24h)
      for (const v of violators) {
        const existing = await db.query(`
          SELECT id FROM escalation_log
          WHERE rule_id = $1 AND employee_id = $2 AND resolved = false
            AND created_at > NOW() - INTERVAL '24 hours'
        `, [rule.id, v.employee_id])

        if (existing.rowCount === 0) {
          await db.query(`
            INSERT INTO escalation_log (rule_id, employee_id, manager_id, trigger_type, message)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            rule.id,
            v.employee_id,
            v.manager_id || null,
            rule.trigger_type,
            `${rule.name}: ${v.employee_name} has exceeded the ${rule.threshold_days}-day threshold`
          ])
        }
      }

      console.log(`[Cron] Rule "${rule.name}": ${violators.length} violations found`)
    }

    console.log(`[Cron] Escalation checks completed`)
  } catch (err) {
    console.error('[Cron] Escalation check error:', err.message)
  }
}

/**
 * Initialize all cron jobs
 */
function initCronJobs() {
  // Run check-in reminders daily at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    runCheckinReminders()
  })

  // Run escalation checks daily at 10:00 AM
  cron.schedule('0 10 * * *', () => {
    runEscalationChecks()
  })

  console.log('[Cron] Scheduled: check-in reminders (9 AM daily), escalation checks (10 AM daily)')
}

module.exports = { initCronJobs, runCheckinReminders, runEscalationChecks }
