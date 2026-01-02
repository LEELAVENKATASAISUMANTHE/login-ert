import { Router } from 'express';
import * as studentController from '../controller/student.controller.js';
import { upload } from '../utils/multer.js';
import logger from '../utils/logger.js';

const router = Router();

// Create a new student
router.post('/', upload.single('student_photo'), studentController.createStudent);

// Get all students
router.get('/', studentController.getAllStudents);

// Get student by ID
router.get('/:id', studentController.getStudentById);

// Update student (full update)
router.put('/:id', upload.single('student_photo'), studentController.updateStudentById);

// Patch student (partial update)
router.patch('/:id', upload.single('student_photo'), studentController.patchStudentById);

// Delete student
router.delete('/:id', studentController.deleteStudentById);

export default router;