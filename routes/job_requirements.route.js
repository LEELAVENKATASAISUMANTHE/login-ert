import { Router } from 'express';
import * as jobRequirementController from '../controller/job_requirements.controller.js';

const router = Router();

/**
 * @swagger
 * /job-requirements:
 *   get:
 *     summary: Get all job requirements (paginated, searchable)
 *     tags: [Job Requirements]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: job_requirement_id }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [ASC, DESC], default: DESC }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Job requirements retrieved
 */
router.get('/', jobRequirementController.getAllJobRequirements);

/**
 * @swagger
 * /job-requirements/job/{jobId}:
 *   get:
 *     summary: Get job requirement by Job ID
 *     tags: [Job Requirements]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Job requirement retrieved
 *       404:
 *         description: Not found
 */
router.get('/job/:jobId', jobRequirementController.getJobRequirementByJobId);

/**
 * @swagger
 * /job-requirements/{id}:
 *   get:
 *     summary: Get job requirement by ID
 *     tags: [Job Requirements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Job requirement retrieved
 *       404:
 *         description: Not found
 */
router.get('/:id', jobRequirementController.getJobRequirementById);

export default router;
