import { Router } from 'express';
import * as studentInternshipController from '../controller/student_internships.controller.js';
import { uploadExcel } from '../utils/multer.js';

const router = Router();

// Download Excel template (place before parameterized routes)
router.get('/template', studentInternshipController.downloadTemplate);

// Import from Excel file
router.post('/import', uploadExcel.single('file'), studentInternshipController.importFromExcel);

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
