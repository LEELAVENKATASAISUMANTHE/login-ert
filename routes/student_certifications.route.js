import { Router } from 'express';
import * as studentCertificationController from '../controller/student_certifications.controller.js';
import { upload, uploadExcel } from '../utils/multer.js';

const router = Router();

/**
 * @swagger
 * /student-certifications/template:
 *   get:
 *     summary: Download Excel template for certification import
 *     tags: [Student Certifications]
 *     responses:
 *       200:
 *         description: Excel template file
 */
router.get('/template', studentCertificationController.downloadTemplate);

/**
 * @swagger
 * /student-certifications/search:
 *   get:
 *     summary: Search certifications by skill name
 *     tags: [Student Certifications]
 *     parameters:
 *       - in: query
 *         name: skill
 *         required: true
 *         schema: { type: string }
 *         example: Python
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Missing skill parameter
 */
router.get('/search', studentCertificationController.searchCertificationsBySkill);

/**
 * @swagger
 * /student-certifications/import:
 *   post:
 *     summary: Import certifications from Excel file
 *     tags: [Student Certifications]
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
router.post('/import', uploadExcel.single('file'), studentCertificationController.importFromExcel);

router.get('/import', (req, res) => {
    res.status(405).json({
        success: false,
        message: "Use POST method to import Excel file. Send file with field name 'file'.",
        hint: "GET /api/student-certifications/template to download Excel template"
    });
});

/**
 * @swagger
 * /student-certifications:
 *   post:
 *     summary: Create a new student certification (with file upload)
 *     tags: [Student Certifications]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [student_id, skill_name]
 *             properties:
 *               student_id:
 *                 type: string
 *                 example: STU001
 *               skill_name:
 *                 type: string
 *                 example: AWS Solutions Architect
 *               duration:
 *                 type: string
 *                 example: 3 months
 *               vendor:
 *                 type: string
 *                 example: Amazon Web Services
 *               certificate:
 *                 type: string
 *                 format: binary
 *                 description: Certificate file to upload (stored in Cloudflare R2; optional)
 *     responses:
 *       201:
 *         description: Certification created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 certification_id:
 *                   type: integer
 *                   example: 1
 *                 student_id:
 *                   type: string
 *                   example: STU001
 *                 skill_name:
 *                   type: string
 *                   example: AWS Solutions Architect
 *                 duration:
 *                   type: string
 *                   example: 3 months
 *                 vendor:
 *                   type: string
 *                   example: Amazon Web Services
 *                 certificate_file:
 *                   type: string
 *                   format: uri
 *                   nullable: true
 *                   description: Public URL of the uploaded certificate in Cloudflare R2
 *                   example: https://pub-xxxx.r2.dev/student_certifications/uuid.pdf
 *       400:
 *         description: Validation error
 */
router.post('/', upload.single('certificate'), studentCertificationController.createStudentCertification);

/**
 * @swagger
 * /student-certifications:
 *   get:
 *     summary: Get all student certifications
 *     tags: [Student Certifications]
 *     responses:
 *       200:
 *         description: Certifications retrieved
 */
router.get('/', studentCertificationController.getAllStudentCertifications);

/**
 * @swagger
 * /student-certifications/student/{studentId}:
 *   get:
 *     summary: Get all certifications for a specific student
 *     tags: [Student Certifications]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Student certifications retrieved
 */
router.get('/student/:studentId', studentCertificationController.getCertificationsByStudentId);

/**
 * @swagger
 * /student-certifications/{id}:
 *   get:
 *     summary: Get certification by ID
 *     tags: [Student Certifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Certification retrieved
 *       404:
 *         description: Not found
 */
router.get('/:id', studentCertificationController.getStudentCertificationById);

/**
 * @swagger
 * /student-certifications/{id}:
 *   put:
 *     summary: Update certification by ID (with optional file re-upload)
 *     tags: [Student Certifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               student_id:
 *                 type: string
 *               skill_name:
 *                 type: string
 *               duration:
 *                 type: string
 *               vendor:
 *                 type: string
 *               certificate:
 *                 type: string
 *                 format: binary
 *                 description: New certificate file to replace existing (stored in Cloudflare R2)
 *     responses:
 *       200:
 *         description: Certification updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 certificate_file:
 *                   type: string
 *                   format: uri
 *                   nullable: true
 *                   description: New Cloudflare R2 URL if file was replaced
 *                   example: https://pub-xxxx.r2.dev/student_certifications/uuid.pdf
 *       404:
 *         description: Not found
 */
router.put('/:id', upload.single('certificate'), studentCertificationController.updateStudentCertificationById);

/**
 * @swagger
 * /student-certifications/{id}:
 *   delete:
 *     summary: Delete certification by ID
 *     tags: [Student Certifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Certification deleted
 *       404:
 *         description: Not found
 */
router.delete('/:id', studentCertificationController.deleteStudentCertificationById);

export default router;
