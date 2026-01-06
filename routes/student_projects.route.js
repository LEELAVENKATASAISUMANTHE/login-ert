import { Router } from 'express';
import * as studentProjectController from '../controller/student_projects.controller.js';
import { uploadExcel } from '../utils/multer.js';

const router = Router();

// Download Excel template (place before parameterized routes)
router.get('/template', studentProjectController.downloadTemplate);

// Search projects by tools used (place before :id route)
router.get('/search', studentProjectController.searchProjectsByTools);

// Import from Excel file (POST only)
router.post('/import', uploadExcel.single('file'), studentProjectController.importFromExcel);

// GET /import - return helpful error message
router.get('/import', (req, res) => {
    res.status(405).json({
        success: false,
        message: "Use POST method to import Excel file. Send file with field name 'file'.",
        hint: "GET /api/student-projects/template to download Excel template"
    });
});

// Create a new student project
router.post('/', studentProjectController.createStudentProject);

// Get all student projects
router.get('/', studentProjectController.getAllStudentProjects);

// Get all projects for a specific student
router.get('/student/:studentId', studentProjectController.getProjectsByStudentId);

// Get student project by ID
router.get('/:id', studentProjectController.getStudentProjectById);

// Update student project by ID
router.put('/:id', studentProjectController.updateStudentProjectById);

// Delete student project by ID
router.delete('/:id', studentProjectController.deleteStudentProjectById);

export default router;
