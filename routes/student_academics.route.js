import { Router } from 'express';
import * as studentAcademicController from '../controller/student_academics.controller.js';
import logger from '../utils/logger.js';

const router = Router();

// Create a new student academic record
router.post('/', studentAcademicController.createStudentAcademic);

// Get all student academics
router.get('/', studentAcademicController.getAllStudentAcademics);

// Get students menu (student_id and name for dropdowns)
router.get('/menu', studentAcademicController.getStudentsMenu);

// Get academics with filters (specific route before :id)
router.get('/filter', studentAcademicController.getAcademicsWithFilters);

// Get academics by category
router.get('/category/:category', studentAcademicController.getAcademicsByCategory);

// Get student academic by student ID
router.get('/:id', studentAcademicController.getStudentAcademicById);

// Update student academic (full update)
router.put('/:id', studentAcademicController.updateStudentAcademicById);

// Patch student academic (partial update)
router.patch('/:id', studentAcademicController.patchStudentAcademicById);

// Delete student academic
router.delete('/:id', studentAcademicController.deleteStudentAcademicById);

export default router;
