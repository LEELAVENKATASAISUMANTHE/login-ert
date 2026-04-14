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

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@example.com
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Login successful — sets httpOnly access and refresh token cookies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: integer
 *                           example: 1
 *                         username:
 *                           type: string
 *                           example: johndoe
 *                         email:
 *                           type: string
 *                           example: student@example.com
 *                         role_id:
 *                           type: integer
 *                           example: 2
 *                         role_name:
 *                           type: string
 *                           example: STUDENT
 *                         must_change_password:
 *                           type: boolean
 *                           example: false
 *       400:
 *         description: Validation error (missing or invalid fields)
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Account is deactivated
 *       423:
 *         description: Account is locked due to too many failed attempts
 *       500:
 *         description: Internal server error
 */
// Public routes (no auth required)
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using the refresh token cookie
 *     tags: [Auth]
 *     description: >
 *       Reads the `refreshToken` cookie to validate the session and issues new
 *       access + refresh token cookies (refresh token rotation).
 *     responses:
 *       200:
 *         description: Token refreshed — new cookies are set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Token refreshed successfully
 *       401:
 *         description: Refresh token missing, session not found, or session expired
 *       403:
 *         description: Account is deactivated
 *       500:
 *         description: Internal server error
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout current session
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     description: Deletes the current session from the database and clears auth cookies.
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       401:
 *         description: Not authenticated
 */
// Protected routes (auth required)
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Logout all sessions for the current user
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     description: Terminates all active sessions for the authenticated user and clears auth cookies.
 *     responses:
 *       200:
 *         description: All sessions terminated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out from all 3 session(s)
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
router.post('/logout-all', authenticate, authController.logoutAll);

/**
 * @swagger
 * /auth/whoami:
 *   get:
 *     summary: Get current authenticated user info
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: johndoe
 *                     email:
 *                       type: string
 *                       example: student@example.com
 *                     role_id:
 *                       type: integer
 *                       example: 2
 *                     role_name:
 *                       type: string
 *                       example: STUDENT
 *                     is_active:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/whoami', authenticate, authController.whoami);

export default router;
