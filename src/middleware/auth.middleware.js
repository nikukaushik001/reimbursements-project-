/**
 * auth.middleware.js — Authentication & Authorization
 *
 * Two middleware functions:
 *   1. authenticate  — Reads JWT from the auth cookie, verifies it, and
 *                       attaches { userId, role } to req.user.
 *   2. authorize      — Higher-order function: returns middleware that
 *                       checks if req.user.role is in the allowed list.
 */

const { verifyToken } = require('../utils/jwt.utils');
const { COOKIE_NAME } = require('../utils/constants');

// ── authenticate ───────────────────────────────────────────────────────────
// Must run before any protected route. Decodes the JWT and populates
// req.user so downstream handlers can use it.
const authenticate = (req, res, next) => {
  try {
    const token = req.cookies[COOKIE_NAME];

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please login.',
      });
    }

    const decoded = verifyToken(token);
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token. Please login again.',
    });
  }
};

// ── authorize ──────────────────────────────────────────────────────────────
// Usage:  router.post('/path', authenticate, authorize('CFO'), handler)
//         router.patch('/path', authenticate, authorize('RM', 'APE', 'CFO'), handler)
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
