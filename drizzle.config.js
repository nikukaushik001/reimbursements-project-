/**
 * drizzle.config.js — Drizzle Kit Configuration
 *
 * Configures the `drizzle-kit` CLI tool:
 *   npx drizzle-kit generate   → generate SQL migration files from schema diffs
 *   npx drizzle-kit migrate    → apply pending migrations to the database
 *   npx drizzle-kit studio     → open Drizzle Studio (GUI database browser)
 *   npx drizzle-kit push       → push schema directly (dev only, skips migrations)
 */

require('dotenv').config();
const { defineConfig } = require('drizzle-kit');

module.exports = defineConfig({
  // Path to the schema definition file.
  schema: './src/db/schema.js',

  // Directory where generated SQL migration files are stored.
  out: './src/db/migrations',

  // Database dialect.
  dialect: 'postgresql',

  // Connection — single DATABASE_URL string from .env
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },

  // Enable verbose logging during migration generation.
  verbose: true,

  // Require explicit confirmation before applying destructive changes.
  strict: true,
});
