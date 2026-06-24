/**
 * database.js — PostgreSQL + Drizzle ORM Configuration
 *
 * Creates a pg connection pool using DATABASE_URL and wraps it with
 * Drizzle ORM.
 *
 * Exports:
 *   db   — Drizzle instance for all ORM queries
 *   pool — raw pg Pool for direct SQL or graceful shutdown
 *
 * Usage:
 *   const { db } = require('../config/database');
 *   const allUsers = await db.select().from(users);
 */

require('dotenv').config();
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require('../db/schema');

// ── Connection Pool ────────────────────────────────────────────────────────
// Uses a single DATABASE_URL connection string from environment.
// SSL is required for Supabase pooler connections.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ── Drizzle Instance ───────────────────────────────────────────────────────
// Passing the full schema enables Drizzle's relational query API
// (db.query.users.findMany(), etc.) alongside the standard SQL-like API.
const db = drizzle(pool, { schema });

module.exports = { db, pool };
