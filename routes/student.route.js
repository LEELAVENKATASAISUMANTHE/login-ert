import { Router } from 'express';
import * as studentController from '../controller/student.controller.js';
import { upload } from '../utils/multer.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Create a new student
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [student_id, first_name, last_name, full_name, gender, dob, email, college_mail, mobile, branch]
 *             properties:
 *               student_id:
 *                 type: string
 *                 example: STU001
 *               first_name:
 *                 type: string
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               full_name:
 *                 type: string
 *                 example: John Doe
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "2003-05-15"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               college_mail:
 *                 type: string
 *                 format: email
 *                 example: john@college.edu
 *               mobile:
 *                 type: string
 *                 pattern: "^[0-9]{10}$"
 *                 example: "9876543210"
 *               branch:
 *                 type: string
 *                 example: CSE
 *               student_photo:
 *                 type: string
 *                 format: binary
 *                 description: Student photo upload
 *     responses:
 *       201:
 *         description: Student created successfully
 *       400:
 *         description: Validation error or student already exists
 */
router.post('/', upload.single('student_photo'), studentController.createStudent);

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get all students
 *     tags: [Students]
 *     responses:
 *       200:
 *         description: Students retrieved successfully
 */
router.get('/', studentController.getAllStudents);

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Get student by ID
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Student retrieved
 *       404:
 *         description: Student not found
 */
router.get('/:id', studentController.getStudentById);

/**
 * @swagger
 * /students/{id}:
 *   put:
 *     summary: Update student (full update)
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               full_name:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               dob:
 *                 type: string
 *                 format: date
 *               email:
 *                 type: string
 *                 format: email
 *               mobile:
 *                 type: string
 *               branch:
 *                 type: string
 *               student_photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Student updated
 *       404:
 *         description: Student not found
 */
router.put('/:id', upload.single('student_photo'), studentController.updateStudentById);

/**
 * @swagger
 * /students/{id}:
 *   patch:
 *     summary: Partially update student
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *               mobile:
 *                 type: string
 *               student_photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Student patched
 *       404:
 *         description: Student not found
 */
router.patch('/:id', upload.single('student_photo'), studentController.patchStudentById);

/**
 * @swagger
 * /students/{id}:
 *   delete:
 *     summary: Delete student
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Student deleted
 *       404:
 *         description: Student not found
 */
router.delete('/:id', studentController.deleteStudentById);

export default router;