/**
 * reimbursement.service.js — Reimbursement Business Logic
 *
 * Handles:
 *   - Creating reimbursement requests (EMP only)
 *   - Approving / rejecting (RM → APE → CFO pipeline)
 *   - Listing reimbursements with role-based visibility
 *   - Fetching reimbursements for a specific user (EMP self-view)
 */

const { eq, and } = require('drizzle-orm');
const { db } = require('../config/database');
const { users, reimbursements, employeeAssignments } = require('../db/schema');
const { ROLES, STATUSES } = require('../utils/constants');

// ── Create Reimbursement ───────────────────────────────────────────────────

/**
 * Creates a new reimbursement request.
 * Only EMPs can create. Defaults to PENDING with all approval flags false.
 *
 * @param {string} userId — The requesting EMP's UUID
 * @param {Object} data   — { title, description, amount }
 * @returns {Object} The created reimbursement
 */
const createReimbursement = async (userId, { title, description, amount }) => {
  // 1. Validate fields
  if (!title || !description || amount === undefined || amount === null) {
    const error = new Error('title, description, and amount are required.');
    error.statusCode = 400;
    throw error;
  }

  if (isNaN(amount) || Number(amount) <= 0) {
    const error = new Error('Amount must be a positive number.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Insert
  const [created] = await db
    .insert(reimbursements)
    .values({
      userId,
      title,
      description,
      amount: String(amount),
      status: STATUSES.PENDING,
      rmApproved: false,
      apeApproved: false,
      cfoApproved: false,
    })
    .returning();

  return created;
};

// ── Update Reimbursement (Approve / Reject) ────────────────────────────────

/**
 * Approves or rejects a reimbursement.
 *
 * Pipeline:
 *   RM  → sets rm_approved   (only for their assigned EMPs)
 *   APE → sets ape_approved  (only if rm_approved is true)
 *   CFO → sets cfo_approved
 *   Any role can REJECT — sets status = REJECTED immediately.
 *
 * @param {string} approverId   — UUID of the approver
 * @param {string} approverRole — Role of the approver
 * @param {Object} data         — { userId (reimbursement owner UUID), status }
 * @returns {Object} Updated reimbursement
 */
const updateReimbursement = async (approverId, approverRole, { userId, status }) => {
  // 1. Validate inputs
  if (!userId || !status) {
    const error = new Error('userId and status are required.');
    error.statusCode = 400;
    throw error;
  }

  if (![STATUSES.APPROVED, STATUSES.REJECTED].includes(status)) {
    const error = new Error('Status must be APPROVED or REJECTED.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Find the PENDING reimbursement for this user
  const [reimbursement] = await db
    .select()
    .from(reimbursements)
    .where(
      and(
        eq(reimbursements.userId, userId),
        eq(reimbursements.status, STATUSES.PENDING)
      )
    )
    .limit(1);

  if (!reimbursement) {
    const error = new Error('No pending reimbursement found for this user.');
    error.statusCode = 404;
    throw error;
  }

  // ── REJECTION — any approver can reject immediately ──
  if (status === STATUSES.REJECTED) {
    const [updated] = await db
      .update(reimbursements)
      .set({
        status: STATUSES.REJECTED,
        updatedAt: new Date(),
      })
      .where(eq(reimbursements.id, reimbursement.id))
      .returning();

    return updated;
  }

  // ── APPROVAL — role-specific logic ──
  const updateFields = { updatedAt: new Date() };

  if (approverRole === ROLES.RM) {
    // RM can only approve their assigned EMPs' reimbursements
    const [assignment] = await db
      .select()
      .from(employeeAssignments)
      .where(
        and(
          eq(employeeAssignments.employeeUserId, userId),
          eq(employeeAssignments.rmUserId, approverId)
        )
      )
      .limit(1);

    if (!assignment) {
      const error = new Error('This employee is not assigned to you.');
      error.statusCode = 403;
      throw error;
    }

    updateFields.rmApproved = true;
  } else if (approverRole === ROLES.APE) {
    // APE can only approve if RM has already approved
    if (!reimbursement.rmApproved) {
      const error = new Error('Cannot approve. RM approval is pending.');
      error.statusCode = 400;
      throw error;
    }

    updateFields.apeApproved = true;
  } else if (approverRole === ROLES.CFO) {
    updateFields.cfoApproved = true;
  }

  // Check if all approvals are in — if so, set status to APPROVED
  const willBeRmApproved  = updateFields.rmApproved  || reimbursement.rmApproved;
  const willBeApeApproved = updateFields.apeApproved || reimbursement.apeApproved;

  if (willBeRmApproved && willBeApeApproved) {
    updateFields.status = STATUSES.APPROVED;
  }

  const [updated] = await db
    .update(reimbursements)
    .set(updateFields)
    .where(eq(reimbursements.id, reimbursement.id))
    .returning();

  return updated;
};

// ── Get Reimbursements (role-based visibility) ─────────────────────────────

/**
 * Returns reimbursements based on the requesting user's role.
 *
 * Visibility:
 *   EMP → own reimbursements (status = APPROVED only when rm + ape approved)
 *   RM  → PENDING from their assigned EMPs
 *   APE → PENDING + RM-approved
 *   CFO → APE-approved
 *
 * @param {Object} requestingUser — { userId, role }
 * @returns {Array} Reimbursement list
 */
const getReimbursements = async (requestingUser) => {
  const { userId, role } = requestingUser;

  // ── EMP: own reimbursements ──
  if (role === ROLES.EMP) {
    const own = await db
      .select()
      .from(reimbursements)
      .where(eq(reimbursements.userId, userId));

    // Map status: show APPROVED only when both rm and ape approved
    return own.map((r) => ({
      ...r,
      status:
        r.rmApproved && r.apeApproved
          ? STATUSES.APPROVED
          : r.status === STATUSES.REJECTED
            ? STATUSES.REJECTED
            : STATUSES.PENDING,
    }));
  }

  // ── RM: PENDING from their assigned EMPs ──
  if (role === ROLES.RM) {
    const results = await db
      .select({
        id: reimbursements.id,
        reimbursementId: reimbursements.reimbursementId,
        userId: reimbursements.userId,
        title: reimbursements.title,
        description: reimbursements.description,
        amount: reimbursements.amount,
        status: reimbursements.status,
        rmApproved: reimbursements.rmApproved,
        apeApproved: reimbursements.apeApproved,
        cfoApproved: reimbursements.cfoApproved,
        createdAt: reimbursements.createdAt,
        updatedAt: reimbursements.updatedAt,
      })
      .from(reimbursements)
      .innerJoin(
        employeeAssignments,
        eq(reimbursements.userId, employeeAssignments.employeeUserId)
      )
      .where(
        and(
          eq(employeeAssignments.rmUserId, userId),
          eq(reimbursements.status, STATUSES.PENDING)
        )
      );

    return results;
  }

  // ── APE: PENDING + RM-approved ──
  if (role === ROLES.APE) {
    const results = await db
      .select()
      .from(reimbursements)
      .where(
        and(
          eq(reimbursements.status, STATUSES.PENDING),
          eq(reimbursements.rmApproved, true)
        )
      );

    return results;
  }

  // ── CFO: APE-approved ──
  if (role === ROLES.CFO) {
    const results = await db
      .select()
      .from(reimbursements)
      .where(eq(reimbursements.apeApproved, true));

    return results;
  }

  return [];
};

// ── Get Reimbursements by User ID ──────────────────────────────────────────

/**
 * Returns all reimbursements for a specific user ID.
 * EMP-only: the requesting user must match the target user ID.
 *
 * @param {Object} requestingUser — { userId, role }
 * @param {string} targetUserId   — UUID from the route param
 * @returns {Array} Reimbursement list
 */
const getReimbursementsByUserId = async (requestingUser, targetUserId) => {
  // Only EMPs can use this endpoint, and only for themselves
  if (requestingUser.role !== ROLES.EMP) {
    const error = new Error('Only employees can access this endpoint.');
    error.statusCode = 403;
    throw error;
  }

  if (requestingUser.userId !== targetUserId) {
    const error = new Error('You can only view your own reimbursements.');
    error.statusCode = 403;
    throw error;
  }

  const results = await db
    .select()
    .from(reimbursements)
    .where(eq(reimbursements.userId, targetUserId));

  // Apply the same status mapping as getReimbursements for EMP
  return results.map((r) => ({
    ...r,
    status:
      r.rmApproved && r.apeApproved
        ? STATUSES.APPROVED
        : r.status === STATUSES.REJECTED
          ? STATUSES.REJECTED
          : STATUSES.PENDING,
  }));
};

module.exports = {
  createReimbursement,
  updateReimbursement,
  getReimbursements,
  getReimbursementsByUserId,
};
