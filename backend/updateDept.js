const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_u8bCyTfms9gN@ep-billowing-mountain-aqbio1qm.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require' });
async function run() {
  const res = await pool.query("UPDATE users SET department = 'Operations' WHERE name ILIKE '%Sreemouna%' RETURNING *");
  console.log(res.rows);
  pool.end();
}
run();
