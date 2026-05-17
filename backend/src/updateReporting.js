const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

async function runUpdate() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to database. Applying reporting hierarchy updates...");

    // 1. Update Nikhil (ADMIN)
    await client.query(
      "UPDATE users SET department = 'Executive Leadership', manager_id = NULL WHERE email = 'nikhil@atomquest.com'"
    );
    console.log("Updated Nikhil's department to 'Executive Leadership'.");

    // Get Nikhil's ID
    const nikhilRes = await client.query("SELECT id FROM users WHERE email = 'nikhil@atomquest.com'");
    if (nikhilRes.rowCount === 0) {
      throw new Error("Nikhil user not found.");
    }
    const nikhilId = nikhilRes.rows[0].id;

    // 2. Update Hansika (MANAGER) to report to Nikhil and have department 'Operations'
    await client.query(
      "UPDATE users SET department = 'Operations', manager_id = $1 WHERE email = 'hansika@atomquest.com'",
      [nikhilId]
    );
    console.log("Updated Hansika to report to Nikhil in 'Operations' department.");

    // Get Hansika's ID
    const hansikaRes = await client.query("SELECT id FROM users WHERE email = 'hansika@atomquest.com'");
    if (hansikaRes.rowCount === 0) {
      throw new Error("Hansika user not found.");
    }
    const hansikaId = hansikaRes.rows[0].id;

    // 3. Update Sreemouna (EMPLOYEE) to report to Hansika and have department 'Operations'
    await client.query(
      "UPDATE users SET department = 'Operations', manager_id = $1 WHERE email = 'sreemouna@atomquest.com'",
      [hansikaId]
    );
    console.log("Updated Sreemouna to report to Hansika in 'Operations' department.");

    console.log("\nAll reporting hierarchies and departments updated successfully!");
  } catch (err) {
    console.error("Error executing reporting updates:", err.message);
  } finally {
    await client.end();
  }
}

runUpdate();
