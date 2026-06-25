/**
 * api.js — All Backend API Calls
 *
 * Every function returns the parsed JSON response.
 * Uses fetch() with credentials: 'include' so the auth cookie is sent.
 */

const API_BASE = 'http://localhost:7002/rest';

const defaultHeaders = { 'Content-Type': 'application/json' };
const fetchOptions = { credentials: 'include' };

/**
 * Generic fetch wrapper.
 */
async function apiFetch(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { ...defaultHeaders },
    ...fetchOptions,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
}

// ── Auth ───────────────────────────────────────────────────────────────────

async function apiRegister(name, email, password) {
  return apiFetch('/onboardings/register', 'POST', { name, email, password });
}

async function apiLogin(email, password) {
  return apiFetch('/onboardings/login', 'POST', { email, password });
}

async function apiLogout() {
  return apiFetch('/onboardings/logout', 'POST');
}

// ── Roles ──────────────────────────────────────────────────────────────────

async function apiAssignRole(userId, role) {
  return apiFetch('/roles/assign', 'POST', { userId, role });
}

// ── Employees ──────────────────────────────────────────────────────────────

async function apiGetEmployees() {
  return apiFetch('/employees', 'GET');
}

async function apiAssignEmployee(employeeUserId, rmUserId) {
  return apiFetch('/employees/assign', 'POST', { employeeUserId, rmUserId });
}

async function apiRemoveAssignment(employeeUserId, rmUserId) {
  return apiFetch('/employees/assign', 'DELETE', { employeeUserId, rmUserId });
}

// ── Reimbursements ─────────────────────────────────────────────────────────

async function apiCreateReimbursement(title, description, amount) {
  return apiFetch('/reimbursements', 'POST', { title, description, amount });
}

async function apiUpdateReimbursement(userId, status) {
  return apiFetch('/reimbursements', 'PATCH', { userId, status });
}

async function apiGetReimbursements() {
  return apiFetch('/reimbursements', 'GET');
}

async function apiGetReimbursementsByUser(userId) {
  return apiFetch(`/reimbursements/${userId}`, 'GET');
}
