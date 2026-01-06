import { Router } from 'express';
import * as studentDocumentController from '../controller/student_documents.controller.js';
import { upload, uploadExcel } from '../utils/multer.js';

const router = Router();

// Download Excel template (place before parameterized routes)
router.get('/template', studentDocumentController.downloadTemplate);

// Import from Excel file (POST only)
router.post('/import', uploadExcel.single('file'), studentDocumentController.importFromExcel);

// GET /import - return helpful error message
router.get('/import', (req, res) => {
    res.status(405).json({
        success: false,
        message: "Use POST method to import Excel file. Send file with field name 'file'.",
        hint: "GET /api/student-documents/template to download Excel template"
    });
});

// Create a new student document (with file upload)
router.post('/', upload.single('document'), studentDocumentController.createStudentDocument);

// Get all student documents
router.get('/', studentDocumentController.getAllStudentDocuments);

// Get all documents for a specific student
router.get('/student/:studentId', studentDocumentController.getDocumentsByStudentId);

// Get student document by ID
router.get('/:id', studentDocumentController.getStudentDocumentById);

// Update student document by ID (with optional file upload)
router.put('/:id', upload.single('document'), studentDocumentController.updateStudentDocumentById);

// Delete student document by ID
router.delete('/:id', studentDocumentController.deleteStudentDocumentById);

export default router;
