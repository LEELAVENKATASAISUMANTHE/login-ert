import { Router } from 'express';
import * as studentLanguageController from '../controller/student_languages.controller.js';

const router = Router();

// ===== CREATE OPERATIONS =====

// Create single language entry
router.post('/', studentLanguageController.createStudentLanguage);

// Bulk create languages for a student
router.post('/bulk', studentLanguageController.bulkCreateStudentLanguages);

// ===== READ OPERATIONS - GENERAL =====

// Get all student languages
router.get('/', studentLanguageController.getAllStudentLanguages);

// Get allowed languages list
router.get('/allowed-languages', studentLanguageController.getAllowedLanguages);

// Menu for search bar
router.get('/menu', studentLanguageController.getStudentLanguagesMenu);

// Advanced search
router.get('/search', studentLanguageController.searchStudentLanguages);

// Get proficient students (level >= minLevel)
router.get('/proficient', studentLanguageController.getProficientStudents);

// ===== READ OPERATIONS - BY LANGUAGE =====

// Get all students who know a specific language
router.get('/language/:language', studentLanguageController.getStudentsByLanguage);

// Get experts in a specific language (level >= 7)
router.get('/language/:language/experts', studentLanguageController.getLanguageExperts);

// ===== READ OPERATIONS - BY STUDENT =====

// Get all languages for a student
router.get('/student/:studentId', studentLanguageController.getLanguagesByStudentId);

// Get student's top languages (level >= 7)
router.get('/student/:studentId/top', studentLanguageController.getStudentTopLanguages);

// ===== UPDATE OPERATIONS =====

// Bulk update student's languages
router.put('/student/:studentId/bulk', studentLanguageController.bulkUpdateStudentLanguages);

// Update by lang_id (full update)
router.put('/:id', studentLanguageController.updateStudentLanguageById);

// Patch by lang_id (partial update)
router.patch('/:id', studentLanguageController.updateStudentLanguageById);

// ===== DELETE OPERATIONS =====

// Delete all languages for a student
router.delete('/student/:studentId', studentLanguageController.deleteAllStudentLanguages);

// Delete specific language for a student
router.delete('/student/:studentId/:language', studentLanguageController.deleteStudentSpecificLanguage);

// Delete by lang_id
router.delete('/:id', studentLanguageController.deleteStudentLanguageById);

// ===== GET BY ID (must be last to avoid conflicts) =====

// Get by lang_id
router.get('/:id', studentLanguageController.getStudentLanguageById);

export default router;
