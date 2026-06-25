/**
 * auth.js — Login / Register / Logout UI Logic
 */

/**
 * Current user state — set after login, cleared on logout.
 * @type {{ userId: string, name: string, email: string, role: string } | null}
 */
let currentUser = null;

function getCurrentUser() {
  return currentUser;
}

// ── Toggle between Login & Register ────────────────────────────────────────

function initAuthUI() {
  const loginForm = $('#login-form');
  const registerForm = $('#register-form');
  const switchToRegister = $('#switch-to-register');
  const switchToLogin = $('#switch-to-login');

  switchToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    hide('#login-section');
    show('#register-section');
    $('#auth-title').textContent = 'Create Account';
    $('#auth-subtitle').textContent = 'Register with your @org.com email';
  });

  switchToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    hide('#register-section');
    show('#login-section');
    $('#auth-title').textContent = 'Welcome Back';
    $('#auth-subtitle').textContent = 'Sign in to your account';
  });

  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
}

// ── Login ──────────────────────────────────────────────────────────────────

async function handleLogin(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const email = $('#login-email').value.trim();
  const password = $('#login-password').value;

  if (!email || !password) {
    return showToast('Please fill in all fields.', 'error');
  }

  setLoading(btn, true);
  try {
    const res = await apiLogin(email, password);
    currentUser = res.data.user;
    showToast(`Welcome back, ${currentUser.name}!`, 'success');
    switchToDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
}

// ── Register ───────────────────────────────────────────────────────────────

async function handleRegister(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const name = $('#register-name').value.trim();
  const email = $('#register-email').value.trim();
  const password = $('#register-password').value;

  if (!name || !email || !password) {
    return showToast('Please fill in all fields.', 'error');
  }

  setLoading(btn, true);
  try {
    await apiRegister(name, email, password);
    showToast('Account created! Please login.', 'success');
    // Switch to login view
    hide('#register-section');
    show('#login-section');
    $('#auth-title').textContent = 'Welcome Back';
    $('#auth-subtitle').textContent = 'Sign in to your account';
    // Pre-fill email
    $('#login-email').value = email;
    $('#register-form').reset();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
}

// ── Logout ─────────────────────────────────────────────────────────────────

async function handleLogout() {
  try {
    await apiLogout();
    currentUser = null;
    showToast('Logged out.', 'info');
    switchToAuth();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
