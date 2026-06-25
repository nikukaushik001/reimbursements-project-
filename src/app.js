/**
 * app.js — Express Application Configuration
 *
 * Sets up all middleware, mounts routes under /rest, and attaches
 * the global error handler. Does NOT call app.listen() — that's
 * done in index.js so the app can be imported for testing.
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

// ── Route Modules ──────────────────────────────────────────────────────────
const onboardingRoutes    = require('./routes/onboarding.routes');
const roleRoutes          = require('./routes/role.routes');
const employeeRoutes      = require('./routes/employee.routes');
const reimbursementRoutes = require('./routes/reimbursement.routes');

// ── Middleware ──────────────────────────────────────────────────────────────
const { errorHandler } = require('./middleware/error.middleware');

// ── Create App ─────────────────────────────────────────────────────────────
const app = express();

// ── Global Middleware ──────────────────────────────────────────────────────
app.use(cors({
  origin: true,          // Allow all origins in dev; lock down in production
  credentials: true,     // Allow cookies to be sent with cross-origin requests
}));
app.use(express.json()); // Parse JSON request bodies
app.use(cookieParser());  // Parse cookies (for JWT auth)
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Serve receipts

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes (all under /rest) ───────────────────────────────────────────
app.use('/rest/onboardings',   onboardingRoutes);
app.use('/rest/roles',         roleRoutes);
app.use('/rest/employees',     employeeRoutes);
app.use('/rest/reimbursements', reimbursementRoutes);

// ── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ── Global Error Handler (must be last) ────────────────────────────────────
app.use(errorHandler);

module.exports = app;
