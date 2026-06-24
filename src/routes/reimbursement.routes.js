/**
 * reimbursement.routes.js — Reimbursement Routes
 *
 * POST   /rest/reimbursements             — Create (EMP only)
 * PATCH  /rest/reimbursements             — Approve/Reject (RM, APE, CFO)
 * GET    /rest/reimbursements             — List (role-based visibility)
 * GET    /rest/reimbursements/:userId     — List by user (EMP self-view)
 */

const { Router } = require('express');
const reimbursementController = require('../controllers/reimbursement.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { ROLES } = require('../utils/constants');

const router = Router();

// POST — EMP creates a new reimbursement
router.post(
  '/',
  authenticate,
  authorize(ROLES.EMP),
  reimbursementController.createReimbursement
);

// PATCH — RM / APE / CFO approves or rejects
router.patch(
  '/',
  authenticate,
  authorize(ROLES.RM, ROLES.APE, ROLES.CFO),
  reimbursementController.updateReimbursement
);

// GET — All authenticated users, visibility filtered in service
router.get(
  '/',
  authenticate,
  reimbursementController.getReimbursements
);

// GET /:userId — EMP self-view only
router.get(
  '/:userId',
  authenticate,
  authorize(ROLES.EMP),
  reimbursementController.getReimbursementsByUser
);

module.exports = router;
