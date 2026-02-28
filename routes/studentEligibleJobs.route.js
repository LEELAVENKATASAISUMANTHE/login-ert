import { Router } from "express";
import { getEligibleJobs } from "../controller/studentEligibleJobs.controller.js";

const router = Router();

/**
 * @swagger
 * /students/{studentId}/eligible-jobs:
 *   get:
 *     summary: Get all eligible jobs for a student
 *     description: |
 *       Reads the Redis sorted set `student:{studentId}:jobs` (written by the eligibility service)
 *       and fetches full job details from PostgreSQL. Results are sorted by deadline (earliest first).
 *     tags: [Student Eligible Jobs]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         example: 1BY23CS132
 *         description: The student ID (e.g. 1BY23CS132)
 *     responses:
 *       200:
 *         description: Eligible jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Found 3 eligible job(s) for 1BY23CS132
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 3
 *                     jobs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           job_id:
 *                             type: integer
 *                             example: 101
 *                           company_name:
 *                             type: string
 *                             example: Google
 *                           job_title:
 *                             type: string
 *                             example: Software Engineer
 *                           application_deadline:
 *                             type: string
 *                             format: date-time
 *                           redis_deadline_ms:
 *                             type: number
 *                             example: 1741219200000
 *       400:
 *         description: Missing studentId
 *       500:
 *         description: Internal server error
 */
router.get("/:studentId/eligible-jobs", getEligibleJobs);

export default router;
