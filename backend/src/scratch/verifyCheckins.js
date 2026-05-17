require('dotenv').config();
const db = require('../db');

async function test() {
  try {
    console.log("Starting DB verification for Check-ins Comments Flow...");
    
    // 1. Get user IDs
    const { rows: users } = await db.query("SELECT id, name, role FROM users WHERE email IN ('sreemouna@atomquest.com', 'hansika@atomquest.com')");
    console.log("Users found in database:", users);
    
    const employee = users.find(u => u.role === 'employee');
    const manager = users.find(u => u.role === 'manager');
    
    if (!employee || !manager) {
      throw new Error("Seed users are missing! Please run setupDb.js first.");
    }
    
    // 2. Insert comment as manager
    console.log(`Inserting test comment as Manager (ID: ${manager.id}) for Employee (ID: ${employee.id})...`);
    const { rows: comment1 } = await db.query(
      "INSERT INTO checkins (employee_id, manager_id, sender_id, quarter, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [employee.id, manager.id, manager.id, 'Q1', 'Manager comment: Excellent draft objectives! Please proceed.']
    );
    console.log("Inserted Manager comment:", comment1[0]);

    // 3. Insert comment as employee
    console.log(`Inserting test comment as Employee (ID: ${employee.id}) to Manager (ID: ${manager.id})...`);
    const { rows: comment2 } = await db.query(
      "INSERT INTO checkins (employee_id, manager_id, sender_id, quarter, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [employee.id, manager.id, employee.id, 'Q1', 'Employee comment: Thank you! I will finalize the targets.']
    );
    console.log("Inserted Employee comment:", comment2[0]);

    // 4. Retrieve unified dialogue stream for employee
    console.log(`\nRetrieving unified dialogue stream for Employee Sreemouna (ID: ${employee.id})...`);
    const { rows: dialogueStream } = await db.query(
      `SELECT 
         c.id,
         c.quarter,
         c.comment,
         c.sender_id,
         CASE WHEN COALESCE(c.sender_id, c.manager_id) = c.employee_id THEN emp.name ELSE NULL END AS employee_name,
         CASE WHEN COALESCE(c.sender_id, c.manager_id) = c.manager_id THEN mng.name ELSE NULL END AS manager_name
       FROM checkins c
       JOIN users emp ON emp.id = c.employee_id
       JOIN users mng ON mng.id = c.manager_id
       WHERE c.employee_id = $1 OR c.manager_id = $1
       ORDER BY c.created_at ASC`,
      [employee.id]
    );
    console.log("Retrieved dialogue stream:\n", dialogueStream);

    // 5. Cleanup test entries
    console.log("\nCleaning up test comments...");
    await db.query("DELETE FROM checkins WHERE comment LIKE 'Manager comment:%' OR comment LIKE 'Employee comment:%'");
    console.log("Cleanup complete!");
    
    console.log("\n=================================");
    console.log("DB comments flow verification PASSED!");
    console.log("=================================");
  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    process.exit(0);
  }
}

test();
