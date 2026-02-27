import { Router } from 'express';

import * as userController from '../controller/users.controller.js';
import logger from '../utils/logger.js';
import { authenticateWithAutoRefresh } from '../middleware/authWithRefresh.js';

const router = Router();

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 example: john_doe
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 100
 *                 example: securePassword123
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               full_name:
 *                 type: string
 *                 example: John Doe
 *               role_id:
 *                 type: integer
 *                 example: 2
 *               is_active:
 *                 type: boolean
 *                 default: true
 *               student_id:
 *                 type: string
 *                 description: Optional student ID for auto-linking
 *                 example: STU001
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Username already exists
 */
router.post('/register', userController.createUser);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     description: Authenticates user and sets JWT token & refreshToken as HttpOnly cookies.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               password:
 *                 type: string
 *                 example: securePassword123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', userController.login);

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: Logout user (clear JWT cookies)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', userController.logout);

/**
 * @swagger
 * /users/whoami:
 *   get:
 *     summary: Get current user profile from JWT
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     description: Returns user info including student_id and full student profile if applicable.
 *     responses:
 *       200:
 *         description: User information retrieved
 *       401:
 *         description: Not authenticated
 */
router.get('/whoami', authenticateWithAutoRefresh, userController.whoami);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (paginated)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [user_id, username, email, full_name, created_at, last_login] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [ASC, DESC] }
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
 *       - in: query
 *         name: role_id
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/', authenticateWithAutoRefresh, userController.getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User retrieved
 *       404:
 *         description: User not found
 */
router.get('/:id', authenticateWithAutoRefresh, userController.getUserById);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               full_name:
 *                 type: string
 *               role_id:
 *                 type: integer
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 */
router.put('/:id', userController.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user (soft delete)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.delete('/:id', userController.deleteUser);

/**
 * @swagger
 * /users/{id}/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_password, new_password]
 *             properties:
 *               current_password:
 *                 type: string
 *                 example: oldPassword123
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *                 example: newSecurePassword456
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Wrong current password
 */
router.put('/:id/change-password', userController.changePassword);

/**
 * @swagger
 * /users/{id}/last-login:
 *   put:
 *     summary: Update last login timestamp
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Last login updated
 */
router.put('/:id/last-login', userController.updateLastLogin);

export default router;