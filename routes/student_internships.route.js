import { Router } from 'express';
import * as studentInternshipController from '../controller/student_internships.controller.js';
import { uploadExcel } from '../utils/multer.js';

const router = Router();

// Download Excel template (place before parameterized routes)
router.get('/template', studentInternshipController.downloadTemplate);

// Import from Excel file (POST only)
router.post('/import', uploadExcel.single('file'), studentInternshipController.importFromExcel);

// GET /import - return helpful error message
router.get('/import', (req, res) => {
    res.status(405).json({
        success: false,
        message: "Use POST method to import Excel file. Send file with field name 'file'.",
        hint: "GET /api/student-internships/template to download Excel template"
    });
});

// Create a new student internship
router.post('/', studentInternshipController.createStudentInternship);

// Get all student internships
router.get('/', studentInternshipController.getAllStudentInternships);

// Get all internships for a specific student
router.get('/student/:studentId', studentInternshipController.getInternshipsByStudentId);

// Get student internship by ID
router.get('/:id', studentInternshipController.getStudentInternshipById);

// Update student internship by ID
router.put('/:id', studentInternshipController.updateStudentInternshipById);

// Delete student internship by ID
router.delete('/:id', studentInternshipController.deleteStudentInternshipById);

export default router;
