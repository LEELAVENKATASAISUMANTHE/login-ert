import express from 'express';
import * as applicationController from '../controller/applications.controller.js';

const router = express.Router();

/**
 * @swagger
 * /applications:
 *   post:
 *     summary: Create a new application
 *     tags: [Applications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [student_id, job_id]
 *             properties:
 *               student_id:
 *                 type: string
 *                 example: STU2024001
 *               job_id:
 *                 type: integer
 *                 example: 5
 *               status:
 *                 type: string
 *                 example: APPLIED
 *     responses:
 *       201:
 *         description: Application created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Application already exists for this student and job
 *       500:
 *         description: Internal server error
 */
// POST /applications - Create a new application
router.post('/', applicationController.createApplication);

/**
 * @swagger
 * /applications:
 *   get:
 *     summary: Get all applications with filtering and pagination
 *     tags: [Applications]
 *     parameters:
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: string
 *         description: Filter by student ID
 *       - in: query
 *         name: job_id
 *         schema:
 *           type: integer
 *         description: Filter by job ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by application status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Paginated list of applications
 *       500:
 *         description: Internal server error
 */
// GET /applications - Get all applications with filtering and pagination
router.get('/', applicationController.getAllApplications);

/**
 * @swagger
 * /applications/stats:
 *   get:
 *     summary: Get application statistics
 *     tags: [Applications]
 *     responses:
 *       200:
 *         description: Application statistics (counts by status, job, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 150
 *                 by_status:
 *                   type: object
 *                   example: { APPLIED: 80, SHORTLISTED: 40, REJECTED: 30 }
 *       500:
 *         description: Internal server error
 */
// GET /applications/stats - Get application statistics
router.get('/stats', applicationController.getApplicationStats);

/**
 * @swagger
 * /applications/check-eligibility:
 *   post:
 *     summary: Check if a student is eligible for a job
 *     tags: [Applications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [student_id, job_id]
 *             properties:
 *               student_id:
 *                 type: string
 *                 example: STU2024001
 *               job_id:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       200:
 *         description: Eligibility check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 eligible:
 *                   type: boolean
 *                   example: true
 *                 reasons:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: []
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
// POST /applications/check-eligibility - Check eligibility for student and job
router.post('/check-eligibility', applicationController.checkEligibility);

/**
 * @swagger
 * /applications/bulk-eligibility-check:
 *   post:
 *     summary: Run a bulk eligibility check for multiple students or jobs
 *     tags: [Applications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               job_id:
 *                 type: integer
 *                 example: 5
 *                 description: Check all students against this job
 *               student_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [STU2024001, STU2024002]
 *                 description: Specific student IDs to check (optional)
 *     responses:
 *       200:
 *         description: Bulk eligibility results
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
// POST /applications/bulk-eligibility-check - Run bulk eligibility check
router.post('/bulk-eligibility-check', applicationController.bulkEligibilityCheck);

/**
 * @swagger
 * /applications/student/{studentId}:
 *   get:
 *     summary: Get all applications by student ID
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         example: STU2024001
 *         description: Student ID
 *     responses:
 *       200:
 *         description: List of applications for the student
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal server error
 */
// GET /applications/student/:studentId - Get applications by student ID
router.get('/student/:studentId', applicationController.getApplicationsByStudentId);

/**
 * @swagger
 * /applications/job/{jobId}:
 *   get:
 *     summary: Get all applications for a job
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 5
 *         description: Job ID
 *     responses:
 *       200:
 *         description: List of applications for the job
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
// GET /applications/job/:jobId - Get applications by job ID
router.get('/job/:jobId', applicationController.getApplicationsByJobId);

/**
 * @swagger
 * /applications/{id}:
 *   get:
 *     summary: Get an application by ID
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application data
 *       404:
 *         description: Application not found
 *       500:
 *         description: Internal server error
 */
// GET /applications/:id - Get application by ID
router.get('/:id', applicationController.getApplicationById);

/**
 * @swagger
 * /applications/{id}:
 *   put:
 *     summary: Update an application by ID
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: SHORTLISTED
 *               notes:
 *                 type: string
 *                 example: Strong candidate
 *     responses:
 *       200:
 *         description: Application updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Application not found
 *       500:
 *         description: Internal server error
 */
// PUT /applications/:id - Update application by ID
router.put('/:id', applicationController.updateApplication);

/**
 * @swagger
 * /applications/{id}:
 *   delete:
 *     summary: Delete an application by ID
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application deleted successfully
 *       404:
 *         description: Application not found
 *       500:
 *         description: Internal server error
 */
// DELETE /applications/:id - Delete application by ID
router.delete('/:id', applicationController.deleteApplication);

export default router;
