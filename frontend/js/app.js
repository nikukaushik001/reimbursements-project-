/**
 * app.js — Main Application Entry Point
 *
 * Handles view switching between Auth and Dashboard screens.
 */

// ── View Switching ─────────────────────────────────────────────────────────

function switchToAuth() {
  hide('#dashboard-view');
  show('#auth-view');
  // Reset forms
  const loginForm = $('#login-form');
  const registerForm = $('#register-form');
  if (loginForm) loginForm.reset();
  if (registerForm) registerForm.reset();
  // Show login by default
  show('#login-section');
  hide('#register-section');
  $('#auth-title').textContent = 'Welcome Back';
  $('#auth-subtitle').textContent = 'Sign in to your account';
}

function switchToDashboard() {
  hide('#auth-view');
  show('#dashboard-view');
  initDashboard();
}

// ── App Init ───────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initAuthUI();
  switchToAuth();
});
