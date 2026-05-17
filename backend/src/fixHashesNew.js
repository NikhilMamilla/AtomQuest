const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

async function fix() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log("Connected to Neon DB successfully.");
  const res = await client.query(
    "UPDATE users SET password_hash = '$2b$10$N1PxlNiPzkrHWnYbsOdHaOCPFb2aA6L/zwxFxsj9P5C9Ka4JiWzz6'"
  );
  console.log(`Updated ${res.rowCount} users with the new secure hash.`);
  await client.end();
}

fix().catch(console.error);
