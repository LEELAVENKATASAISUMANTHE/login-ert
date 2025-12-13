import { Router } from 'express';
import * as studentUserController from '../controller/student_users.controller.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @route   POST /api/student-users
 * @desc    Create a new student user association
 * @access  Private (Admin only)
 * @body    { user_id: number }
 * @example POST /api/student-users
 *          {
 *            "user_id": 5
 *          }
 */
router.post('/', studentUserController.createStudentUser);

/**
 * @route   POST /api/student-users/bulk
 * @desc    Create multiple student user associations
 * @access  Private (Admin only)
 * @body    { user_ids: number[] }
 * @example POST /api/student-users/bulk
 *          {
 *            "user_ids": [1, 2, 3, 4, 5]
 *          }
 */
router.post('/bulk', studentUserController.bulkCreateStudentUsers);

/**
 * @route   GET /api/student-users
 * @desc    Get all student user associations with pagination and filtering
 * @access  Private
 * @query   { page?: number, limit?: number, sortBy?: string, sortOrder?: 'ASC'|'DESC', user_id?: number, search?: string }
 * @example GET /api/student-users?page=1&limit=10&sortBy=student_id&sortOrder=ASC
 */
router.get('/', studentUserController.getAllStudentUsers);

/**
 * @route   GET /api/student-users/students
 * @desc    Get all students (users with student associations) with full user information
 * @access  Private
 * @query   { page?: number, limit?: number, sortBy?: string, sortOrder?: 'ASC'|'DESC', search?: string }
 * @example GET /api/student-users/students?page=1&limit=10&search=john
 */
router.get('/students', studentUserController.getAllStudents);

/**
 * @route   GET /api/student-users/:id
 * @desc    Get a specific student user by student ID
 * @access  Private
 * @params  { id: number }
 * @example GET /api/student-users/1
 */
router.get('/:id', studentUserController.getStudentUserById);

/**
 * @route   GET /api/student-users/user/:user_id
 * @desc    Get student user by user ID
 * @access  Private
 * @params  { user_id: number }
 * @example GET /api/student-users/user/5
 */
router.get('/user/:user_id', studentUserController.getStudentUserByUserId);

/**
 * @route   PUT /api/student-users/:id
 * @desc    Update a student user association
 * @access  Private (Admin only)
 * @params  { id: number }
 * @body    { user_id?: number }
 * @example PUT /api/student-users/1
 *          {
 *            "user_id": 6
 *          }
 */
router.put('/:id', studentUserController.updateStudentUser);

/**
 * @route   DELETE /api/student-users/:id
 * @desc    Delete a student user association
 * @access  Private (Admin only)
 * @params  { id: number }
 * @example DELETE /api/student-users/1
 */
router.delete('/:id', studentUserController.deleteStudentUser);

export default router;