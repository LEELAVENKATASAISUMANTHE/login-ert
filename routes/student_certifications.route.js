import { Router } from 'express';
import * as studentCertificationController from '../controller/student_certifications.controller.js';
import { upload, uploadExcel } from '../utils/multer.js';

const router = Router();

// Download Excel template (place before parameterized routes)
router.get('/template', studentCertificationController.downloadTemplate);

// Search certifications by skill (place before :id route)
router.get('/search', studentCertificationController.searchCertificationsBySkill);

// Import from Excel file (POST only)
router.post('/import', uploadExcel.single('file'), studentCertificationController.importFromExcel);

// GET /import - return helpful error message
router.get('/import', (req, res) => {
    res.status(405).json({
        success: false,
        message: "Use POST method to import Excel file. Send file with field name 'file'.",
        hint: "GET /api/student-certifications/template to download Excel template"
    });
});

// Create a new student certification (with file upload)
router.post('/', upload.single('certificate'), studentCertificationController.createStudentCertification);

// Get all student certifications
router.get('/', studentCertificationController.getAllStudentCertifications);

// Get all certifications for a specific student
router.get('/student/:studentId', studentCertificationController.getCertificationsByStudentId);

// Get student certification by ID
router.get('/:id', studentCertificationController.getStudentCertificationById);

// Update student certification by ID (with optional file upload)
router.put('/:id', upload.single('certificate'), studentCertificationController.updateStudentCertificationById);

// Delete student certification by ID
router.delete('/:id', studentCertificationController.deleteStudentCertificationById);

export default router;
