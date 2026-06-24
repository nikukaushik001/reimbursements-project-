/**
 * employee.routes.js — Employee Management Routes
 *
 * GET    /rest/employees        — List employees (role-based visibility)
 * POST   /rest/employees/assign — Assign EMP to RM (CFO only)
 * DELETE /rest/employees/assign — Remove assignment (CFO only)
 */

const { Router } = require('express');
const employeeController = require('../controllers/employee.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { ROLES } = require('../utils/constants');

const router = Router();

// GET /rest/employees — all authenticated users can call, but EMP is
// blocked inside the service (returns 403).
router.get(
  '/',
  authenticate,
  employeeController.getEmployees
);

// POST /rest/employees/assign — CFO only
router.post(
  '/assign',
  authenticate,
  authorize(ROLES.CFO),
  employeeController.assignEmployee
);

// DELETE /rest/employees/assign — CFO only
router.delete(
  '/assign',
  authenticate,
  authorize(ROLES.CFO),
  employeeController.removeAssignment
);

module.exports = router;
