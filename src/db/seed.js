/**
 * seed.js — CFO User Seeder
 *
 * Seeds the database with the CFO (Chief Financial Officer) user.
 * The CFO is the top-level approver in the reimbursement pipeline and
 * must exist before any reimbursement can reach final approval.
 *
 * IDEMPOTENT: checks if the CFO email already exists before inserting,
 * so this script is safe to run multiple times.
 *
 * Usage:  npm run db:seed-data
 *         (or)  node src/db/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { eq } = require('drizzle-orm');
const { db, pool } = require('../config/database');
const { users } = require('./schema');

// ── CFO credentials ────────────────────────────────────────────────────────
const CFO_NAME     = 'Chief Financial Officer';
const CFO_EMAIL    = 'cfo@org.com';
const CFO_PASSWORD = 'CFO#ORG@April2026';
const CFO_ROLE     = 'CFO';
const SALT_ROUNDS  = 10;

async function seed() {
  // Step 1: Check if CFO already exists (by email — has UNIQUE constraint).
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, CFO_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    console.log('CFO already exists');
    await pool.end();
    return;
  }

  // Step 2: Hash the password with bcrypt (10 salt rounds).
  const passwordHash = await bcrypt.hash(CFO_PASSWORD, SALT_ROUNDS);

  // Step 3: Insert the CFO user.
  await db.insert(users).values({
    name: CFO_NAME,
    email: CFO_EMAIL,
    passwordHash: passwordHash,
    role: CFO_ROLE,
  });

  console.log('CFO seeded');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
