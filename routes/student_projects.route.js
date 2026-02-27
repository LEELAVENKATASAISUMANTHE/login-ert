import { Router } from 'express';
import * as studentProjectController from '../controller/student_projects.controller.js';
import { uploadExcel } from '../utils/multer.js';

const router = Router();

/**
 * @swagger
 * /student-projects/template:
 *   get:
 *     summary: Download Excel template for project import
 *     tags: [Student Projects]
 *     responses:
 *       200:
 *         description: Excel template file
 */
router.get('/template', studentProjectController.downloadTemplate);

/**
 * @swagger
 * /student-projects/search:
 *   get:
 *     summary: Search projects by tools used
 *     tags: [Student Projects]
 *     parameters:
 *       - in: query
 *         name: tools
 *         required: true
 *         schema: { type: string }
 *         example: React,Node.js
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Missing tools parameter
 */
router.get('/search', studentProjectController.searchProjectsByTools);

/**
 * @swagger
 * /student-projects/import:
 *   post:
 *     summary: Import projects from Excel file
 *     tags: [Student Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Import successful
 *       400:
 *         description: Validation errors
 */
router.post('/import', uploadExcel.single('file'), studentProjectController.importFromExcel);

router.get('/import', (req, res) => {
    res.status(405).json({
        success: false,
        message: "Use POST method to import Excel file. Send file with field name 'file'.",
        hint: "GET /api/student-projects/template to download Excel template"
    });
});

/**
 * @swagger
 * /student-projects:
 *   post:
 *     summary: Create a new student project
 *     tags: [Student Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [student_id, title]
 *             properties:
 *               student_id:
 *                 type: string
 *                 example: STU001
 *               title:
 *                 type: string
 *                 example: E-Commerce Platform
 *               description:
 *                 type: string
 *                 example: Full-stack shopping website
 *               tools_used:
 *                 type: string
 *                 example: React, Node.js, MongoDB
 *               repo_link:
 *                 type: string
 *                 format: uri
 *                 example: https://github.com/user/project
 *     responses:
 *       201:
 *         description: Project created
 *       400:
 *         description: Validation error
 */
router.post('/', studentProjectController.createStudentProject);

/**
 * @swagger
 * /student-projects:
 *   get:
 *     summary: Get all student projects
 *     tags: [Student Projects]
 *     responses:
 *       200:
 *         description: Projects retrieved
 */
router.get('/', studentProjectController.getAllStudentProjects);

/**
 * @swagger
 * /student-projects/student/{studentId}:
 *   get:
 *     summary: Get all projects for a specific student
 *     tags: [Student Projects]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Student projects retrieved
 */
router.get('/student/:studentId', studentProjectController.getProjectsByStudentId);

/**
 * @swagger
 * /student-projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Student Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Project retrieved
 *       404:
 *         description: Not found
 */
router.get('/:id', studentProjectController.getStudentProjectById);

/**
 * @swagger
 * /student-projects/{id}:
 *   put:
 *     summary: Update project by ID
 *     tags: [Student Projects]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               tools_used:
 *                 type: string
 *               repo_link:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated
 *       404:
 *         description: Not found
 */
router.put('/:id', studentProjectController.updateStudentProjectById);

/**
 * @swagger
 * /student-projects/{id}:
 *   delete:
 *     summary: Delete project by ID
 *     tags: [Student Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Project deleted
 *       404:
 *         description: Not found
 */
router.delete('/:id', studentProjectController.deleteStudentProjectById);

export default router;
