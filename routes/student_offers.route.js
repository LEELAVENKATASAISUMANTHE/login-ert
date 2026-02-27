import { Router } from 'express';
import * as studentOfferController from '../controller/student_offers.controller.js';

const router = Router();

/**
 * @swagger
 * /student-offers:
 *   post:
 *     summary: Create a new student offer
 *     tags: [Student Offers]
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
 *               job_id:
 *                 type: integer
 *                 description: Required for on-campus offers
 *                 example: 5
 *               offered_at:
 *                 type: string
 *                 format: date-time
 *               is_primary_offer:
 *                 type: boolean
 *                 default: false
 *               is_pbc:
 *                 type: boolean
 *                 default: false
 *               is_internship:
 *                 type: boolean
 *                 default: false
 *               is_offcampus:
 *                 type: boolean
 *                 default: false
 *               offcampus_company_name:
 *                 type: string
 *                 description: Required if is_offcampus is true
 *               offcampus_job_title:
 *                 type: string
 *               offcampus_location:
 *                 type: string
 *               offer_ctc:
 *                 type: number
 *                 example: 12.5
 *               offer_stipend:
 *                 type: number
 *                 example: 25000
 *               remarks:
 *                 type: string
 *     responses:
 *       201:
 *         description: Offer created
 *       400:
 *         description: Validation error
 *       404:
 *         description: Student or Job not found
 *       409:
 *         description: Offer already exists
 */
router.post('/', studentOfferController.createStudentOffer);

/**
 * @swagger
 * /student-offers:
 *   get:
 *     summary: Get all student offers (paginated, filterable)
 *     tags: [Student Offers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [offer_id, student_id, job_id, offered_at, offer_ctc, offer_stipend] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [ASC, DESC] }
 *       - in: query
 *         name: is_primary_offer
 *         schema: { type: boolean }
 *       - in: query
 *         name: is_pbc
 *         schema: { type: boolean }
 *       - in: query
 *         name: is_internship
 *         schema: { type: boolean }
 *       - in: query
 *         name: is_offcampus
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Offers retrieved
 */
router.get('/', studentOfferController.getAllStudentOffers);

/**
 * @swagger
 * /student-offers/student/{studentId}:
 *   get:
 *     summary: Get offers by student ID
 *     tags: [Student Offers]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Student offers retrieved
 */
router.get('/student/:studentId', studentOfferController.getOffersByStudentId);

/**
 * @swagger
 * /student-offers/job/{jobId}:
 *   get:
 *     summary: Get offers by job ID
 *     tags: [Student Offers]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Job offers retrieved
 */
router.get('/job/:jobId', studentOfferController.getOffersByJobId);

/**
 * @swagger
 * /student-offers/{id}:
 *   get:
 *     summary: Get student offer by ID
 *     tags: [Student Offers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Offer retrieved
 *       404:
 *         description: Not found
 */
router.get('/:id', studentOfferController.getStudentOfferById);

/**
 * @swagger
 * /student-offers/{id}:
 *   put:
 *     summary: Update student offer by ID
 *     tags: [Student Offers]
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
 *               is_primary_offer:
 *                 type: boolean
 *               is_pbc:
 *                 type: boolean
 *               offer_ctc:
 *                 type: number
 *               offer_stipend:
 *                 type: number
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Offer updated
 *       404:
 *         description: Not found
 */
router.put('/:id', studentOfferController.updateStudentOffer);

/**
 * @swagger
 * /student-offers/{id}:
 *   delete:
 *     summary: Delete student offer by ID
 *     tags: [Student Offers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Offer deleted
 *       404:
 *         description: Not found
 */
router.delete('/:id', studentOfferController.deleteStudentOffer);

export default router;
