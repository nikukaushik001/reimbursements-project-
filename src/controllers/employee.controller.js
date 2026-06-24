/**
 * employee.controller.js — HTTP Handlers for Employee Management
 *
 * GET    /rest/employees        — List employees (role-based)
 * POST   /rest/employees/assign — Assign EMP to RM (CFO only)
 * DELETE /rest/employees/assign — Remove assignment (CFO only)
 */

const employeeService = require('../services/employee.service');

// ── GET /rest/employees ────────────────────────────────────────────────────
const getEmployees = async (req, res, next) => {
  try {
    const employees = await employeeService.getEmployees(req.user);

    res.status(200).json({
      status: 'success',
      data: { users: employees },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /rest/employees/assign ────────────────────────────────────────────
const assignEmployee = async (req, res, next) => {
  try {
    const { employeeUserId, rmUserId } = req.body;
    const assignment = await employeeService.assignEmployee(employeeUserId, rmUserId);

    res.status(201).json({
      status: 'success',
      data: { assignment },
    });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /rest/employees/assign ──────────────────────────────────────────
const removeAssignment = async (req, res, next) => {
  try {
    const { employeeUserId, rmUserId } = req.body;
    const removed = await employeeService.removeAssignment(employeeUserId, rmUserId);

    res.status(200).json({
      status: 'success',
      data: { assignment: removed },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getEmployees, assignEmployee, removeAssignment };
