import { Router } from 'express';
import * as applicationController from '../controller/applications.controller.js';

const router = Router();

/**
 * @route   POST /api/applications
 * @desc    Create a new application
 */
router.post('/', applicationController.createApplication);

/**
 * @route   GET /api/applications
 * @desc    Get all applications (paginated, searchable, filterable)
 * @query   page, limit, sortBy, sortOrder, search, status, offer_type
 */
router.get('/', applicationController.getAllApplications);

/**
 * @route   GET /api/applications/student/:studentId
 * @desc    Get applications by student ID
 */
router.get('/student/:studentId', applicationController.getApplicationsByStudentId);

/**
 * @route   GET /api/applications/job/:jobId
 * @desc    Get applications by job ID
 */
router.get('/job/:jobId', applicationController.getApplicationsByJobId);

/**
 * @route   GET /api/applications/:id
 * @desc    Get application by ID
 */
router.get('/:id', applicationController.getApplicationById);

/**
 * @route   PUT /api/applications/:id
 * @desc    Update application by ID
 */
router.put('/:id', applicationController.updateApplication);

/**
 * @route   PATCH /api/applications/:id/status
 * @desc    Update application status only
 */
router.patch('/:id/status', applicationController.updateApplicationStatus);

/**
 * @route   DELETE /api/applications/:id
 * @desc    Delete application by ID
 */
router.delete('/:id', applicationController.deleteApplication);

export default router;
