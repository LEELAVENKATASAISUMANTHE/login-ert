import { Router } from 'express';
import * as studentDocumentController from '../controller/student_documents.controller.js';
import { upload, uploadExcel } from '../utils/multer.js';

const router = Router();

/**
 * @swagger
 * /student-documents/template:
 *   get:
 *     summary: Download Excel template for document import
 *     tags: [Student Documents]
 *     responses:
 *       200:
 *         description: Excel template file
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/template', studentDocumentController.downloadTemplate);

/**
 * @swagger
 * /student-documents/import:
 *   post:
 *     summary: Import documents metadata from Excel file
 *     tags: [Student Documents]
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
router.post('/import', uploadExcel.single('file'), studentDocumentController.importFromExcel);

router.get('/import', (req, res) => {
    res.status(405).json({
        success: false,
        message: "Use POST method to import Excel file. Send file with field name 'file'.",
        hint: "GET /api/student-documents/template to download Excel template"
    });
});

/**
 * @swagger
 * /student-documents:
 *   post:
 *     summary: Create a new student document (with file upload)
 *     tags: [Student Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [student_id, document_type, document]
 *             properties:
 *               student_id:
 *                 type: string
 *                 example: STU001
 *               document_type:
 *                 type: string
 *                 example: Resume
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Document file to upload (stored in Cloudflare R2)
 *     responses:
 *       201:
 *         description: Document created, file stored in Cloudflare R2
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 document_id:
 *                   type: integer
 *                   example: 1
 *                 student_id:
 *                   type: string
 *                   example: STU001
 *                 document_type:
 *                   type: string
 *                   example: Resume
 *                 file_path:
 *                   type: string
 *                   format: uri
 *                   description: Public URL of the uploaded file in Cloudflare R2
 *                   example: https://pub-xxxx.r2.dev/student_documents/uuid.pdf
 *       400:
 *         description: Validation error or missing file
 */
router.post('/', upload.single('document'), studentDocumentController.createStudentDocument);

/**
 * @swagger
 * /student-documents:
 *   get:
 *     summary: Get all student documents
 *     tags: [Student Documents]
 *     responses:
 *       200:
 *         description: Documents retrieved
 */
router.get('/', studentDocumentController.getAllStudentDocuments);

/**
 * @swagger
 * /student-documents/student/{studentId}:
 *   get:
 *     summary: Get all documents for a specific student
 *     tags: [Student Documents]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Student documents retrieved
 */
router.get('/student/:studentId', studentDocumentController.getDocumentsByStudentId);

/**
 * @swagger
 * /student-documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     tags: [Student Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Document retrieved
 *       404:
 *         description: Not found
 */
router.get('/:id', studentDocumentController.getStudentDocumentById);

/**
 * @swagger
 * /student-documents/{id}:
 *   put:
 *     summary: Update document by ID (with optional file re-upload)
 *     tags: [Student Documents]
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
 *               document_type:
 *                 type: string
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: New document file to replace existing (stored in Cloudflare R2)
 *     responses:
 *       200:
 *         description: Document updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 file_path:
 *                   type: string
 *                   format: uri
 *                   description: New Cloudflare R2 URL if file was replaced
 *                   example: https://pub-xxxx.r2.dev/student_documents/uuid.pdf
 *       404:
 *         description: Not found
 */
router.put('/:id', upload.single('document'), studentDocumentController.updateStudentDocumentById);

/**
 * @swagger
 * /student-documents/{id}:
 *   delete:
 *     summary: Delete document by ID
 *     tags: [Student Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Document deleted
 *       404:
 *         description: Not found
 */
router.delete('/:id', studentDocumentController.deleteStudentDocumentById);

export default router;
