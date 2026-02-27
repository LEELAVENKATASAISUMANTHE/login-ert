import { Router } from 'express';
import * as studentUserController from '../controller/student_users.controller.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @swagger
 * /student-users:
 *   post:
 *     summary: Create a new student-user association
 *     tags: [Student Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id]
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Association created
 *       400:
 *         description: Validation error
 */
router.post('/', studentUserController.createStudentUser);

/**
 * @swagger
 * /student-users/bulk:
 *   post:
 *     summary: Bulk create student-user associations
 *     tags: [Student Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_ids]
 *             properties:
 *               user_ids:
 *                 type: array
 *                 items: { type: integer }
 *                 example: [1, 2, 3, 4, 5]
 *     responses:
 *       201:
 *         description: Associations created
 */
router.post('/bulk', studentUserController.bulkCreateStudentUsers);

/**
 * @swagger
 * /student-users:
 *   get:
 *     summary: Get all student-user associations (paginated)
 *     tags: [Student Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [ASC, DESC] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Associations retrieved
 */
router.get('/', studentUserController.getAllStudentUsers);

/**
 * @swagger
 * /student-users/students:
 *   get:
 *     summary: Get all students with full user information
 *     tags: [Student Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Students with user info retrieved
 */
router.get('/students', studentUserController.getAllStudents);

/**
 * @swagger
 * /student-users/user/{user_id}:
 *   get:
 *     summary: Get student-user by user ID
 *     tags: [Student Users]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Association found
 *       404:
 *         description: Not found
 */
router.get('/user/:user_id', studentUserController.getStudentUserByUserId);

/**
 * @swagger
 * /student-users/{id}:
 *   get:
 *     summary: Get student-user by student ID
 *     tags: [Student Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Association found
 *       404:
 *         description: Not found
 */
router.get('/:id', studentUserController.getStudentUserById);

/**
 * @swagger
 * /student-users/{id}:
 *   put:
 *     summary: Update a student-user association
 *     tags: [Student Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 6
 *     responses:
 *       200:
 *         description: Association updated
 *       404:
 *         description: Not found
 */
router.put('/:id', studentUserController.updateStudentUser);

/**
 * @swagger
 * /student-users/{id}:
 *   delete:
 *     summary: Delete a student-user association
 *     tags: [Student Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Association deleted
 *       404:
 *         description: Not found
 */
router.delete('/:id', studentUserController.deleteStudentUser);

export default router;