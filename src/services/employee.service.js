/**
 * employee.service.js — Employee Assignment & Listing Business Logic
 *
 * Handles:
 *   - Assigning an EMP to an RM (CFO only)
 *   - Removing an EMP–RM assignment (CFO only)
 *   - Listing employees with role-based visibility
 */

const { eq, and, ne } = require('drizzle-orm');
const { db } = require('../config/database');
const { users, employeeAssignments } = require('../db/schema');
const { ROLES } = require('../utils/constants');

// ── Assign Employee to RM ──────────────────────────────────────────────────

/**
 * Assigns an employee to a reporting manager.
 *
 * Validations:
 *   - Both user IDs must exist.
 *   - Employee must have role EMP.
 *   - Manager must have role RM.
 *   - No duplicate assignment (employee_user_id has UNIQUE constraint).
 *
 * @param {string} employeeUserId — UUID of the employee
 * @param {string} rmUserId       — UUID of the reporting manager
 * @returns {Object} The created assignment
 */
const assignEmployee = async (employeeUserId, rmUserId) => {
  // 1. Validate inputs
  if (!employeeUserId || !rmUserId) {
    const error = new Error('employeeUserId and rmUserId are required.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Verify employee exists and is EMP
  const [employee] = await db
    .select()
    .from(users)
    .where(eq(users.userId, employeeUserId))
    .limit(1);

  if (!employee) {
    const error = new Error('Employee user not found.');
    error.statusCode = 404;
    throw error;
  }

  if (employee.role !== ROLES.EMP) {
    const error = new Error('The specified user is not an Employee (EMP).');
    error.statusCode = 400;
    throw error;
  }

  // 3. Verify RM exists and is RM
  const [manager] = await db
    .select()
    .from(users)
    .where(eq(users.userId, rmUserId))
    .limit(1);

  if (!manager) {
    const error = new Error('Reporting Manager user not found.');
    error.statusCode = 404;
    throw error;
  }

  if (manager.role !== ROLES.RM) {
    const error = new Error('The specified user is not a Reporting Manager (RM).');
    error.statusCode = 400;
    throw error;
  }

  // 4. Check for duplicate assignment
  const [existing] = await db
    .select()
    .from(employeeAssignments)
    .where(eq(employeeAssignments.employeeUserId, employeeUserId))
    .limit(1);

  if (existing) {
    const error = new Error('This employee is already assigned to a Reporting Manager.');
    error.statusCode = 409;
    throw error;
  }

  // 5. Insert assignment
  const [assignment] = await db
    .insert(employeeAssignments)
    .values({ employeeUserId, rmUserId })
    .returning();

  return assignment;
};

// ── Remove Assignment ──────────────────────────────────────────────────────

/**
 * Removes an EMP–RM assignment.
 *
 * @param {string} employeeUserId
 * @param {string} rmUserId
 */
const removeAssignment = async (employeeUserId, rmUserId) => {
  if (!employeeUserId || !rmUserId) {
    const error = new Error('employeeUserId and rmUserId are required.');
    error.statusCode = 400;
    throw error;
  }

  const [deleted] = await db
    .delete(employeeAssignments)
    .where(
      and(
        eq(employeeAssignments.employeeUserId, employeeUserId),
        eq(employeeAssignments.rmUserId, rmUserId)
      )
    )
    .returning();

  if (!deleted) {
    const error = new Error('Assignment not found.');
    error.statusCode = 404;
    throw error;
  }

  return deleted;
};

// ── Get Employees (role-based visibility) ──────────────────────────────────

/**
 * Returns a list of users filtered by the requesting user's role.
 *
 * Visibility:
 *   EMP → 403 Forbidden
 *   RM  → only their assigned EMPs
 *   APE → all EMPs + RMs
 *   CFO → all users
 *
 * @param {Object} requestingUser — { userId, role }
 * @returns {Array} List of user objects
 */
const getEmployees = async (requestingUser) => {
  const { userId, role } = requestingUser;

  // EMP cannot access this endpoint
  if (role === ROLES.EMP) {
    const error = new Error('Employees cannot access this resource.');
    error.statusCode = 403;
    throw error;
  }

  // CFO sees all users
  if (role === ROLES.CFO) {
    const allUsers = await db
      .select({
        userId: users.userId,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users);

    return allUsers;
  }

  // APE sees all EMPs and RMs
  if (role === ROLES.APE) {
    const empsAndRMs = await db
      .select({
        userId: users.userId,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        // role IN ('EMP', 'RM') — Drizzle doesn't have inArray on varchar,
        // so we filter out APE and CFO instead
        and(
          ne(users.role, ROLES.APE),
          ne(users.role, ROLES.CFO)
        )
      );

    return empsAndRMs;
  }

  // RM sees only their assigned EMPs
  if (role === ROLES.RM) {
    const myEmployees = await db
      .select({
        userId: users.userId,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(employeeAssignments)
      .innerJoin(users, eq(employeeAssignments.employeeUserId, users.userId))
      .where(eq(employeeAssignments.rmUserId, userId));

    return myEmployees;
  }

  // Fallback (should not reach here)
  const error = new Error('Access denied.');
  error.statusCode = 403;
  throw error;
};

module.exports = { assignEmployee, removeAssignment, getEmployees };
