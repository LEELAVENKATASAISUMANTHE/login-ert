import express from 'express';
import * as applicationController from '../controller/applications.controller.js';

const router = express.Router();

// POST /applications - Create a new application
router.post('/', applicationController.createApplication);

// GET /applications - Get all applications with filtering and pagination
router.get('/', applicationController.getAllApplications);

// GET /applications/stats - Get application statistics
router.get('/stats', applicationController.getApplicationStats);

// POST /applications/check-eligibility - Check eligibility for student and job
router.post('/check-eligibility', applicationController.checkEligibility);

// POST /applications/bulk-eligibility-check - Run bulk eligibility check
router.post('/bulk-eligibility-check', applicationController.bulkEligibilityCheck);

// GET /applications/student/:studentId - Get applications by student ID
router.get('/student/:studentId', applicationController.getApplicationsByStudentId);

// GET /applications/job/:jobId - Get applications by job ID
router.get('/job/:jobId', applicationController.getApplicationsByJobId);

// GET /applications/:id - Get application by ID
router.get('/:id', applicationController.getApplicationById);

// PUT /applications/:id - Update application by ID
router.put('/:id', applicationController.updateApplication);

// DELETE /applications/:id - Delete application by ID
router.delete('/:id', applicationController.deleteApplication);

export default router;
