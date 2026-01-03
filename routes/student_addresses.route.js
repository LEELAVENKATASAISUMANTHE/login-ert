import { Router } from 'express';
import * as studentAddressController from '../controller/student_addresses.controller.js';
import logger from '../utils/logger.js';

const router = Router();

// Create a new student address
router.post('/', studentAddressController.createStudentAddress);

// Get all student addresses
router.get('/', studentAddressController.getAllStudentAddresses);

// Get students menu (student_id and name for dropdowns)
router.get('/menu', studentAddressController.getStudentsMenu);

// Get address by student ID (specific route before :id)
router.get('/student/:studentId', studentAddressController.getAddressByStudentId);

// Get student address by ID
router.get('/:id', studentAddressController.getStudentAddressById);

// Update student address (full update)
router.put('/:id', studentAddressController.updateStudentAddressById);

// Patch student address (partial update)
router.patch('/:id', studentAddressController.patchStudentAddressById);

// Delete student address
router.delete('/:id', studentAddressController.deleteStudentAddressById);

export default router;
