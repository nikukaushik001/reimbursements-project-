/**
 * onboarding.controller.js — HTTP Handlers for Registration, Login & Logout
 *
 * Thin controller layer: validates nothing itself — delegates to the service.
 * Formats the HTTP response consistently.
 */

const onboardingService = require('../services/onboarding.service');
const { COOKIE_NAME, COOKIE_OPTIONS } = require('../utils/constants');

// ── POST /rest/onboardings/register ────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await onboardingService.registerUser(name, email, password);

    res.status(201).json({
      status: 'success',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /rest/onboardings/login ───────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await onboardingService.loginUser(email, password);

    // Set JWT as HTTP-only cookie
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /rest/onboardings/logout ──────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    res.clearCookie(COOKIE_NAME, { path: '/' });

    res.status(200).json({
      status: 'success',
      data: { message: 'Logged out successfully.' },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout };
