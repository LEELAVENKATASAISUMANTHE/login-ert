import { Router } from 'express';
import * as studentFamilyController from '../controller/student_family.controller.js';
import { uploadExcel } from '../utils/multer.js';

const router = Router();

// Download Excel template (place before parameterized routes)
router.get('/template', studentFamilyController.downloadTemplate);

// Import from Excel file (POST only)
router.post('/import', uploadExcel.single('file'), studentFamilyController.importFromExcel);

// GET /import - return helpful error message
router.get('/import', (req, res) => {
    res.status(405).json({
        success: false,
        message: "Use POST method to import Excel file. Send file with field name 'file'.",
        hint: "GET /api/student-family/template to download Excel template"
    });
});

// Create a new student family record
router.post('/', studentFamilyController.createStudentFamily);

// Get all student family records
router.get('/', studentFamilyController.getAllStudentFamilies);

// Get student family by student ID
router.get('/:id', studentFamilyController.getStudentFamilyById);

// Update student family by student ID
router.put('/:id', studentFamilyController.updateStudentFamilyById);

// Delete student family by student ID
router.delete('/:id', studentFamilyController.deleteStudentFamilyById);

export default router;
