/**
 * onboarding.service.js — Registration, Login & Logout Business Logic
 *
 * Handles user onboarding: email domain validation, password hashing,
 * JWT generation, and cookie-based session management.
 */

const bcrypt = require('bcrypt');
const { eq } = require('drizzle-orm');
const { db } = require('../config/database');
const { users } = require('../db/schema');
const { generateToken } = require('../utils/jwt.utils');
const { ROLES, ALLOWED_EMAIL_DOMAIN } = require('../utils/constants');

const SALT_ROUNDS = 10;

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Validates that the email belongs to the allowed corporate domain.
 * @param {string} email
 * @returns {boolean}
 */
const isValidDomain = (email) => {
  if (!email || typeof email !== 'string') return false;
  const domain = email.split('@')[1];
  return domain === ALLOWED_EMAIL_DOMAIN;
};

// ── Register ───────────────────────────────────────────────────────────────

/**
 * Registers a new employee user.
 *
 * Rules:
 *   - Only @org.com emails allowed.
 *   - Email must be unique.
 *   - Default role is always EMP (CFO is seeded, never registered).
 *
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Object} The created user (without passwordHash)
 */
const registerUser = async (name, email, password) => {
  // 1. Validate required fields
  if (!name || !email || !password) {
    const error = new Error('Name, email, and password are required.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate email domain
  if (!isValidDomain(email)) {
    const error = new Error(`Only @${ALLOWED_EMAIL_DOMAIN} emails are allowed.`);
    error.statusCode = 400;
    throw error;
  }

  // 3. Check for duplicate email
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    const error = new Error('Email already registered.');
    error.statusCode = 409;
    throw error;
  }

  // 4. Hash password and insert
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      role: ROLES.EMP,
    })
    .returning({
      userId: users.userId,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    });

  return newUser;
};

// ── Login ──────────────────────────────────────────────────────────────────

/**
 * Authenticates a user and returns a signed JWT.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Object} { token, user }
 */
const loginUser = async (email, password) => {
  // 1. Validate required fields
  if (!email || !password) {
    const error = new Error('Email and password are required.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate email domain
  if (!isValidDomain(email)) {
    const error = new Error(`Only @${ALLOWED_EMAIL_DOMAIN} emails are allowed.`);
    error.statusCode = 400;
    throw error;
  }

  // 3. Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // 4. Compare password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // 5. Generate JWT
  const token = generateToken({ userId: user.userId, role: user.role });

  return {
    token,
    user: {
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

module.exports = { registerUser, loginUser };
