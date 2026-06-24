/**
 * role.routes.js — Role Management Routes
 *
 * All routes are PROTECTED and restricted to CFO only.
 *
 * POST /rest/roles/assign
 */

const { Router } = require('express');
const roleController = require('../controllers/role.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { ROLES } = require('../utils/constants');

const router = Router();

router.post(
  '/assign',
  authenticate,
  authorize(ROLES.CFO),
  roleController.assignRole
);

module.exports = router;
