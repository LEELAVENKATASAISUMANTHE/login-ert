import express from 'express';
import {
    generateStudentReport,
    getStudentReportData,
    getAllStudentsSummary
} from '../controller/student_report.controller.js';

const router = express.Router();

/**
 * @swagger
 * /student-report/summary:
 *   get:
 *     summary: Get all students summary
 *     tags: [Student Reports]
 *     responses:
 *       200:
 *         description: Students summary retrieved
 */
router.get('/summary', getAllStudentsSummary);

/**
 * @swagger
 * /student-report/{id}/pdf:
 *   get:
 *     summary: Generate PDF report for a student
 *     tags: [Student Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Student ID
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Student not found
 */
router.get('/:id/pdf', generateStudentReport);

/**
 * @swagger
 * /student-report/{id}:
 *   get:
 *     summary: Get student report data as JSON
 *     tags: [Student Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Student report data
 *       404:
 *         description: Student not found
 */
router.get('/:id', getStudentReportData);

export default router;
