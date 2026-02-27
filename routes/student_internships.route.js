import { Router } from 'express';
import * as studentInternshipController from '../controller/student_internships.controller.js';
import { uploadExcel } from '../utils/multer.js';

const router = Router();

/**
 * @swagger
 * /student-internships/template:
 *   get:
 *     summary: Download Excel template for internship import
 *     tags: [Student Internships]
 *     responses:
 *       200:
 *         description: Excel template file
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/template', studentInternshipController.downloadTemplate);

/**
 * @swagger
 * /student-internships/import:
 *   post:
 *     summary: Import internships from Excel file
 *     tags: [Student Internships]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file (.xlsx or .xls)
 *     responses:
 *       201:
 *         description: Import successful
 *       400:
 *         description: Validation errors in file
 */
router.post('/import', uploadExcel.single('file'), studentInternshipController.importFromExcel);

router.get('/import', (req, res) => {
    res.status(405).json({
        success: false,
        message: "Use POST method to import Excel file. Send file with field name 'file'.",
        hint: "GET /api/student-internships/template to download Excel template"
    });
});

/**
 * @swagger
 * /student-internships:
 *   post:
 *     summary: Create a new student internship
 *     tags: [Student Internships]
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
 *               organization:
 *                 type: string
 *                 example: Google India
 *               skills_acquired:
 *                 type: string
 *                 example: Python, Machine Learning
 *               duration:
 *                 type: string
 *                 example: 3 months
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               stipend:
 *                 type: number
 *                 example: 25000
 *     responses:
 *       201:
 *         description: Internship created
 *       400:
 *         description: Validation error
 */
router.post('/', studentInternshipController.createStudentInternship);

/**
 * @swagger
 * /student-internships:
 *   get:
 *     summary: Get all student internships
 *     tags: [Student Internships]
 *     responses:
 *       200:
 *         description: Internships retrieved
 */
router.get('/', studentInternshipController.getAllStudentInternships);

/**
 * @swagger
 * /student-internships/student/{studentId}:
 *   get:
 *     summary: Get all internships for a specific student
 *     tags: [Student Internships]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Student internships retrieved
 */
router.get('/student/:studentId', studentInternshipController.getInternshipsByStudentId);

/**
 * @swagger
 * /student-internships/{id}:
 *   get:
 *     summary: Get internship by ID
 *     tags: [Student Internships]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Internship retrieved
 *       404:
 *         description: Not found
 */
router.get('/:id', studentInternshipController.getStudentInternshipById);

/**
 * @swagger
 * /student-internships/{id}:
 *   put:
 *     summary: Update internship by ID
 *     tags: [Student Internships]
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
 *               organization:
 *                 type: string
 *               skills_acquired:
 *                 type: string
 *               duration:
 *                 type: string
 *               stipend:
 *                 type: number
 *     responses:
 *       200:
 *         description: Internship updated
 *       404:
 *         description: Not found
 */
router.put('/:id', studentInternshipController.updateStudentInternshipById);

/**
 * @swagger
 * /student-internships/{id}:
 *   delete:
 *     summary: Delete internship by ID
 *     tags: [Student Internships]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Internship deleted
 *       404:
 *         description: Not found
 */
router.delete('/:id', studentInternshipController.deleteStudentInternshipById);

export default router;
