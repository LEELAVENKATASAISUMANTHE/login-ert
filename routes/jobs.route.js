import { Router } from 'express';
import * as jobController from '../controller/jobs.controller.js';

const router = Router();

/**
 * @route   POST /api/jobs
 * @desc    Create a new job
 */
router.post('/', jobController.createJob);

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs (paginated, searchable)
 * @query   page, limit, sortBy, sortOrder, search
 */
router.get('/', jobController.getAllJobs);

/**
 * @route   GET /api/jobs/company/:companyId
 * @desc    Get jobs by company ID (paginated, searchable)
 * @query   page, limit, sortBy, sortOrder, search
 */
router.get('/company/:companyId', jobController.getJobsByCompanyId);

/**
 * @route   GET /api/jobs/:id
 * @desc    Get job by ID
 */
router.get('/:id', jobController.getJobById);

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update job by ID
 */
router.put('/:id', jobController.updateJob);

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Delete job by ID
 */
router.delete('/:id', jobController.deleteJob);

export default router;
