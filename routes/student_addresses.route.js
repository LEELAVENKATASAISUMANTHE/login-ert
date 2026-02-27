import { Router } from 'express';
import * as studentAddressController from '../controller/student_addresses.controller.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @swagger
 * /student-addresses:
 *   post:
 *     summary: Create a new student address
 *     tags: [Student Addresses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [student_id]
 *             properties:
 *               student_id:
 *                 type: string
 *                 example: STU001
 *               permanent_address:
 *                 type: string
 *                 example: "123 Main Street"
 *               permanent_city:
 *                 type: string
 *                 example: Hyderabad
 *               permanent_state:
 *                 type: string
 *                 example: Telangana
 *               permanent_pin:
 *                 type: string
 *                 example: "500001"
 *               permanent_contact:
 *                 type: string
 *                 example: "9876543210"
 *               current_address:
 *                 type: string
 *               current_city:
 *                 type: string
 *               current_state:
 *                 type: string
 *               current_pin:
 *                 type: string
 *     responses:
 *       201:
 *         description: Address created
 *       400:
 *         description: Validation error
 */
router.post('/', studentAddressController.createStudentAddress);

/**
 * @swagger
 * /student-addresses:
 *   get:
 *     summary: Get all student addresses
 *     tags: [Student Addresses]
 *     responses:
 *       200:
 *         description: Addresses retrieved
 */
router.get('/', studentAddressController.getAllStudentAddresses);

/**
 * @swagger
 * /student-addresses/menu:
 *   get:
 *     summary: Get students menu for dropdowns
 *     tags: [Student Addresses]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: searchField
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Menu data retrieved
 */
router.get('/menu', studentAddressController.getStudentsMenu);

/**
 * @swagger
 * /student-addresses/student/{studentId}:
 *   get:
 *     summary: Get address by student ID
 *     tags: [Student Addresses]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Address retrieved
 *       404:
 *         description: Not found
 */
router.get('/student/:studentId', studentAddressController.getAddressByStudentId);

/**
 * @swagger
 * /student-addresses/{id}:
 *   get:
 *     summary: Get student address by ID
 *     tags: [Student Addresses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Address retrieved
 *       404:
 *         description: Not found
 */
router.get('/:id', studentAddressController.getStudentAddressById);

/**
 * @swagger
 * /student-addresses/{id}:
 *   put:
 *     summary: Update student address (full update)
 *     tags: [Student Addresses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permanent_address:
 *                 type: string
 *               permanent_city:
 *                 type: string
 *               permanent_state:
 *                 type: string
 *               permanent_pin:
 *                 type: string
 *               current_address:
 *                 type: string
 *               current_city:
 *                 type: string
 *               current_state:
 *                 type: string
 *               current_pin:
 *                 type: string
 *     responses:
 *       200:
 *         description: Address updated
 *       404:
 *         description: Not found
 */
router.put('/:id', studentAddressController.updateStudentAddressById);

/**
 * @swagger
 * /student-addresses/{id}:
 *   patch:
 *     summary: Partially update student address
 *     tags: [Student Addresses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permanent_city:
 *                 type: string
 *               current_city:
 *                 type: string
 *     responses:
 *       200:
 *         description: Address patched
 *       404:
 *         description: Not found
 */
router.patch('/:id', studentAddressController.patchStudentAddressById);

/**
 * @swagger
 * /student-addresses/{id}:
 *   delete:
 *     summary: Delete student address
 *     tags: [Student Addresses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Address deleted
 *       404:
 *         description: Not found
 */
router.delete('/:id', studentAddressController.deleteStudentAddressById);

export default router;
