/**
 * role.service.js — Role Assignment Business Logic
 *
 * CFO-only operation: changes a user's role.
 */

const { eq } = require('drizzle-orm');
const { db } = require('../config/database');
const { users } = require('../db/schema');
const { ROLES } = require('../utils/constants');

// Valid roles that can be assigned
const ASSIGNABLE_ROLES = [ROLES.EMP, ROLES.RM, ROLES.APE];

/**
 * Assigns a new role to a user.
 *
 * Rules:
 *   - Target user must exist.
 *   - Role must be a valid assignable role (EMP, RM, APE).
 *   - Cannot change the CFO's role (there is only one CFO, seeded).
 *
 * @param {string} userId — UUID of the target user
 * @param {string} role   — New role to assign
 * @returns {Object} Updated user info
 */
const assignRole = async (userId, role) => {
  // 1. Validate inputs
  if (!userId || !role) {
    const error = new Error('userId and role are required.');
    error.statusCode = 400;
    throw error;
  }

  if (!ASSIGNABLE_ROLES.includes(role)) {
    const error = new Error(`Invalid role. Allowed roles: ${ASSIGNABLE_ROLES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  // 2. Find the target user
  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.userId, userId))
    .limit(1);

  if (!targetUser) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  // 3. Prevent changing the CFO's role
  if (targetUser.role === ROLES.CFO) {
    const error = new Error('Cannot change the CFO role.');
    error.statusCode = 403;
    throw error;
  }

  // 4. Update role
  const [updated] = await db
    .update(users)
    .set({ role })
    .where(eq(users.userId, userId))
    .returning({
      userId: users.userId,
      name: users.name,
      email: users.email,
      role: users.role,
    });

  return updated;
};

module.exports = { assignRole };
