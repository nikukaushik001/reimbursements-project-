/**
 * onboarding.routes.js — Public Auth Routes
 *
 * All routes are PUBLIC (no authentication required).
 *
 * POST /rest/onboardings/register
 * POST /rest/onboardings/login
 * POST /rest/onboardings/logout
 */

const { Router } = require('express');
const onboardingController = require('../controllers/onboarding.controller');

const router = Router();

router.post('/register', onboardingController.register);
router.post('/login',    onboardingController.login);
router.post('/logout',   onboardingController.logout);

module.exports = router;
