/**
 * constants.js — Centralized Enums & Configuration
 *
 * Single source of truth for all magic strings used across the backend.
 * Import from here instead of scattering string literals in controllers/services.
 */

// ── User Roles ─────────────────────────────────────────────────────────────
const ROLES = Object.freeze({
  EMP: 'EMP',   // Employee — files reimbursement requests
  RM:  'RM',    // Reporting Manager — first-level approver
  APE: 'APE',   // Accounts Payable Executive — second-level approver
  CFO: 'CFO',   // Chief Financial Officer — final approver / admin
});

// ── Reimbursement Statuses ─────────────────────────────────────────────────
const STATUSES = Object.freeze({
  PENDING:  'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

// ── Auth Cookie ────────────────────────────────────────────────────────────
const COOKIE_NAME = 'token';

const COOKIE_OPTIONS = Object.freeze({
  httpOnly: true,                               // Not accessible via JS
  secure:   process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'strict',                           // CSRF protection
  maxAge:   24 * 60 * 60 * 1000,                // 1 day in milliseconds
  path:     '/',
});

// ── Allowed Email Domain ───────────────────────────────────────────────────
const ALLOWED_EMAIL_DOMAIN = 'org.com';

module.exports = {
  ROLES,
  STATUSES,
  COOKIE_NAME,
  COOKIE_OPTIONS,
  ALLOWED_EMAIL_DOMAIN,
};
