import { Router } from 'express';
import * as studentFamilyController from '../controller/student_family.controller.js';
import { uploadExcel } from '../utils/multer.js';

const router = Router();

/**
 * @swagger
 * /student-family/template:
 *   get:
 *     summary: Download Excel template for family import
 *     tags: [Student Family]
 *     responses:
 *       200:
 *         description: Excel template file
 */
router.get('/template', studentFamilyController.downloadTemplate);

/**
 * @swagger
 * /student-family/import:
 *   post:
 *     summary: Import family records from Excel file
 *     tags: [Student Family]
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
 *     responses:
 *       201:
 *         description: Import successful
 *       400:
 *         description: Validation errors
 */
router.post('/import', uploadExcel.single('file'), studentFamilyController.importFromExcel);

router.get('/import', (req, res) => {
    res.status(405).json({
        success: false,
        message: "Use POST method to import Excel file. Send file with field name 'file'.",
        hint: "GET /api/student-family/template to download Excel template"
    });
});

/**
 * @swagger
 * /student-family:
 *   post:
 *     summary: Create a new student family record
 *     tags: [Student Family]
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
 *               father_name:
 *                 type: string
 *                 example: John Smith Sr.
 *               father_occupation:
 *                 type: string
 *                 example: Engineer
 *               father_phone:
 *                 type: string
 *                 pattern: "^[0-9]{10}$"
 *                 example: "9876543210"
 *               mother_name:
 *                 type: string
 *                 example: Mary Smith
 *               mother_occupation:
 *                 type: string
 *                 example: Teacher
 *               mother_phone:
 *                 type: string
 *                 pattern: "^[0-9]{10}$"
 *                 example: "9876543211"
 *               blood_group:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *                 example: O+
 *     responses:
 *       201:
 *         description: Family record created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Family record already exists for student
 */
router.post('/', studentFamilyController.createStudentFamily);

/**
 * @swagger
 * /student-family:
 *   get:
 *     summary: Get all student family records
 *     tags: [Student Family]
 *     responses:
 *       200:
 *         description: Family records retrieved
 */
router.get('/', studentFamilyController.getAllStudentFamilies);

/**
 * @swagger
 * /student-family/{id}:
 *   get:
 *     summary: Get family record by student ID
 *     tags: [Student Family]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Family record retrieved
 *       404:
 *         description: Not found
 */
router.get('/:id', studentFamilyController.getStudentFamilyById);

/**
 * @swagger
 * /student-family/{id}:
 *   put:
 *     summary: Update family record by student ID
 *     tags: [Student Family]
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
 *               father_name:
 *                 type: string
 *               father_phone:
 *                 type: string
 *               mother_name:
 *                 type: string
 *               blood_group:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *     responses:
 *       200:
 *         description: Family record updated
 *       404:
 *         description: Not found
 */
router.put('/:id', studentFamilyController.updateStudentFamilyById);

/**
 * @swagger
 * /student-family/{id}:
 *   delete:
 *     summary: Delete family record by student ID
 *     tags: [Student Family]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Family record deleted
 *       404:
 *         description: Not found
 */
router.delete('/:id', studentFamilyController.deleteStudentFamilyById);

export default router;
