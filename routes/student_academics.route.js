import { Router } from 'express';
import * as studentAcademicController from '../controller/student_academics.controller.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @swagger
 * /student-academics:
 *   post:
 *     summary: Create a new student academic record
 *     tags: [Student Academics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [student_id]
 *             properties:
 *               student_id:
 *                 type: string
 *                 example: STU001
 *               tenth_percent:
 *                 type: number
 *                 example: 92.5
 *               tenth_year:
 *                 type: integer
 *                 example: 2019
 *               tenth_board:
 *                 type: string
 *                 example: CBSE
 *               twelfth_percent:
 *                 type: number
 *                 example: 88.0
 *               twelfth_year:
 *                 type: integer
 *                 example: 2021
 *               twelfth_board:
 *                 type: string
 *                 example: CBSE
 *               diploma_percent:
 *                 type: number
 *                 description: Mutually exclusive with twelfth_percent
 *               ug_cgpa:
 *                 type: number
 *                 example: 8.5
 *               ug_year_of_passing:
 *                 type: integer
 *                 example: 2025
 *               pg_cgpa:
 *                 type: number
 *               backlogs:
 *                 type: integer
 *                 example: 0
 *     responses:
 *       201:
 *         description: Academic record created
 *       400:
 *         description: Validation error
 */
router.post('/', studentAcademicController.createStudentAcademic);

/**
 * @swagger
 * /student-academics:
 *   get:
 *     summary: Get all student academic records
 *     tags: [Student Academics]
 *     responses:
 *       200:
 *         description: Records retrieved
 */
router.get('/', studentAcademicController.getAllStudentAcademics);

/**
 * @swagger
 * /student-academics/menu:
 *   get:
 *     summary: Get students menu for dropdowns
 *     tags: [Student Academics]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: searchField
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Menu data retrieved
 */
router.get('/menu', studentAcademicController.getStudentsMenu);

/**
 * @swagger
 * /student-academics/filter:
 *   get:
 *     summary: Get academics with filters
 *     tags: [Student Academics]
 *     parameters:
 *       - in: query
 *         name: min_cgpa
 *         schema: { type: number }
 *       - in: query
 *         name: max_backlogs
 *         schema: { type: integer }
 *       - in: query
 *         name: branch
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Filtered results
 */
router.get('/filter', studentAcademicController.getAcademicsWithFilters);

/**
 * @swagger
 * /student-academics/category/{category}:
 *   get:
 *     summary: Get academics by category
 *     tags: [Student Academics]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category results
 */
router.get('/category/:category', studentAcademicController.getAcademicsByCategory);

/**
 * @swagger
 * /student-academics/{id}:
 *   get:
 *     summary: Get academic record by student ID
 *     tags: [Student Academics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Record retrieved
 *       404:
 *         description: Not found
 */
router.get('/:id', studentAcademicController.getStudentAcademicById);

/**
 * @swagger
 * /student-academics/{id}:
 *   put:
 *     summary: Update academic record (full update)
 *     tags: [Student Academics]
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
 *               tenth_percent:
 *                 type: number
 *               ug_cgpa:
 *                 type: number
 *               backlogs:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Record updated
 *       404:
 *         description: Not found
 */
router.put('/:id', studentAcademicController.updateStudentAcademicById);

/**
 * @swagger
 * /student-academics/{id}:
 *   patch:
 *     summary: Partially update academic record
 *     tags: [Student Academics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ug_cgpa:
 *                 type: number
 *               backlogs:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Record patched
 *       404:
 *         description: Not found
 */
router.patch('/:id', studentAcademicController.patchStudentAcademicById);

/**
 * @swagger
 * /student-academics/{id}:
 *   delete:
 *     summary: Delete academic record
 *     tags: [Student Academics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Record deleted
 *       404:
 *         description: Not found
 */
router.delete('/:id', studentAcademicController.deleteStudentAcademicById);

export default router;
