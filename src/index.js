/**
 * index.js — Server Entry Point
 *
 * Starts the Express server on the configured PORT and handles
 * graceful shutdown (closes the PostgreSQL connection pool on SIGTERM).
 *
 * Usage:
 *   npm start       → node src/index.js
 *   npm run dev     → nodemon src/index.js
 */

require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/database');

const PORT = process.env.PORT || 7002;

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`   API prefix: /rest`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

// ── Graceful Shutdown ──────────────────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await pool.end();
    console.log('Database pool closed. Goodbye! 👋');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
