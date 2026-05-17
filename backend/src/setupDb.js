const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Error: DATABASE_URL is not set in .env file.");
  process.exit(1);
}

async function runSetup() {
  // Parse database name from the connection string
  const match = connectionString.match(/\/([^/?]+)(\?.*)?$/);
  const dbName = match ? match[1] : 'atomquest';
  
  // Connection string for the default 'postgres' database to check/create the target database
  const defaultConnectionString = connectionString.replace(/\/([^/?]+)(\?.*)?$/, '/postgres$2');
  
  console.log(`Step 1: Checking/Creating database '${dbName}' on the PostgreSQL server...`);
  const initClient = new Client({ connectionString: defaultConnectionString });
  try {
    await initClient.connect();
    const res = await initClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rowCount === 0) {
      console.log(`Database '${dbName}' does not exist. Creating database...`);
      await initClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database '${dbName}' created successfully.`);
    } else {
      console.log(`Database '${dbName}' already exists.`);
    }
  } catch (err) {
    console.warn(`[Note] Could not verify/create database via default connection: ${err.message}`);
    console.warn(`Proceeding with direct connection to '${dbName}'...`);
  } finally {
    try {
      await initClient.end();
    } catch (_) {}
  }

  // Connect to target database
  console.log(`\nStep 2: Connecting to target database '${dbName}'...`);
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected successfully.");
  } catch (err) {
    console.error(`\n[Database Connection Error]`);
    console.error(`Failed to connect to the database using: ${connectionString}`);
    console.error(`Please verify that:`);
    console.error(`1. PostgreSQL is installed and running on your system.`);
    console.error(`2. The credentials (username, password, port) in backend/.env are correct.`);
    console.error(`Error details: ${err.message}`);
    process.exit(1);
  }

  try {
    console.log("\nStep 3: Creating tables (if they do not already exist)...");
    
    const tables = [
      {
        name: 'users',
        query: `CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(150) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role VARCHAR(20) CHECK (role IN ('employee','manager','admin')) NOT NULL,
          manager_id INTEGER REFERENCES users(id),
          department VARCHAR(100),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );`
      },
      {
        name: 'goals',
        query: `CREATE TABLE IF NOT EXISTS goals (
          id SERIAL PRIMARY KEY,
          employee_id INTEGER REFERENCES users(id) NOT NULL,
          thrust_area VARCHAR(100) NOT NULL,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          uom VARCHAR(30) NOT NULL,
          target NUMERIC,
          deadline DATE,
          weightage NUMERIC NOT NULL,
          status VARCHAR(30) DEFAULT 'draft',
          is_shared BOOLEAN DEFAULT FALSE,
          shared_from_id INTEGER REFERENCES goals(id),
          locked BOOLEAN DEFAULT FALSE,
          cycle_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );`
      },
      {
        name: 'achievements',
        query: `CREATE TABLE IF NOT EXISTS achievements (
          id SERIAL PRIMARY KEY,
          goal_id INTEGER REFERENCES goals(id) NOT NULL,
          quarter VARCHAR(10) NOT NULL,
          actual NUMERIC,
          completion_date DATE,
          progress_status VARCHAR(20) DEFAULT 'not_started',
          score NUMERIC,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );`
      },
      {
        name: 'checkins',
        query: `CREATE TABLE IF NOT EXISTS checkins (
          id SERIAL PRIMARY KEY,
          employee_id INTEGER REFERENCES users(id) NOT NULL,
          manager_id INTEGER REFERENCES users(id) NOT NULL,
          quarter VARCHAR(10) NOT NULL,
          comment TEXT,
          sender_id INTEGER REFERENCES users(id),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );`
      },
      {
        name: 'audit_log',
        query: `CREATE TABLE IF NOT EXISTS audit_log (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          goal_id INTEGER REFERENCES goals(id),
          action VARCHAR(100) NOT NULL,
          old_value JSONB,
          new_value JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );`
      },
      {
        name: 'escalation_rules',
        query: `CREATE TABLE IF NOT EXISTS escalation_rules (
          id SERIAL PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          trigger_type VARCHAR(50) NOT NULL,
          threshold_days INTEGER NOT NULL DEFAULT 7,
          action VARCHAR(50) NOT NULL DEFAULT 'notify',
          is_active BOOLEAN DEFAULT TRUE,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );`
      },
      {
        name: 'escalation_log',
        query: `CREATE TABLE IF NOT EXISTS escalation_log (
          id SERIAL PRIMARY KEY,
          rule_id INTEGER REFERENCES escalation_rules(id),
          employee_id INTEGER REFERENCES users(id),
          manager_id INTEGER REFERENCES users(id),
          trigger_type VARCHAR(50) NOT NULL,
          message TEXT,
          resolved BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );`
      }
    ];

    for (let table of tables) {
      await client.query(table.query);
      console.log(`- Table '${table.name}' created/verified.`);
    }

    console.log("- Making sure 'sender_id' column exists in checkins table...");
    await client.query("ALTER TABLE checkins ADD COLUMN IF NOT EXISTS sender_id INTEGER REFERENCES users(id)");

    console.log("\nStep 4: Cleaning up legacy acme.com accounts and seeding demo users...");
    // Purge legacy acme.com accounts to keep the system clean
    await client.query("DELETE FROM users WHERE email LIKE '%@acme.com'");

    const usersSeed = [
      { name: 'Nikhil', email: 'nikhil@atomquest.com', hash: '$2b$10$huKThAeC3VHfgezNsxcYw.jq3Bq8ACjGeHp4cAN66H3KfBOfWeHAG', role: 'admin' },
      { name: 'Hansika', email: 'hansika@atomquest.com', hash: '$2b$10$huKThAeC3VHfgezNsxcYw.jq3Bq8ACjGeHp4cAN66H3KfBOfWeHAG', role: 'manager' },
      { name: 'Sreemouna', email: 'sreemouna@atomquest.com', hash: '$2b$10$huKThAeC3VHfgezNsxcYw.jq3Bq8ACjGeHp4cAN66H3KfBOfWeHAG', role: 'employee' }
    ];

    for (let u of usersSeed) {
      const checkRes = await client.query('SELECT id FROM users WHERE email = $1', [u.email]);
      if (checkRes.rowCount === 0) {
        await client.query(
          'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
          [u.name, u.email, u.hash, u.role]
        );
        console.log(`- Seeded user: ${u.name} (${u.email})`);
      } else {
        await client.query(
          'UPDATE users SET name = $1, password_hash = $2 WHERE email = $3',
          [u.name, u.hash, u.email]
        );
        console.log(`- User already exists: ${u.email} (updated name to ${u.name} and password to secure hash)`);
      }
    }

    console.log("\nStep 5: Updating reporting relationships...");
    const managerRes = await client.query("SELECT id FROM users WHERE email = 'hansika@atomquest.com'");
    if (managerRes.rowCount > 0) {
      const managerId = managerRes.rows[0].id;
      const updateRes = await client.query(
        "UPDATE users SET manager_id = $1 WHERE email = 'sreemouna@atomquest.com' AND manager_id IS DISTINCT FROM $1",
        [managerId]
      );
      if (updateRes.rowCount > 0) {
        console.log("- Successfully linked Sreemouna to Hansika.");
      } else {
        console.log("- Reporting relationship already set up.");
      }
    } else {
      console.warn("- Warning: Could not find 'hansika@atomquest.com' to link employee to.");
    }

    console.log("\n=============================================");
    console.log("PostgreSQL Database Setup completed successfully!");
    console.log("=============================================");

  } catch (error) {
    console.error("\n[Error during schema setup]");
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSetup();
