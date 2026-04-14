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
 *             required: [student_id, first_name, last_name, full_name, gender, dob, email, college_email, mobile, emergency_contact, nationality, placement_fee_status, branch, graduation_year]
 *             properties:
 *               student_id:
 *                 type: string
 *                 example: STU001
 *               first_name:
 *                 type: string
 *                 example: John
 *               middle_name:
 *                 type: string
 *                 example: Michael
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               full_name:
 *                 type: string
 *                 example: John Michael Doe
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
 *               alt_email:
 *                 type: string
 *                 format: email
 *                 example: john.alt@example.com
 *               college_email:
 *                 type: string
 *                 format: email
 *                 example: john@college.edu
 *               mobile:
 *                 type: string
 *                 pattern: "^[0-9]{10}$"
 *                 example: "9876543210"
 *               emergency_contact:
 *                 type: string
 *                 pattern: "^[0-9]{10}$"
 *                 example: "9876543211"
 *               nationality:
 *                 type: string
 *                 example: Indian
 *               placement_fee_status:
 *                 type: string
 *                 example: Paid
 *               branch:
 *                 type: string
 *                 example: CSE
 *               graduation_year:
 *                 type: integer
 *                 example: 2026
 *               semester:
 *                 type: integer
 *                 example: 6
 *               student_photo:
 *                 type: string
 *                 format: binary
 *                 description: New photo to replace existing (stored in Cloudflare R2)
 *                 description: Student photo upload (stored in Cloudflare R2)
 *     responses:
 *       201:
 *         description: Student created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 student_id:
 *                   type: string
 *                   example: STU001
 *                 full_name:
 *                   type: string
 *                   example: John Michael Doe
 *                 student_photo_path:
 *                   type: string
 *                   format: uri
 *                   nullable: true
 *                   description: Public URL of the photo stored in Cloudflare R2
 *                   example: https://pub-xxxx.r2.dev/students/uuid.jpg
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
 *               middle_name:
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
 *               alt_email:
 *                 type: string
 *                 format: email
 *               college_email:
 *                 type: string
 *                 format: email
 *               mobile:
 *                 type: string
 *                 pattern: "^[0-9]{10}$"
 *               emergency_contact:
 *                 type: string
 *                 pattern: "^[0-9]{10}$"
 *               nationality:
 *                 type: string
 *               placement_fee_status:
 *                 type: string
 *               branch:
 *                 type: string
 *               graduation_year:
 *                 type: integer
 *               semester:
 *                 type: integer
 *               student_photo:
 *                 type: string
 *                 format: binary
 *                 description: New photo to replace existing (stored in Cloudflare R2)
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
 *               middle_name:
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
 *               alt_email:
 *                 type: string
 *                 format: email
 *               college_email:
 *                 type: string
 *                 format: email
 *               mobile:
 *                 type: string
 *                 pattern: "^[0-9]{10}$"
 *               emergency_contact:
 *                 type: string
 *                 pattern: "^[0-9]{10}$"
 *               nationality:
 *                 type: string
 *               placement_fee_status:
 *                 type: string
 *               branch:
 *                 type: string
 *               graduation_year:
 *                 type: integer
 *               semester:
 *                 type: integer
 *               student_photo:
 *                 type: string
 *                 format: binary
 *                 description: New photo to replace existing (stored in Cloudflare R2)
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