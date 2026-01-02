import { Router } from 'express';
import * as studentController from '../controller/student.controller.js';
import logger from '../utils/logger.js';

const router = Router();

// Create a new student (JSON body with optional base64 photo)
router.post('/', studentController.createStudent);

// Get all students
router.get('/', studentController.getAllStudents);

// Get student by ID
router.get('/:id', studentController.getStudentById);

// Update student (full update)
router.put('/:id', studentController.updateStudentById);

// Patch student (partial update)
router.patch('/:id', studentController.patchStudentById);

// Delete student
router.delete('/:id', studentController.deleteStudentById);

export default router;