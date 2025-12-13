import { Router } from 'express';
import * as userController from '../controller/users.controller.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public
 * @body    { username: string, password: string, email?: string, full_name?: string, role_id?: number, is_active?: boolean }
 * @example POST /api/users/register
 *          {
 *            "username": "john_doe",
 *            "password": "securePassword123",
 *            "email": "john@example.com",
 *            "full_name": "John Doe",
 *            "role_id": 2
 *          }
 */
router.post('/register', userController.createUser);

/**
 * @route   POST /api/users/login
 * @desc    Authenticate user login
 * @access  Public
 * @body    { username: string, password: string }
 * @example POST /api/users/login
 *          {
 *            "username": "john_doe",
 *            "password": "securePassword123"
 *          }
 */
router.post('/login', userController.login);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (Admin)
 * @query   { page?: number, limit?: number, sortBy?: string, sortOrder?: 'ASC'|'DESC', is_active?: boolean, role_id?: number, search?: string }
 * @example GET /api/users?page=1&limit=10&sortBy=username&sortOrder=ASC&is_active=true
 */
router.get('/', userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get a specific user by ID
 * @access  Private
 * @params  { id: number }
 * @example GET /api/users/1
 */
router.get('/:id', userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update a user's information
 * @access  Private (Admin or Own Profile)
 * @params  { id: number }
 * @body    { username?: string, email?: string, full_name?: string, role_id?: number, is_active?: boolean }
 * @example PUT /api/users/1
 *          {
 *            "email": "newemail@example.com",
 *            "full_name": "John Smith",
 *            "is_active": true
 *          }
 */
router.put('/:id', userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user (soft delete - sets is_active to false)
 * @access  Private (Admin only)
 * @params  { id: number }
 * @example DELETE /api/users/1
 */
router.delete('/:id', userController.deleteUser);

/**
 * @route   PUT /api/users/:id/change-password
 * @desc    Change user password
 * @access  Private (Admin or Own Profile)
 * @params  { id: number }
 * @body    { current_password: string, new_password: string }
 * @example PUT /api/users/1/change-password
 *          {
 *            "current_password": "oldPassword123",
 *            "new_password": "newSecurePassword456"
 *          }
 */
router.put('/:id/change-password', userController.changePassword);

/**
 * @route   PUT /api/users/:id/last-login
 * @desc    Update user's last login timestamp
 * @access  Private
 * @params  { id: number }
 * @example PUT /api/users/1/last-login
 */
router.put('/:id/last-login', userController.updateLastLogin);

export default router;