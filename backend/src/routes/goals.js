const express = require('express')
const router = express.Router()
const db = require('../db')
const auth = require('../middleware/auth')
const authorize = require('../middleware/authorize')

// Helper to determine current cycle year
const getCurrentYear = () => new Date().getFullYear()

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetches all goals for an employee in a given cycle year
 */
async function getEmployeeGoals(employeeId, cycleYear) {
  const { rows } = await db.query(
    `SELECT g.*, u.name AS employee_name
     FROM goals g
     JOIN users u ON u.id = g.employee_id
     WHERE g.employee_id = $1 AND g.cycle_year = $2
     ORDER BY g.created_at ASC`,
    [employeeId, cycleYear]
  )
  return rows
}

/**
 * Enforces all BRD rules for goal sheets.
 * Note: requireExact100 is ONLY true during final submission.
 */
function validateGoals(goals, newGoal = null, excludeId = null, requireExact100 = false) {
  const errors = []
  
  // Merge existing + new for validation
  const all = newGoal
    ? [...goals.filter(g => g.id !== excludeId), newGoal]
    : goals.filter(g => g.id !== excludeId)

  // Rule 1: Max 8 goals
  if (all.length > 8) {
    errors.push('Maximum 8 goals allowed per employee')
  }

  // Rule 2: Min 10% weightage per goal
  if (newGoal && parseFloat(newGoal.weightage) < 10) {
    errors.push('Minimum weightage per goal is 10%')
  }
  const hasInvalidWeight = all.some(g => parseFloat(g.weightage) < 10)
  if (hasInvalidWeight && requireExact100) {
    errors.push('All goals must have a minimum weightage of 10% before submitting')
  }

  // Rule 3: Total weightage check
  const totalWeight = all.reduce((s, g) => s + parseFloat(g.weightage), 0)
  
  if (requireExact100) {
    if (Math.round(totalWeight) !== 100) {
      errors.push(`Total weightage must equal exactly 100% (currently ${totalWeight.toFixed(1)}%)`)
    }
  } else {
    if (totalWeight > 100) {
      errors.push(`Total weightage cannot exceed 100% (currently ${totalWeight.toFixed(1)}% loaded)`)
    }
  }

  return errors
}

/**
 * Standard audit logging helper
 */
async function logAudit(userId, goalId, action, oldVal, newVal) {
  try {
    await db.query(
      `INSERT INTO audit_log (user_id, goal_id, action, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId, 
        goalId || null, 
        action, 
        oldVal ? JSON.stringify(oldVal) : null, 
        newVal ? JSON.stringify(newVal) : null
      ]
    )
  } catch (err) {
    console.error('[Audit Log Error]:', err.message)
  }
}

// ── Routes ───────────────────────────────────────────────────────────

// POST /api/goals/optimize — SMART AI Goal Copilot route
router.post('/optimize', auth, async (req, res) => {
  const mapThrustArea = (thrust) => {
    if (!thrust) return 'Process Excellence'
    const t = thrust.toLowerCase().trim()
    if (t.includes('revenue') || t.includes('financial') || t.includes('growth') || t.includes('sales')) {
      return 'Revenue Growth'
    }
    if (t.includes('cost') || t.includes('optim') || t.includes('saving')) {
      return 'Cost Optimisation'
    }
    if (t.includes('customer') || t.includes('client') || t.includes('success') || t.includes('csat')) {
      return 'Customer Success'
    }
    if (t.includes('people') || t.includes('culture') || t.includes('hr') || t.includes('employee')) {
      return 'People & Culture'
    }
    if (t.includes('process') || t.includes('excellence') || t.includes('operation') || t.includes('efficiency')) {
      return 'Process Excellence'
    }
    if (t.includes('innovat') || t.includes('creative') || t.includes('r&d')) {
      return 'Innovation'
    }
    if (t.includes('compliance') || t.includes('safety') || t.includes('legal') || t.includes('risk')) {
      return 'Compliance & Safety'
    }
    if (t.includes('digital') || t.includes('tech') || t.includes('software') || t.includes('develop')) {
      return 'Digital & Tech'
    }
    return 'Process Excellence'
  }

  const runFallback = () => {
    const inputTitle = (req.body.title || '').trim()
    const inputDesc = (req.body.description || '').trim()
    const inputThrust = (req.body.thrust_area || '').trim()

    // Determine target thrust area by prioritizing explicit selection, then keyword matching
    let targetThrust = 'Process Excellence'
    const textSource = (inputTitle + ' ' + inputDesc).toLowerCase()

    if (inputThrust) {
      targetThrust = mapThrustArea(inputThrust)
    } else {
      // Guess from keywords
      if (textSource.includes('revenue') || textSource.includes('sales') || textSource.includes('growth') || textSource.includes('financial')) {
        targetThrust = 'Revenue Growth'
      } else if (textSource.includes('cost') || textSource.includes('optim') || textSource.includes('saving') || textSource.includes('spend')) {
        targetThrust = 'Cost Optimisation'
      } else if (textSource.includes('customer') || textSource.includes('client') || textSource.includes('success') || textSource.includes('csat') || textSource.includes('support')) {
        targetThrust = 'Customer Success'
      } else if (textSource.includes('people') || textSource.includes('culture') || textSource.includes('hr') || textSource.includes('employee') || textSource.includes('team')) {
        targetThrust = 'People & Culture'
      } else if (textSource.includes('innovat') || textSource.includes('creative') || textSource.includes('r&d') || textSource.includes('prototype')) {
        targetThrust = 'Innovation'
      } else if (textSource.includes('compliance') || textSource.includes('safety') || textSource.includes('legal') || textSource.includes('risk') || textSource.includes('audit')) {
        targetThrust = 'Compliance & Safety'
      } else if (textSource.includes('digital') || textSource.includes('tech') || textSource.includes('software') || textSource.includes('develop') || textSource.includes('pipeline')) {
        targetThrust = 'Digital & Tech'
      } else {
        targetThrust = 'Process Excellence'
      }
    }

    let optimalTitle = ''
    let optimalDesc = ''
    let optimalUom = 'percent_min'
    let optimalTarget = 100
    let optimalWeightage = 15

    switch (targetThrust) {
      case 'Revenue Growth':
        optimalTitle = 'Accelerate Quarterly Business Sales Revenue Acquisition'
        optimalDesc = 'Identify high-value business client opportunities, launch hyper-targeted email sequences, and secure new annual subscription contracts to expand quarterly sales.'
        optimalUom = 'numeric_max'
        optimalTarget = 150000
        optimalWeightage = 25
        break
      case 'Cost Optimisation':
        optimalTitle = 'Reduce Cloud Infrastructure & Third-Party Service Spend'
        optimalDesc = 'Audit compute, storage, and networking instances. Deprovision unused staging database resources, adjust scaling rules, and adopt reserved instance strategies.'
        optimalUom = 'percent_max'
        optimalTarget = 20
        optimalWeightage = 15
        break
      case 'Customer Success':
        optimalTitle = 'Improve First-Response Time (FRT) for Enterprise Support Tickets'
        optimalDesc = 'Streamline ticketing queue workflows, configure proactive template notifications, and align tier-1 routing. Maintain average first-response times of under 15 minutes and achieve 98% CSAT score.'
        optimalUom = 'percent_min'
        optimalTarget = 98
        optimalWeightage = 20
        break
      case 'People & Culture':
        optimalTitle = 'Boost Internal Technical Upskilling & Team Engagement'
        optimalDesc = 'Organize monthly peer-to-peer engineering workshops, design standardized employee onboarding paths, and maintain high internal team engagement scores.'
        optimalUom = 'percent_min'
        optimalTarget = 92
        optimalWeightage = 10
        break
      case 'Innovation':
        optimalTitle = 'Design and Prototype Next-Gen AI Assistant Feature Sets'
        optimalDesc = 'Conduct feasibility studies, wireframe conversational layouts, and build a high-fidelity proof-of-concept AI agent to accelerate client workflow tasks.'
        optimalUom = 'numeric_max'
        optimalTarget = 1
        optimalWeightage = 20
        break
      case 'Compliance & Safety':
        optimalTitle = 'Audit System Access Rules & Align with ISO Security Controls'
        optimalDesc = 'Perform complete audits of database privileges, enforce multi-factor authentication policies across active profiles, and compile standard SOC2 audit trails.'
        optimalUom = 'percent_min'
        optimalTarget = 100
        optimalWeightage = 15
        break
      case 'Digital & Tech':
        optimalTitle = 'Implement Automated CI/CD Pipelines & Quality Test Frameworks'
        optimalDesc = 'Deploy custom automated unit-testing pipelines across core billing and authentication microservices. Achieve and safeguard at least 85% test coverage to prevent production deployment regressions.'
        optimalUom = 'percent_min'
        optimalTarget = 85
        optimalWeightage = 15
        break
      case 'Process Excellence':
      default:
        optimalTitle = 'Optimize Checkout API Performance & Response Latency'
        optimalDesc = 'Identify critical bottlenecks in product search, cart operations, and payment triggers. Implement Redis caching and query indexing to reduce end-to-end checkout latency to under 200ms.'
        optimalUom = 'numeric_min'
        optimalTarget = 200
        optimalWeightage = 15
        break
    }

    return {
      thrust_area: targetThrust,
      title: optimalTitle,
      description: optimalDesc,
      uom: optimalUom,
      target: optimalTarget,
      weightage: optimalWeightage
    }
  }

  try {
    const apiKey = process.env.MISTRAL_API_KEY
    if (!apiKey) {
      console.log('[AI Copilot] No Mistral API key found. Running smart fallback.')
      return res.json(runFallback())
    }

    let { title, description, thrust_area } = req.body
    let userTitle = (title || '').trim()
    let userDesc = (description || '').trim()
    const suggestedThrust = thrust_area || 'Process Excellence'

    if (!userTitle && !userDesc) {
      const getTemplates = (thrust) => {
        if (thrust.includes('Revenue') || thrust.includes('Financial') || thrust.includes('Growth')) {
          return [
            {
              title: 'Increase Quarterly Business Sales Revenue',
              desc: 'Identify new market segments, execute targeted outbound outreach campaigns, and secure high-value client subscriptions to drive quarterly revenue growth.'
            },
            {
              title: 'Expand Enterprise Account Expansion & Upsell Value',
              desc: 'Analyze usage triggers in existing enterprise accounts, design personalized product expansion proposals, and secure higher contract values.'
            },
            {
              title: 'Accelerate Inbound Lead Conversion Ratios',
              desc: 'Optimize key product landing pages, decrease follow-up response latency to under 5 minutes, and streamline the demo-to-close pipeline.'
            }
          ]
        }
        if (thrust.includes('Cost')) {
          return [
            {
              title: 'Reduce Software Infrastructure Operational Expenses',
              desc: 'Audit compute and cloud databases to identify unused services, scale down underutilized resources, and optimize queries to lower monthly operations costs.'
            },
            {
              title: 'Optimize Third-Party API Licensing & Vendor Contracts',
              desc: 'Conduct a comprehensive audit of active SaaS and API seat counts, negotiate volume discounts, and consolidate redundant service integrations.'
            },
            {
              title: 'Minimize Office Administration and Logistics Overhead',
              desc: 'Revamp procurement vendor criteria, optimize courier routing logs, and adopt digital-first tools to decrease administrative spending.'
            }
          ]
        }
        if (thrust.includes('Customer')) {
          return [
            {
              title: 'Improve Customer Support Response Times and CSAT Rating',
              desc: 'Optimize support ticketing workflows, document response guidelines, and implement template replies to speed up response times and raise client satisfaction.'
            },
            {
              title: 'Decrease Customer Churn and Boost Net Retention Rate',
              desc: 'Establish proactive client health checkpoints, schedule quarterly business reviews (QBR), and design custom success recovery plans.'
            },
            {
              title: 'Optimize Client Onboarding Time-to-Value (TTV)',
              desc: 'Streamline client setup guides, introduce guided product tours, and deliver initial training sessions to accelerate user onboarding.'
            }
          ]
        }
        if (thrust.includes('People') || thrust.includes('Culture')) {
          return [
            {
              title: 'Enhance Employee Retention and Skill Advancement Programs',
              desc: 'Organize specialized software engineering training sessions, launch peer-to-peer mentoring initiatives, and gather team sentiment feedback.'
            },
            {
              title: 'Streamline Recruitment and Candidate Onboarding Pipelines',
              desc: 'Establish structured interview assessment templates, implement advanced resume screening, and build a unified onboarding handbook.'
            },
            {
              title: 'Standardize Team Career Growth & Feedback Roadmaps',
              desc: 'Implement regular development checkpoints, execute interactive skill audits, and run company-wide career advancement workshops.'
            }
          ]
        }
        if (thrust.includes('Process')) {
          return [
            {
              title: 'Optimize End-to-End Operational Workflow Efficiency',
              desc: 'Map out current checkout pipelines, highlight redundant approvals, and integrate automation to speed up cycle time.'
            },
            {
              title: 'Establish Standardized Departmental Operating Procedures (SOP)',
              desc: 'Document runbooks for high-frequency operations, centralize team reference sheets, and conduct cross-training seminars.'
            },
            {
              title: 'Reduce Operational Defect and Support Escalation Ratios',
              desc: 'Upgrade development peer review guidelines, deploy custom regression testing checklists, and establish incident response frameworks.'
            }
          ]
        }
        if (thrust.includes('Innovat')) {
          return [
            {
              title: 'Design and Launch a Modern High-End Feature Prototype',
              desc: 'Conduct user interviews to discover pain points, design interactive mockup flows, and build a working proof-of-concept prototype.'
            },
            {
              title: 'Coordinate Internal R&D Hackathons for Product Feasibility',
              desc: 'Invite engineering and design teams to build novel platform concepts, test experimental features, and pitch viable upgrades.'
            },
            {
              title: 'Audit and Prototype Next-Generation AI Agent Tools',
              desc: 'Conduct capability reviews across active product segments, design smart AI assistance plugins, and verify processing latency.'
            }
          ]
        }
        if (thrust.includes('Compliance') || thrust.includes('Safety')) {
          return [
            {
              title: 'Standardize Security Compliance Guidelines',
              desc: 'Conduct an audit of active account permissions, enforce password security rules, and train staff on safe data handling.'
            },
            {
              title: 'Prepare System Operations for ISO & SOC2 Security Audits',
              desc: 'Standardize access logs, define data encryption criteria, build centralized audit runbooks, and close infrastructure gaps.'
            },
            {
              title: 'Upgrade Workplace Safety Standards and Drills',
              desc: 'Deliver complete physical hazard training, perform thorough ergonomic workstation reviews, and update emergency guidelines.'
            }
          ]
        }
        if (thrust.includes('Digital') || thrust.includes('Tech')) {
          return [
            {
              title: 'Implement Automated Code Testing and Quality Pipelines',
              desc: 'Deploy automated unit and integration tests across core billing pipelines to check functionality and safeguard software reliability.'
            },
            {
              title: 'Migrate Enterprise Databases to Scalable Serverless Infrastructure',
              desc: 'Re-engineer index schemes, set up connection pool strategies, and manage zero-downtime database transitions.'
            },
            {
              title: 'Boost Frontend Page Load Speeds and SEO Performance',
              desc: 'Optimize code bundling rules, apply modern media caching, configure responsive loading priorities, and lower latency.'
            }
          ]
        }
        return [
          {
            title: 'Optimize End-to-End Operational Workflow Efficiency',
            desc: 'Map out current checkout pipelines, highlight redundant approvals, and integrate automation to speed up cycle time.'
          }
        ]
      }

      const cycleYear = getCurrentYear()
      const existingGoals = await getEmployeeGoals(req.user.id, cycleYear)
      const existingTitles = existingGoals.map(g => g.title)

      let templates = getTemplates(suggestedThrust)
      // Filter out templates that are already present in existing goals
      templates = templates.filter(t => !existingTitles.some(et => et.toLowerCase().includes(t.title.toLowerCase()) || t.title.toLowerCase().includes(et.toLowerCase())))
      
      // Fallback to full templates if all are filtered out
      if (templates.length === 0) {
        templates = getTemplates(suggestedThrust)
      }

      // Pick a random template from the distinct remaining options
      const selected = templates[Math.floor(Math.random() * templates.length)]
      userTitle = selected.title
      userDesc = selected.desc
    }

    const cycleYear = getCurrentYear()
    const existingGoals = await getEmployeeGoals(req.user.id, cycleYear)
    const existingTitles = existingGoals.map(g => g.title)

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          {
            role: 'system',
            content: `You are a professional HR and performance alignment AI. Optimize the user's draft objective into a high-impact, professional SMART goal.
If the draft is empty or basic, generate a comprehensive, premium SMART goal from scratch based on the Suggested Thrust Area.
Categorize it into one of these exact Thrust Areas: "Revenue Growth", "Cost Optimisation", "Customer Success", "People & Culture", "Process Excellence", "Innovation", "Compliance & Safety", "Digital & Tech".
Select the best UoM: "numeric_min" (number, lower is better), "numeric_max" (number, higher is better), "percent_min" (percentage, higher is better), "percent_max" (percentage, lower is better), "timeline" (specific completion date), "zero" (binary/zero-defect target).
Suggest a realistic target (number or date string for timeline UoM) and a weightage (integer >= 10, typically 10 to 40, depending on size of goal).

CRITICAL ANTI-DUPLICATION RULE: The employee ALREADY has the following active goals in their sheet: ${JSON.stringify(existingTitles)}.
You MUST generate a performance goal that is COMPLETELY distinct, unique, and has a different objective focus and target metric than any of the existing goals listed above. DO NOT duplicate, overlap, or reuse the same metrics or core concepts.

You MUST respond ONLY with a raw, valid JSON object matching this structure EXACTLY (do not wrap in markdown, backticks, or any conversational text):
{
  "thrust_area": "string",
  "title": "string",
  "description": "string",
  "uom": "string",
  "target": number_or_string,
  "weightage": number
}`
          },
          {
            role: 'user',
            content: `User Draft Goal:
- Title: "${userTitle}"
- Description: "${userDesc}"
- Suggested Thrust Area: "${suggestedThrust}"`
          }
        ]
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[AI Copilot API Error]:', response.status, errText)
      return res.json(runFallback())
    }

    const data = await response.json()
    let text = data.choices?.[0]?.message?.content || ''
    
    // Robust bracket extraction to get ONLY the JSON object
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start !== -1 && end !== -1) {
      text = text.substring(start, end + 1)
    } else {
      text = text.replace(/```json/g, '').replace(/```/g, '').trim()
    }

    const parsed = JSON.parse(text)
    res.json({
      thrust_area: mapThrustArea(parsed.thrust_area || thrust_area),
      title: parsed.title || title || '',
      description: parsed.description || description || '',
      uom: parsed.uom || 'percent_min',
      target: parsed.target !== undefined ? parsed.target : 100,
      weightage: parsed.weightage !== undefined ? parseInt(parsed.weightage) : 15
    })

  } catch (err) {
    console.error('[AI Copilot Catch Error]:', err.message)
    res.json(runFallback())
  }
})


// GET /api/goals — employee sees their own; manager sees direct reports; admin sees all
router.get('/', auth, async (req, res) => {
  try {
    const cycleYear = parseInt(req.query.cycle_year || req.query.year || getCurrentYear())
    let rows

    // If requesting a specific employee's goals (Manager/Admin check)
    if (req.query.employee_id && (req.user.role === 'manager' || req.user.role === 'admin')) {
      const targetEmployeeId = parseInt(req.query.employee_id)
      
      if (req.user.role !== 'admin') {
        // Verify manager-employee reporting relationship
        const { rows: reportRows } = await db.query(
          'SELECT id FROM users WHERE id = $1 AND manager_id = $2',
          [targetEmployeeId, req.user.id]
        )
        if (reportRows.length === 0) {
          return res.status(403).json({ 
            error: 'Forbidden', 
            message: 'You can only view goals of your direct reports' 
          })
        }
      }
      rows = await getEmployeeGoals(targetEmployeeId, cycleYear)

    } else if (req.user.role === 'employee' || req.user.role === 'manager' || req.user.role === 'admin') {
      // Return the logged-in user's own goals (including Admins visiting their own Goals page)
      rows = await getEmployeeGoals(req.user.id, cycleYear)

    } else {
      rows = []
    }

    res.json(rows)
  } catch (err) {
    console.error('Fetch goals error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/goals — create a new goal (employee and manager)
router.post('/', auth, authorize('employee', 'manager', 'admin'), async (req, res) => {
  try {
    const { thrust_area, title, description, uom, target, deadline, weightage } = req.body
    const cycleYear = getCurrentYear()

    // Mandatory fields
    if (!thrust_area || !title || !uom || weightage == null) {
      return res.status(400).json({ error: 'thrust_area, title, uom, and weightage are required' })
    }

    // UoM type constraint check
    const validUoms = ['numeric_min', 'numeric_max', 'percent_min', 'percent_max', 'timeline', 'zero']
    if (!validUoms.includes(uom)) {
      return res.status(400).json({ error: 'Invalid UoM type' })
    }

    if (uom === 'timeline' && !deadline) {
      return res.status(400).json({ error: 'Deadline required for Timeline UoM' })
    }

    const existing = await getEmployeeGoals(req.user.id, cycleYear)

    // Lock status check: block modifications if goal sheet is fully approved/pending and sums to 100%
    const totalWeight = existing.reduce((sum, g) => sum + Number(g.weightage), 0)
    const isSheetFullyLocked = Math.round(totalWeight) === 100 && existing.length > 0 && existing.every(g => g.status === 'approved' || g.status === 'pending')
    if (isSheetFullyLocked) {
      return res.status(403).json({ 
        error: 'Locked Sheet', 
        message: 'Goal sheet is locked. Approved or pending sheets cannot be modified.' 
      })
    }

    // Perform BRD validations (requireExact100 = false during draft creation)
    const parsedWeight = parseFloat(weightage)
    const errs = validateGoals(existing, { weightage: parsedWeight }, null, false)
    if (errs.length) {
      return res.status(422).json({ errors: errs })
    }

    const { rows } = await db.query(
      `INSERT INTO goals
         (employee_id, thrust_area, title, description, uom, target, deadline, weightage, status, cycle_year)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', $9)
       RETURNING *`,
      [
        req.user.id, 
        thrust_area, 
        title, 
        description || null, 
        uom,
        target !== undefined ? target : null, 
        deadline || null, 
        parsedWeight, 
        cycleYear
      ]
    )

    await logAudit(req.user.id, rows[0].id, 'GOAL_CREATED', null, rows[0])
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Create goal error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/goals/:id — update a goal (draft/returned only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    const { rows: existing } = await db.query('SELECT * FROM goals WHERE id = $1', [id])
    const goal = existing[0]
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' })
    }

    const isEmployeeOrManager = req.user.role === 'employee' || req.user.role === 'manager' || req.user.role === 'admin'

    // Ownership & authorization check
    if (isEmployeeOrManager) {
      if (goal.employee_id !== req.user.id) {
        return res.status(403).json({ error: 'Not your goal' })
      }
      if (goal.locked || goal.status === 'approved' || goal.status === 'pending') {
        return res.status(403).json({ error: 'Goal is locked' })
      }
      if (!['draft', 'returned'].includes(goal.status)) {
        return res.status(403).json({ error: 'Only draft or returned goals can be edited' })
      }
    }

    const { thrust_area, title, description, uom, target, deadline, weightage } = req.body

    // Enforce Shared goal read-only fields for employees/managers (Title & Target are immutable)
    if (goal.is_shared && isEmployeeOrManager) {
      if (title !== undefined && title !== goal.title) {
        return res.status(400).json({ error: 'Title of a shared goal is read-only for employees' })
      }
      if (target !== undefined && target !== (goal.target !== null ? Number(goal.target) : null)) {
        return res.status(400).json({ error: 'Target of a shared goal is read-only for employees' })
      }
    }

    // Validate weightage allocations if updating
    if (weightage != null && isEmployeeOrManager) {
      const allGoals = await getEmployeeGoals(goal.employee_id, goal.cycle_year)
      const errs = validateGoals(allGoals, { weightage: parseFloat(weightage) }, parseInt(id), false)
      if (errs.length) {
        return res.status(422).json({ errors: errs })
      }
    }

    const { rows } = await db.query(
      `UPDATE goals SET
         thrust_area = COALESCE($1, thrust_area),
         title       = COALESCE($2, title),
         description = COALESCE($3, description),
         uom         = COALESCE($4, uom),
         target      = COALESCE($5, target),
         deadline    = COALESCE($6, deadline),
         weightage   = COALESCE($7, weightage),
         updated_at  = NOW()
       WHERE id = $8 RETURNING *`,
      [
        thrust_area !== undefined ? thrust_area : null, 
        title !== undefined ? title : null, 
        description !== undefined ? description : null, 
        uom !== undefined ? uom : null, 
        target !== undefined ? target : null, 
        deadline !== undefined ? deadline : null,
        weightage !== undefined && weightage !== null ? parseFloat(weightage) : null, 
        id
      ]
    )

    await logAudit(req.user.id, parseInt(id), 'GOAL_UPDATED', goal, rows[0])
    res.json(rows[0])
  } catch (err) {
    console.error('Update goal error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /api/goals/:id — delete a draft goal (employee and manager)
router.delete('/:id', auth, authorize('employee', 'manager', 'admin'), async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM goals WHERE id = $1', [req.params.id])
    const goal = rows[0]
    
    if (!goal) return res.status(404).json({ error: 'Goal not found' })
    if (goal.employee_id !== req.user.id) return res.status(403).json({ error: 'Not your goal' })
    if (goal.status === 'approved' || goal.status === 'pending') {
      return res.status(403).json({ error: 'Cannot delete locked or pending goals' })
    }
    if (!['draft', 'returned'].includes(goal.status)) {
      return res.status(403).json({ error: 'Only draft/returned goals can be deleted' })
    }

    // Use a transaction or sequential queries to clear referencing rows
    await db.query('DELETE FROM achievements WHERE goal_id = $1', [req.params.id])
    await db.query('UPDATE audit_log SET goal_id = NULL WHERE goal_id = $1', [req.params.id])
    await db.query('DELETE FROM goals WHERE id = $1', [req.params.id])
    
    await logAudit(req.user.id, null, 'GOAL_DELETED', goal, null)
    res.json({ success: true, ok: true })
  } catch (err) {
    console.error('Delete goal error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/goals/submit — employee or manager submits all draft goals (whole sheet)
router.post('/submit', auth, authorize('employee', 'manager', 'admin'), async (req, res) => {
  try {
    const cycleYear = getCurrentYear()
    const goals = await getEmployeeGoals(req.user.id, cycleYear)
    const draftGoals = goals.filter(g => ['draft', 'returned'].includes(g.status))

    if (!draftGoals.length) {
      return res.status(400).json({ error: 'No draft goals to submit' })
    }

    // Final BRD checks (requires exact 100% total weightage, all weights >= 10%)
    const errs = validateGoals(goals, null, null, true)
    if (errs.length) {
      return res.status(422).json({ errors: errs })
    }

    // Update state - auto-approve if admin
    const targetStatus = req.user.role === 'admin' ? 'approved' : 'pending'
    await db.query(
      `UPDATE goals 
       SET status = $3, locked = true, updated_at = NOW()
       WHERE employee_id = $1 AND cycle_year = $2 AND status IN ('draft', 'returned')`,
      [req.user.id, cycleYear, targetStatus]
    )

    if (req.user.role === 'admin') {
      await logAudit(req.user.id, null, 'GOALS_APPROVED', null, { count: draftGoals.length, autoApproved: true })
    } else {
      await logAudit(req.user.id, null, 'GOALS_SUBMITTED', null, { count: draftGoals.length })
      
      // Send email notification to manager
      const userRes = await db.query(
        `SELECT u.name as employee_name, m.email as manager_email, m.name as manager_name
         FROM users u
         LEFT JOIN users m ON u.manager_id = m.id
         WHERE u.id = $1`,
        [req.user.id]
      )
      if (userRes.rows[0] && userRes.rows[0].manager_email) {
        const { employee_name, manager_email, manager_name } = userRes.rows[0]
        require('../services/mailer').notifyGoalSubmitted(manager_email, manager_name, employee_name).catch(console.error)
      }
    }

    res.json({ success: true, ok: true, submitted: draftGoals.length, autoApproved: req.user.role === 'admin' })
  } catch (err) {
    console.error('Submit goals error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── Sheet / Manager routes ────────────────────────────────────────────────────────────

// POST /api/goals/approve — approve the entire sheet for an employee
router.post('/approve', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { employee_id, cycle_year } = req.body
    const targetEmployeeId = parseInt(employee_id)
    const cycleYear = parseInt(cycle_year || getCurrentYear())

    if (!targetEmployeeId) {
      return res.status(400).json({ error: 'employee_id is required' })
    }

    if (req.user.role !== 'admin') {
      const { rows: reportRows } = await db.query(
        'SELECT id FROM users WHERE id = $1 AND manager_id = $2',
        [targetEmployeeId, req.user.id]
      )
      if (reportRows.length === 0) {
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: 'You can only approve goal sheets of your direct reports' 
        })
      }
    }

    // Check if employee has goals
    const { rows: goals } = await db.query(
      'SELECT id, status FROM goals WHERE employee_id = $1 AND cycle_year = $2',
      [targetEmployeeId, cycleYear]
    )

    if (goals.length === 0) {
      return res.status(400).json({ error: 'Employee has no goals to approve.' })
    }

    await db.query(
      "UPDATE goals SET status = 'approved', locked = true, updated_at = NOW() WHERE employee_id = $1 AND cycle_year = $2",
      [targetEmployeeId, cycleYear]
    )

    await logAudit(req.user.id, null, 'GOALS_APPROVED', null, { employee_id: targetEmployeeId, cycle_year: cycleYear })

    // Send email notification to employee
    const userRes = await db.query('SELECT name, email FROM users WHERE id = $1', [targetEmployeeId])
    if (userRes.rows[0]) {
      require('../services/mailer').notifyGoalApproved(userRes.rows[0].email, userRes.rows[0].name, req.user.name).catch(console.error)
    }

    res.json({ success: true, ok: true })
  } catch (err) {
    console.error('Approve sheet error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/goals/return — return the entire sheet for revisions
router.post('/return', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { employee_id, cycle_year, comment } = req.body
    const targetEmployeeId = parseInt(employee_id)
    const cycleYear = parseInt(cycle_year || getCurrentYear())

    if (!targetEmployeeId) {
      return res.status(400).json({ error: 'employee_id is required' })
    }

    if (req.user.role !== 'admin') {
      const { rows: reportRows } = await db.query(
        'SELECT id FROM users WHERE id = $1 AND manager_id = $2',
        [targetEmployeeId, req.user.id]
      )
      if (reportRows.length === 0) {
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: 'You can only return goal sheets of your direct reports' 
        })
      }
    }

    // Check if employee has goals
    const { rows: goals } = await db.query(
      'SELECT id FROM goals WHERE employee_id = $1 AND cycle_year = $2',
      [targetEmployeeId, cycleYear]
    )

    if (goals.length === 0) {
      return res.status(400).json({ error: 'Employee has no goals to return.' })
    }

    await db.query(
      "UPDATE goals SET status = 'returned', locked = false, updated_at = NOW() WHERE employee_id = $1 AND cycle_year = $2",
      [targetEmployeeId, cycleYear]
    )

    // Store return feedback comment in checkins table for employee to view
    if (comment && comment.trim() !== '') {
      await db.query(
        "INSERT INTO checkins (employee_id, manager_id, quarter, comment) VALUES ($1, $2, $3, $4)",
        [targetEmployeeId, req.user.id, 'REVISION', comment.trim()]
      )
    }

    await logAudit(req.user.id, null, 'GOALS_RETURNED', null, { employee_id: targetEmployeeId, cycle_year: cycleYear, comment })

    // Send email notification to employee
    const userRes = await db.query('SELECT name, email FROM users WHERE id = $1', [targetEmployeeId])
    if (userRes.rows[0]) {
      require('../services/mailer').notifyGoalReturned(userRes.rows[0].email, userRes.rows[0].name, req.user.name, comment).catch(console.error)
    }

    res.json({ success: true, ok: true })
  } catch (err) {
    console.error('Return sheet error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── Individual Goal Manager actions ──────────────────────────────────────────

// POST /api/goals/:id/approve — individual goal approval (with inline edits)
router.post('/:id/approve', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT g.*, u.manager_id FROM goals g JOIN users u ON u.id = g.employee_id WHERE g.id = $1`,
      [req.params.id]
    )
    const goal = rows[0]
    
    if (!goal) return res.status(404).json({ error: 'Goal not found' })
    if (req.user.role === 'manager' && goal.manager_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your team member' })
    }
    if (goal.status !== 'pending' && goal.status !== 'submitted') {
      return res.status(400).json({ error: 'Goal must be in pending/submitted state' })
    }

    // Support inline edits from manager
    const { target, weightage } = req.body

    const { rows: updated } = await db.query(
      `UPDATE goals SET
         status    = 'approved',
         locked    = true,
         target    = COALESCE($1, target),
         weightage = COALESCE($2, weightage),
         updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [target !== undefined ? target : null, weightage ? parseFloat(weightage) : null, req.params.id]
    )

    await logAudit(req.user.id, parseInt(req.params.id), 'GOAL_APPROVED', goal, updated[0])
    res.json(updated[0])
  } catch (err) {
    console.error('Approve goal error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/goals/:id/return — individual goal return (with rework comment)
router.post('/:id/return', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { comment } = req.body
    const { rows } = await db.query(
      `SELECT g.*, u.manager_id FROM goals g JOIN users u ON u.id = g.employee_id WHERE g.id = $1`,
      [req.params.id]
    )
    const goal = rows[0]

    if (!goal) return res.status(404).json({ error: 'Goal not found' })
    if (req.user.role === 'manager' && goal.manager_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your team member' })
    }

    const { rows: updated } = await db.query(
      `UPDATE goals SET status = 'returned', locked = false, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    )

    // Store in audit logs & comments
    if (comment && comment.trim() !== '') {
      await db.query(
        "INSERT INTO checkins (employee_id, manager_id, quarter, comment) VALUES ($1, $2, $3, $4)",
        [goal.employee_id, req.user.id, 'REVISION', comment.trim()]
      )
    }

    await logAudit(req.user.id, parseInt(req.params.id), 'GOAL_RETURNED', goal, { ...updated[0], manager_comment: comment })
    res.json(updated[0])
  } catch (err) {
    console.error('Return goal error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── Shared Goals — Push to Team ──────────────────────────────────────────────

// POST /api/goals/:id/push — push a goal as a shared KPI to selected employees
router.post('/:id/push', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const masterGoalId = parseInt(req.params.id)
    const { employee_ids } = req.body // array of employee IDs to push to

    if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
      return res.status(400).json({ error: 'employee_ids array is required' })
    }

    // Fetch the master goal
    const { rows: goalRows } = await db.query('SELECT * FROM goals WHERE id = $1', [masterGoalId])
    const masterGoal = goalRows[0]
    if (!masterGoal) {
      return res.status(404).json({ error: 'Source goal not found' })
    }

    // Verify ownership: manager must own this goal OR be admin
    if (req.user.role === 'manager' && masterGoal.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only push your own goals as shared KPIs' })
    }

    // For managers, verify all target employees are direct reports
    if (req.user.role === 'manager') {
      const { rows: reports } = await db.query(
        'SELECT id FROM users WHERE manager_id = $1 AND id = ANY($2::int[])',
        [req.user.id, employee_ids]
      )
      if (reports.length !== employee_ids.length) {
        return res.status(403).json({ error: 'You can only push goals to your direct reports' })
      }
    }

    const pushed = []
    for (const empId of employee_ids) {
      // Check if this employee already has this shared goal
      const { rows: existing } = await db.query(
        'SELECT id FROM goals WHERE employee_id = $1 AND shared_from_id = $2',
        [empId, masterGoalId]
      )
      if (existing.length > 0) continue // skip duplicates

      // Check max 8 goals constraint
      const { rows: countRows } = await db.query(
        'SELECT COUNT(*)::int as cnt FROM goals WHERE employee_id = $1 AND cycle_year = $2',
        [empId, masterGoal.cycle_year]
      )
      if (countRows[0].cnt >= 8) continue // skip if employee already at max

      // Insert the shared goal — Title, Target, UoM, Thrust Area are inherited (read-only for employee)
      const { rows: inserted } = await db.query(
        `INSERT INTO goals (employee_id, thrust_area, title, description, uom, target, deadline, weightage, status, locked, cycle_year, is_shared, shared_from_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved', true, $9, true, $10)
         RETURNING *`,
        [
          empId,
          masterGoal.thrust_area,
          masterGoal.title,
          masterGoal.description,
          masterGoal.uom,
          masterGoal.target,
          masterGoal.deadline,
          10, // default weightage of 10%; employee can adjust
          masterGoal.cycle_year,
          masterGoalId,
        ]
      )
      pushed.push(inserted[0])
    }

    await logAudit(req.user.id, masterGoalId, 'GOAL_PUSHED_TO_TEAM', null, {
      master_goal_id: masterGoalId,
      pushed_to: employee_ids,
      pushed_count: pushed.length,
    })

    res.status(201).json({ success: true, pushed_count: pushed.length, goals: pushed })
  } catch (err) {
    console.error('Push goal error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
