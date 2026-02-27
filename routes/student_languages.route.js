import { Router } from 'express';
import * as studentLanguageController from '../controller/student_languages.controller.js';

const router = Router();

// ===== CREATE OPERATIONS =====

/**
 * @swagger
 * /student-languages:
 *   post:
 *     summary: Create a single language entry
 *     tags: [Student Languages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [student_id, language, level]
 *             properties:
 *               student_id:
 *                 type: string
 *                 example: STU001
 *               language:
 *                 type: string
 *                 description: Must be from the allowed languages list
 *                 example: English
 *               level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 example: 8
 *     responses:
 *       201:
 *         description: Language entry created
 *       400:
 *         description: Validation error (includes allowedLanguages list)
 */
router.post('/', studentLanguageController.createStudentLanguage);

/**
 * @swagger
 * /student-languages/bulk:
 *   post:
 *     summary: Bulk create languages for a student
 *     tags: [Student Languages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [student_id, languages]
 *             properties:
 *               student_id:
 *                 type: string
 *                 example: STU001
 *               languages:
 *                 type: object
 *                 description: "Key-value pairs of language: level(1-10)"
 *                 example: { "English": 9, "Telugu": 10, "Hindi": 7 }
 *     responses:
 *       201:
 *         description: Languages created in bulk
 *       400:
 *         description: Validation error
 */
router.post('/bulk', studentLanguageController.bulkCreateStudentLanguages);

// ===== READ OPERATIONS - GENERAL =====

/**
 * @swagger
 * /student-languages:
 *   get:
 *     summary: Get all student languages
 *     tags: [Student Languages]
 *     responses:
 *       200:
 *         description: Languages retrieved
 */
router.get('/', studentLanguageController.getAllStudentLanguages);

/**
 * @swagger
 * /student-languages/allowed-languages:
 *   get:
 *     summary: Get the list of allowed languages
 *     tags: [Student Languages]
 *     responses:
 *       200:
 *         description: Allowed languages list
 */
router.get('/allowed-languages', studentLanguageController.getAllowedLanguages);

/**
 * @swagger
 * /student-languages/menu:
 *   get:
 *     summary: Get student languages menu for search bar
 *     tags: [Student Languages]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: searchField
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Menu data retrieved
 */
router.get('/menu', studentLanguageController.getStudentLanguagesMenu);

/**
 * @swagger
 * /student-languages/search:
 *   get:
 *     summary: Advanced search for student languages
 *     tags: [Student Languages]
 *     parameters:
 *       - in: query
 *         name: language
 *         schema: { type: string }
 *       - in: query
 *         name: minLevel
 *         schema: { type: integer, minimum: 1, maximum: 10 }
 *       - in: query
 *         name: maxLevel
 *         schema: { type: integer, minimum: 1, maximum: 10 }
 *       - in: query
 *         name: studentId
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', studentLanguageController.searchStudentLanguages);

/**
 * @swagger
 * /student-languages/proficient:
 *   get:
 *     summary: Get proficient students (level >= minLevel)
 *     tags: [Student Languages]
 *     parameters:
 *       - in: query
 *         name: minLevel
 *         schema: { type: integer, default: 7, minimum: 1, maximum: 10 }
 *     responses:
 *       200:
 *         description: Proficient students list
 */
router.get('/proficient', studentLanguageController.getProficientStudents);

// ===== READ OPERATIONS - BY LANGUAGE =====

/**
 * @swagger
 * /student-languages/language/{language}:
 *   get:
 *     summary: Get all students who know a specific language
 *     tags: [Student Languages]
 *     parameters:
 *       - in: path
 *         name: language
 *         required: true
 *         schema: { type: string }
 *         example: English
 *     responses:
 *       200:
 *         description: Students list
 *       400:
 *         description: Invalid language
 */
router.get('/language/:language', studentLanguageController.getStudentsByLanguage);

/**
 * @swagger
 * /student-languages/language/{language}/experts:
 *   get:
 *     summary: Get experts in a specific language
 *     tags: [Student Languages]
 *     parameters:
 *       - in: path
 *         name: language
 *         required: true
 *         schema: { type: string }
 *         example: Python
 *       - in: query
 *         name: minLevel
 *         schema: { type: integer, default: 7 }
 *     responses:
 *       200:
 *         description: Expert students list
 *       400:
 *         description: Invalid language
 */
router.get('/language/:language/experts', studentLanguageController.getLanguageExperts);

// ===== READ OPERATIONS - BY STUDENT =====

/**
 * @swagger
 * /student-languages/student/{studentId}:
 *   get:
 *     summary: Get all languages for a student
 *     tags: [Student Languages]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Student languages retrieved
 */
router.get('/student/:studentId', studentLanguageController.getLanguagesByStudentId);

/**
 * @swagger
 * /student-languages/student/{studentId}/top:
 *   get:
 *     summary: Get student's top languages
 *     tags: [Student Languages]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: minLevel
 *         schema: { type: integer, default: 7 }
 *     responses:
 *       200:
 *         description: Top languages retrieved
 */
router.get('/student/:studentId/top', studentLanguageController.getStudentTopLanguages);

// ===== UPDATE OPERATIONS =====

/**
 * @swagger
 * /student-languages/student/{studentId}/bulk:
 *   put:
 *     summary: Bulk update student's languages
 *     tags: [Student Languages]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [languages]
 *             properties:
 *               languages:
 *                 type: object
 *                 example: { "English": 9, "Telugu": 10 }
 *     responses:
 *       200:
 *         description: Languages updated
 */
router.put('/student/:studentId/bulk', studentLanguageController.bulkUpdateStudentLanguages);

/**
 * @swagger
 * /student-languages/{id}:
 *   put:
 *     summary: Update language entry by ID
 *     tags: [Student Languages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *               level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *     responses:
 *       200:
 *         description: Language updated
 *       404:
 *         description: Not found
 */
router.put('/:id', studentLanguageController.updateStudentLanguageById);

/**
 * @swagger
 * /student-languages/{id}:
 *   patch:
 *     summary: Partially update language entry by ID
 *     tags: [Student Languages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *     responses:
 *       200:
 *         description: Language patched
 *       404:
 *         description: Not found
 */
router.patch('/:id', studentLanguageController.updateStudentLanguageById);

// ===== DELETE OPERATIONS =====

/**
 * @swagger
 * /student-languages/student/{studentId}:
 *   delete:
 *     summary: Delete all languages for a student
 *     tags: [Student Languages]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: All languages deleted
 */
router.delete('/student/:studentId', studentLanguageController.deleteAllStudentLanguages);

/**
 * @swagger
 * /student-languages/student/{studentId}/{language}:
 *   delete:
 *     summary: Delete a specific language for a student
 *     tags: [Student Languages]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: language
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Language deleted
 *       404:
 *         description: Not found
 */
router.delete('/student/:studentId/:language', studentLanguageController.deleteStudentSpecificLanguage);

/**
 * @swagger
 * /student-languages/{id}:
 *   delete:
 *     summary: Delete language entry by ID
 *     tags: [Student Languages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Language deleted
 *       404:
 *         description: Not found
 */
router.delete('/:id', studentLanguageController.deleteStudentLanguageById);

/**
 * @swagger
 * /student-languages/{id}:
 *   get:
 *     summary: Get language entry by ID
 *     tags: [Student Languages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Language entry retrieved
 *       404:
 *         description: Not found
 */
router.get('/:id', studentLanguageController.getStudentLanguageById);

export default router;
