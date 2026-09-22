const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://agri_db_admin_user:zethon123$@agri-prod-database.cr262csoswwh.ap-south-2.rds.amazonaws.com:5432/agri?ssl=true',
});

async function run() {
  await client.connect();

  // Set search path
  await client.query('SET search_path TO "agri-common";');

  const res = await client.query('SELECT user_id, full_name, phone_number, role, email FROM users ORDER BY created_at DESC LIMIT 50');
  console.table(res.rows);

  await client.end();
}

run().catch(console.error);
