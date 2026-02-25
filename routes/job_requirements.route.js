import { Router } from 'express';
import * as jobRequirementController from '../controller/job_requirements.controller.js';

const router = Router();

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
 * @route   GET /api/job-requirements/:id
 * @desc    Get job requirement by ID
 */
router.get('/:id', jobRequirementController.getJobRequirementById);



export default router;
