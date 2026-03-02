/**
 * Auth Routes — /api/auth
 *
 * POST   /login         — Login with email + password
 * POST   /refresh        — Refresh access token (uses cookie)
 * POST   /logout         — Logout current session
 * POST   /logout-all     — Logout all sessions for the user
 * GET    /whoami         — Get current user info
 */

import { Router } from 'express';
import * as authController from '../controller/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// Public routes (no auth required)
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes (auth required)
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/whoami', authenticate, authController.whoami);

export default router;
