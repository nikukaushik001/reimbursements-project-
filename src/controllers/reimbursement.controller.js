/**
 * reimbursement.controller.js — HTTP Handlers for Reimbursements
 *
 * POST   /rest/reimbursements            — Create (EMP only)
 * PATCH  /rest/reimbursements            — Approve/Reject (RM/APE/CFO)
 * GET    /rest/reimbursements            — List (role-based visibility)
 * GET    /rest/reimbursements/:userId    — List by user ID (EMP self-view)
 */

const reimbursementService = require('../services/reimbursement.service');

// ── POST /rest/reimbursements ──────────────────────────────────────────────
const createReimbursement = async (req, res, next) => {
  try {
    const { title, description, amount } = req.body;
    
    // Construct public URL path if file was uploaded
    const receiptUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const created = await reimbursementService.createReimbursement(
      req.user.userId,
      { title, description, amount, receiptUrl }
    );

    res.status(201).json({
      status: 'success',
      data: { reimbursement: created },
    });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /rest/reimbursements ─────────────────────────────────────────────
const updateReimbursement = async (req, res, next) => {
  try {
    const { userId, status } = req.body;
    const updated = await reimbursementService.updateReimbursement(
      req.user.userId,
      req.user.role,
      { userId, status }
    );

    res.status(200).json({
      status: 'success',
      data: { reimbursement: updated },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /rest/reimbursements ───────────────────────────────────────────────
const getReimbursements = async (req, res, next) => {
  try {
    const list = await reimbursementService.getReimbursements(req.user);

    res.status(200).json({
      status: 'success',
      data: { reimbursements: list },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /rest/reimbursements/:userId ───────────────────────────────────────
const getReimbursementsByUser = async (req, res, next) => {
  try {
    const list = await reimbursementService.getReimbursementsByUserId(
      req.user,
      req.params.userId
    );

    res.status(200).json({
      status: 'success',
      data: { reimbursements: list },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReimbursement,
  updateReimbursement,
  getReimbursements,
  getReimbursementsByUser,
};
