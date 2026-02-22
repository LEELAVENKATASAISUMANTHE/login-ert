import { Router } from 'express';
import * as jobRequirementController from '../controller/job_requirements.controller.js';

const router = Router();

/**
 * @route   POST /api/job-requirements
 * @desc    Create a new job requirement
 */
router.post('/', jobRequirementController.createJobRequirement);

/**
 * @route   GET /api/job-requirements
 * @desc    Get all job requirements (paginated, searchable)
 * @query   page, limit, sortBy, sortOrder, search
 */
router.get('/', jobRequirementController.getAllJobRequirements);

/**
 * @route   GET /api/job-requirements/job/:jobId
 * @desc    Get job requirement by Job ID
 */
router.get('/job/:jobId', jobRequirementController.getJobRequirementByJobId);

/**
 * @route   PUT /api/job-requirements/job/:jobId
 * @desc    Update job requirement by Job ID
 */
router.put('/job/:jobId', jobRequirementController.updateJobRequirementByJobId);

/**
 * @route   GET /api/job-requirements/:id
 * @desc    Get job requirement by ID
 */
router.get('/:id', jobRequirementController.getJobRequirementById);

/**
 * @route   PUT /api/job-requirements/:id
 * @desc    Update job requirement by ID
 */
router.put('/:id', jobRequirementController.updateJobRequirement);

/**
 * @route   DELETE /api/job-requirements/job/:jobId
 * @desc    Delete job requirement by Job ID
 */
router.delete('/job/:jobId', jobRequirementController.deleteJobRequirementByJobId);

/**
 * @route   DELETE /api/job-requirements/:id
 * @desc    Delete job requirement by ID
 */
router.delete('/:id', jobRequirementController.deleteJobRequirement);

export default router;
