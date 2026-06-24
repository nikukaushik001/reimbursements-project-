/**
 * role.controller.js — HTTP Handler for Role Assignment
 *
 * POST /rest/roles/assign (CFO only)
 */

const roleService = require('../services/role.service');

// ── POST /rest/roles/assign ────────────────────────────────────────────────
const assignRole = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const updated = await roleService.assignRole(userId, role);

    res.status(200).json({
      status: 'success',
      data: { user: updated },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { assignRole };
