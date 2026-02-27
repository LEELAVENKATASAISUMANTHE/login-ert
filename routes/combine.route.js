import { Router } from "express";
import * as combineController from "../controller/combine.controller.js";

const router = Router();

/**
 * @swagger
 * /jobs-with-requirements:
 *   post:
 *     summary: Create job and job requirements in one request
 *     tags: [Combined Job + Requirements]
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
 *                 example: 1
 *               job_title:
 *                 type: string
 *                 example: Software Engineer
 *               job_description:
 *                 type: string
 *                 example: Full-stack development role
 *               job_type:
 *                 type: string
 *                 example: Full-Time
 *               ctc_lpa:
 *                 type: number
 *                 example: 12.5
 *               stipend_per_month:
 *                 type: number
 *                 example: 25000
 *               location:
 *                 type: string
 *                 example: Hyderabad
 *               application_deadline:
 *                 type: string
 *                 format: date
 *               allowed_branches:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["CSE", "ECE", "IT"]
 *               ug_cgpa:
 *                 type: number
 *                 example: 7.0
 *               tenth_percent:
 *                 type: number
 *                 example: 60
 *               twelfth_percent:
 *                 type: number
 *                 example: 60
 *               backlogs_allowed:
 *                 type: integer
 *                 example: 0
 *     responses:
 *       201:
 *         description: Job and requirements created
 *       400:
 *         description: Validation error
 */
router.post("/", combineController.createCombinedJob);

/**
 * @swagger
 * /jobs-with-requirements/{jobId}:
 *   put:
 *     summary: Full update of job and job requirements
 *     tags: [Combined Job + Requirements]
 *     parameters:
 *       - in: path
 *         name: jobId
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
 *               ctc_lpa:
 *                 type: number
 *               allowed_branches:
 *                 type: array
 *                 items: { type: string }
 *               ug_cgpa:
 *                 type: number
 *     responses:
 *       200:
 *         description: Job and requirements updated
 *       404:
 *         description: Job not found
 */
router.put("/:jobId", combineController.updateCombinedJob);

export default router;