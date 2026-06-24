/**
 * index.js — Convenience Re-exports
 *
 * Single import point for the database client and all schema tables.
 *
 * Usage:
 *   const { db, pool, users, reimbursements, employeeAssignments } = require('./db');
 */

const { db, pool } = require('../config/database');
const { users, reimbursements, employeeAssignments } = require('./schema');

module.exports = { db, pool, users, reimbursements, employeeAssignments };
