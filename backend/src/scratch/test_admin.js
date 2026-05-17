const http = require('http')
const jwt = require('jsonwebtoken')
const { Client } = require('pg')
require('dotenv').config()

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_this'
const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL not set in environment.')
  process.exit(1)
}

// Generate test tokens
const adminToken = jwt.sign({ id: 1, role: 'admin', name: 'System Admin' }, JWT_SECRET, { expiresIn: '1h' })
const employeeToken = jwt.sign({ id: 3, role: 'employee', name: 'John Employee' }, JWT_SECRET, { expiresIn: '1h' })

// Helper for making local HTTP requests
function apiRequest(method, path, token = null, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    }

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        const isJson = res.headers['content-type'] && res.headers['content-type'].includes('application/json')
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: isJson ? JSON.parse(data || '{}') : data
        })
      })
    })

    req.on('error', reject)
    if (body) {
      req.write(JSON.stringify(body))
    }
    req.end()
  })
}

async function runTests() {
  console.log('🚀 INITIALIZING PHASE 5 INTEGRATION TEST SUITE\n')
  
  const client = new Client({ connectionString: dbUrl })
  await client.connect()
  
  let passed = 0
  let failed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`)
      passed++
    } else {
      console.error(`❌ [FAIL] ${message}`)
      failed++
    }
  }

  try {
    // ----------------------------------------------------
    // Scenario 1: Security Validation (Anonymous Block)
    // ----------------------------------------------------
    console.log('--- TEST CASE 1: Anonymous Authorization Shield')
    const resAnon = await apiRequest('GET', '/api/admin/users')
    assert(resAnon.statusCode === 401, 'Anonymous request gets blocked with 401 Unauthorized')
    
    // ----------------------------------------------------
    // Scenario 2: Role Authorization (Employee Exclusion)
    // ----------------------------------------------------
    console.log('\n--- TEST CASE 2: Role-Based Authorization Guard')
    const resEmp = await apiRequest('GET', '/api/admin/users', employeeToken)
    assert(resEmp.statusCode === 403, 'Employee request gets blocked with 403 Forbidden')

    // ----------------------------------------------------
    // Scenario 3: Admin User Directory List
    // ----------------------------------------------------
    console.log('\n--- TEST CASE 3: Admin Roster Directory Query')
    const resUsers = await apiRequest('GET', '/api/admin/users', adminToken)
    assert(resUsers.statusCode === 200, 'Admin request successfully logs in with 200 OK')
    assert(Array.isArray(resUsers.body), 'Response body is a valid JSON array')
    assert(resUsers.body.length > 0, `Active roster lists ${resUsers.body.length} users successfully`)

    // ----------------------------------------------------
    // Scenario 4: Create User Profile
    // ----------------------------------------------------
    console.log('\n--- TEST CASE 4: Create New User Account')
    const testEmail = `test_engineer_${Date.now()}@acme.com`
    const newUserObj = {
      name: 'Test Engineer',
      email: testEmail,
      password: 'SecurePass123!',
      role: 'employee',
      manager_id: 2,
      department: 'Engineering'
    }
    const resCreate = await apiRequest('POST', '/api/admin/users', adminToken, newUserObj)
    assert(resCreate.statusCode === 201, 'Creates new profile with 201 Created status')
    assert(resCreate.body.email === testEmail, 'Normalized email matches registration details')
    assert(resCreate.body.id !== undefined, 'Returns generated user ID row')

    // Clean up created user from database
    await client.query('DELETE FROM users WHERE email = $1', [testEmail])
    console.log('   (Cleaned up created test user from database)')

    // ----------------------------------------------------
    // Scenario 5: Manual Goal Override and Unlock
    // ----------------------------------------------------
    console.log('\n--- TEST CASE 5: Appraisal Lock Override Tool')
    // Seed a locked goal in the database
    const seedGoalRes = await client.query(
      `INSERT INTO goals (employee_id, thrust_area, title, uom, target, weightage, locked, status)
       VALUES (3, 'Testing', 'Verification target', 'numeric_max', 100, 20, true, 'approved')
       RETURNING id`
    )
    const testGoalId = seedGoalRes.rows[0].id
    console.log(`   (Seeded locked goal with ID: ${testGoalId})`)

    const resUnlock = await apiRequest('PATCH', `/api/admin/goals/${testGoalId}/unlock`, adminToken)
    assert(resUnlock.statusCode === 200, 'Unlocks goal sheet successfully with 200 OK')
    assert(resUnlock.body.success === true, 'Response body shows success flag as true')

    // Verify unlocked state in the database
    const dbGoalRes = await client.query('SELECT locked, status FROM goals WHERE id = $1', [testGoalId])
    assert(dbGoalRes.rows[0].locked === false, 'Database locked flag successfully reset to false')
    assert(dbGoalRes.rows[0].status === 'draft', "Database status successfully returned to 'draft'")

    // Verify audit log has been written
    const dbAuditRes = await client.query('SELECT action, old_value, new_value FROM audit_log WHERE goal_id = $1', [testGoalId])
    assert(dbAuditRes.rowCount > 0, 'Audit log correctly inserted a new entry')
    assert(dbAuditRes.rows[0].action === 'UNLOCK_GOAL', 'Audit action field registers UNLOCK_GOAL correctly')

    // Clean up seeded goal and audit log
    await client.query('DELETE FROM audit_log WHERE goal_id = $1', [testGoalId])
    await client.query('DELETE FROM goals WHERE id = $1', [testGoalId])
    console.log('   (Cleaned up seeded goal and audit records from database)')

    // ----------------------------------------------------
    // Scenario 6: Comparative Performance & Achievement Reports
    // ----------------------------------------------------
    console.log('\n--- TEST CASE 6: Planned vs Actual Achievements JSON Report')
    const resReportAch = await apiRequest('GET', '/api/admin/report/achievement', adminToken)
    assert(resReportAch.statusCode === 200, 'Retrieves achievements comparison matrix successfully with 200 OK')
    assert(Array.isArray(resReportAch.body), 'Report payload is a valid JSON array')

    // ----------------------------------------------------
    // Scenario 7: CSV Spreadsheet Export
    // ----------------------------------------------------
    console.log('\n--- TEST CASE 7: Compliance Excel/CSV Spreadsheet Export')
    const resExport = await apiRequest('GET', '/api/admin/report/achievement/export', adminToken)
    assert(resExport.statusCode === 200, 'Exports achievements data successfully with 200 OK')
    assert(resExport.headers['content-type'].includes('text/csv'), 'Content-Type header matches text/csv')
    assert(resExport.body.includes('Employee Name'), 'CSV includes Employee Name column header')
    assert(resExport.body.includes('Planned Target'), 'CSV includes Planned Target column header')

    // ----------------------------------------------------
    // Scenario 8: Continuous Check-in Completion Report
    // ----------------------------------------------------
    console.log('\n--- TEST CASE 8: Quarter Completion Rate Audit')
    const resReportComp = await apiRequest('GET', '/api/admin/report/completion', adminToken)
    assert(resReportComp.statusCode === 200, 'Retrieves completion stats successfully with 200 OK')
    assert(Array.isArray(resReportComp.body), 'Completion payload is a valid JSON array')
    if (resReportComp.body.length > 0) {
      const entry = resReportComp.body[0]
      assert(entry.employee_name !== undefined, 'Completion rows list employee_name')
      assert(entry.manager_submitted !== undefined, 'Completion rows list manager_submitted status')
      assert(entry.logged_actuals_count !== undefined, 'Completion rows count employee logged_actuals')
    }

    // ----------------------------------------------------
    // Scenario 9: Audit Logs joined with User Profile Details
    // ----------------------------------------------------
    console.log('\n--- TEST CASE 9: Joined Performance Audit Stream')
    const resAudit = await apiRequest('GET', '/api/admin/audit', adminToken)
    assert(resAudit.statusCode === 200, 'Retrieves centralized audit logs successfully with 200 OK')
    assert(Array.isArray(resAudit.body), 'Audit payload is a valid JSON array')

  } catch (err) {
    console.error('❌ Crash in test suite execution:', err)
    failed++
  } finally {
    await client.end()
    console.log('\n=============================================')
    console.log(`TEST RUN COMPLETED: ${passed} PASSED | ${failed} FAILED`)
    console.log('=============================================')
    if (failed > 0) {
      process.exit(1)
    }
  }
}

runTests()
