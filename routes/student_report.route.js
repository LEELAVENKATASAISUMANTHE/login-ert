import express from 'express';
import {
    generateStudentReport,
    getStudentReportData,
    getAllStudentsSummary
} from '../controller/student_report.controller.js';

const router = express.Router();

// GET /api/student-report/summary - Get all students summary
router.get('/summary', getAllStudentsSummary);

// GET /api/student-report/:id/pdf - Generate PDF report for a student
router.get('/:id/pdf', generateStudentReport);

// GET /api/student-report/:id - Get student report data as JSON
router.get('/:id', getStudentReportData);

export default router;
