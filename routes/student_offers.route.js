import { Router } from 'express';
import * as studentOfferController from '../controller/student_offers.controller.js';

const router = Router();

/**
 * @route   POST /api/student-offers
 * @desc    Create a new student offer
 */
router.post('/', studentOfferController.createStudentOffer);

/**
 * @route   GET /api/student-offers
 * @desc    Get all student offers (paginated, filterable)
 * @query   page, limit, sortBy, sortOrder, is_primary_offer, is_pbc, is_internship
 */
router.get('/', studentOfferController.getAllStudentOffers);

/**
 * @route   GET /api/student-offers/student/:studentId
 * @desc    Get offers by student ID
 */
router.get('/student/:studentId', studentOfferController.getOffersByStudentId);

/**
 * @route   GET /api/student-offers/job/:jobId
 * @desc    Get offers by job ID
 */
router.get('/job/:jobId', studentOfferController.getOffersByJobId);

/**
 * @route   GET /api/student-offers/:id
 * @desc    Get student offer by ID
 */
router.get('/:id', studentOfferController.getStudentOfferById);

/**
 * @route   PUT /api/student-offers/:id
 * @desc    Update student offer by ID
 */
router.put('/:id', studentOfferController.updateStudentOffer);

/**
 * @route   DELETE /api/student-offers/:id
 * @desc    Delete student offer by ID
 */
router.delete('/:id', studentOfferController.deleteStudentOffer);

export default router;
