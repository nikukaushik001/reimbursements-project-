const jwt = require('jsonwebtoken');

// Secret should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev_only';

/**
 * Generates a JWT token for the given user payload.
 * @param {Object} payload - User data to sign (e.g., userId, role)
 * @returns {string} - The signed JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
};

/**
 * Verifies a JWT token.
 * @param {string} token - The JWT token to verify
 * @returns {Object} - The decoded payload if valid
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken
};
