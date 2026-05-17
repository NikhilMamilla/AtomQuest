const nodemailer = require('nodemailer')

// Create transporter — uses env vars or falls back to Ethereal (fake SMTP for dev/demo)
let transporter = null
const emailLog = []

async function getTransporter() {
  if (transporter) return transporter

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Production SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  } else {
    // Dev/demo — use Ethereal fake SMTP (no real emails sent)
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
    console.log('[Mailer] Using Ethereal test account:', testAccount.user)
  }

  return transporter
}

/**
 * Send an email notification
 * @param {Object} opts - { to, subject, html }
 * @returns {Object} - nodemailer info object
 */
async function sendMail({ to, subject, html }) {
  const emailId = 'msg_' + Math.random().toString(36).substr(2, 9)
  const sentAt = new Date().toISOString()
  let previewUrl = null

  try {
    const t = await getTransporter()
    const from = process.env.SMTP_FROM || 'AtomQuest <noreply@atomquest.app>'

    const info = await t.sendMail({ from, to, subject, html })

    // In dev mode, log the preview URL
    previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) {
      console.log(`[Mailer] Preview URL: ${previewUrl}`)
    }

    console.log(`[Mailer] Sent to ${to}: ${subject} (messageId: ${info.messageId})`)

    emailLog.push({
      id: info.messageId || emailId,
      to,
      subject,
      html,
      previewUrl,
      sentAt,
      status: 'sent'
    })

    return info
  } catch (err) {
    console.error(`[Mailer] Failed to send to ${to}:`, err.message)

    emailLog.push({
      id: emailId,
      to,
      subject,
      html,
      previewUrl: null,
      sentAt,
      status: 'failed',
      error: err.message
    })

    return null
  }
}

// ── Pre-built notification templates ──────────────────────

/**
 * Notify manager when an employee submits their goal sheet
 */
async function notifyGoalSubmitted(managerEmail, managerName, employeeName) {
  return sendMail({
    to: managerEmail,
    subject: `🎯 ${employeeName} submitted their goal sheet for review`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #6366f1;">Goal Sheet Submitted</h2>
        <p>Hi <strong>${managerName}</strong>,</p>
        <p><strong>${employeeName}</strong> has submitted their performance goal sheet and is awaiting your review and approval.</p>
        <p style="margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/manager" 
             style="background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Review Goals →
          </a>
        </p>
        <p style="color: #888; font-size: 12px; margin-top: 24px;">— AtomQuest Performance System</p>
      </div>
    `,
  })
}

/**
 * Notify employee when manager approves their goal sheet
 */
async function notifyGoalApproved(employeeEmail, employeeName, managerName) {
  return sendMail({
    to: employeeEmail,
    subject: `✅ Your goal sheet has been approved by ${managerName}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #10b981;">Goals Approved!</h2>
        <p>Hi <strong>${employeeName}</strong>,</p>
        <p>Your performance goal sheet has been reviewed and <strong>approved</strong> by <strong>${managerName}</strong>. Your goals are now locked for the cycle.</p>
        <p style="margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/employee" 
             style="background: #10b981; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            View My Goals →
          </a>
        </p>
        <p style="color: #888; font-size: 12px; margin-top: 24px;">— AtomQuest Performance System</p>
      </div>
    `,
  })
}

/**
 * Notify employee when manager returns their goal sheet
 */
async function notifyGoalReturned(employeeEmail, employeeName, managerName, comment) {
  return sendMail({
    to: employeeEmail,
    subject: `↩️ Your goal sheet was returned by ${managerName}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #f59e0b;">Goals Returned for Revision</h2>
        <p>Hi <strong>${employeeName}</strong>,</p>
        <p><strong>${managerName}</strong> has returned your goal sheet for revision.</p>
        ${comment ? `<blockquote style="border-left: 3px solid #f59e0b; padding: 8px 12px; margin: 16px 0; background: #fffbeb; color: #92400e; border-radius: 4px;">${comment}</blockquote>` : ''}
        <p style="margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/employee" 
             style="background: #f59e0b; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Edit My Goals →
          </a>
        </p>
        <p style="color: #888; font-size: 12px; margin-top: 24px;">— AtomQuest Performance System</p>
      </div>
    `,
  })
}

/**
 * Send check-in reminder to an employee
 */
async function sendCheckinReminder(employeeEmail, employeeName, quarter) {
  return sendMail({
    to: employeeEmail,
    subject: `⏰ Reminder: ${quarter} check-in is due`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #6366f1;">Quarterly Check-in Reminder</h2>
        <p>Hi <strong>${employeeName}</strong>,</p>
        <p>This is a friendly reminder that your <strong>${quarter}</strong> check-in actuals are due. Please log your progress for each goal.</p>
        <p style="margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/employee/checkin" 
             style="background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Log Check-in →
          </a>
        </p>
        <p style="color: #888; font-size: 12px; margin-top: 24px;">— AtomQuest Performance System</p>
      </div>
    `,
  })
}

module.exports = {
  sendMail,
  notifyGoalSubmitted,
  notifyGoalApproved,
  notifyGoalReturned,
  sendCheckinReminder,
  emailLog,
}
