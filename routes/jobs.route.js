import { Router } from 'express';
import * as jobController from '../controller/jobs.controller.js';

const router = Router();

/**
 * @swagger
 * /jobs:
 *   post:
 *     summary: Create a new job
 *     tags: [Jobs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [company_id, job_title]
 *             properties:
 *               company_id:
 *                 type: integer
 *               job_title:
 *                 type: string
 *               job_description:
 *                 type: string
 *               job_type:
 *                 type: string
 *               ctc_lpa:
 *                 type: number
 *               stipend_per_month:
 *                 type: number
 *               location:
 *                 type: string
 *               interview_mode:
 *                 type: string
 *               application_deadline:
 *                 type: string
 *                 format: date
 *               drive_date:
 *                 type: string
 *                 format: date
 *               year_of_graduation:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Job created
 *       400:
 *         description: Validation error
 *       404:
 *         description: Company not found
 */
router.post('/', jobController.createJob);

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
