/**
 * run-migrate.js — Run Drizzle Migrations Programmatically
 *
 * Uses the same pg Pool configuration as the app (with SSL support).
 * Preferred over `drizzle-kit migrate` for Supabase connections.
 *
 * Usage:  node src/db/run-migrate.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const path = require('path');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const db = drizzle(pool);

  console.log('[migrate] Connecting to database...');

  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, 'migrations'),
  });

  console.log('[migrate] All migrations applied successfully. ✅');
  await pool.end();
}

main().catch((err) => {
  console.error('[migrate] Migration failed:', err.message);
  process.exit(1);
});
