import { Router } from 'express';
import * as jobController from '../controller/jobs.controller.js';

const router = Router();

/**
 * @swagger
 * /jobs:
 *   get:
 *     summary: Get all jobs (paginated, searchable)
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [ASC, DESC] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Jobs retrieved
 */
router.get('/', jobController.getAllJobs);

/**
 * @swagger
 * /jobs/company/{companyId}:
 *   get:
 *     summary: Get jobs by company ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Company jobs retrieved
 */
router.get('/company/:companyId', jobController.getJobsByCompanyId);

/**
 * @swagger
 * /jobs/{id}:
 *   get:
 *     summary: Get job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Job retrieved
 *       404:
 *         description: Not found
 */
router.get('/:id', jobController.getJobById);

/**
 * @swagger
 * /jobs/{id}:
 *   put:
 *     summary: Update job by ID
 *     tags: [Jobs]
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
 *               job_title:
 *                 type: string
 *               job_description:
 *                 type: string
 *               job_type:
 *                 type: string
 *               ctc_lpa:
 *                 type: number
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Job updated
 *       404:
 *         description: Not found
 */
router.put('/:id', jobController.updateJob);

/**
 * @swagger
 * /jobs/{id}:
 *   delete:
 *     summary: Delete job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Job deleted
 *       404:
 *         description: Not found
 */
router.delete('/:id', jobController.deleteJob);

export default router;
