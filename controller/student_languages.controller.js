import logger from "../utils/logger.js";
import * as studentLanguageService from "../db/student_languages.db.js";
import { ALLOWED_LANGUAGES } from "../db/student_languages.db.js";
import joi from "joi";

// Validation schemas
const singleLanguageSchema = joi.object({
    student_id: joi.string().max(50).required(),
    language: joi.string().valid(...ALLOWED_LANGUAGES).required(),
    level: joi.number().integer().min(1).max(10).required()
});

const bulkLanguageSchema = joi.object({
    student_id: joi.string().max(50).required(),
    languages: joi.object().pattern(
        joi.string().valid(...ALLOWED_LANGUAGES),
        joi.number().integer().min(1).max(10)
    ).min(1).required()
});

const updateLanguageSchema = joi.object({
    student_id: joi.string().max(50).optional(),
    language: joi.string().valid(...ALLOWED_LANGUAGES).optional(),
    level: joi.number().integer().min(1).max(10).optional()
});

// Helper function to validate languages object
const validateLanguagesObject = (languages) => {
    const errors = [];
    for (const [language, level] of Object.entries(languages)) {
        if (!ALLOWED_LANGUAGES.includes(language)) {
            errors.push(`Invalid language '${language}'`);
        }
        if (typeof level !== 'number' || level < 1 || level > 10) {
            errors.push(`Invalid level '${level}' for ${language}. Must be 1-10`);
        }
    }
    return errors;
};

// Create single language
export const createStudentLanguage = async (req, res) => {
    try {
        const { error, value } = singleLanguageSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                message: error.details[0].message,
                allowedLanguages: ALLOWED_LANGUAGES
            });
        }

        const result = await studentLanguageService.createStudentLanguage(value);
        res.status(201).json(result);
    } catch (err) {
        logger.error("Error creating student language:", err);
        if (err.code === '23503') {
            return res.status(400).json({ message: "Student ID does not exist" });
        }
        if (err.code === '23505') {
            return res.status(400).json({ message: "This language already exists for this student" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// Bulk create languages
export const bulkCreateStudentLanguages = async (req, res) => {
    try {
        const { student_id, languages } = req.body;

        if (!student_id) {
            return res.status(400).json({ message: "student_id is required" });
        }

        if (!languages || typeof languages !== 'object' || Object.keys(languages).length === 0) {
            return res.status(400).json({ message: "languages object is required with at least one language" });
        }

        // Validate each language and level
        const validationErrors = validateLanguagesObject(languages);
        if (validationErrors.length > 0) {
            return res.status(400).json({ 
                message: validationErrors.join('. '),
                allowedLanguages: ALLOWED_LANGUAGES
            });
        }

        const result = await studentLanguageService.bulkCreateStudentLanguages(student_id, languages);
        res.status(201).json(result);
    } catch (err) {
        logger.error("Error bulk creating student languages:", err);
        if (err.code === '23503') {
            return res.status(400).json({ message: "Student ID does not exist" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all languages
export const getAllStudentLanguages = async (req, res) => {
    try {
        const result = await studentLanguageService.getAllStudentLanguages();
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student languages:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get by lang_id
export const getStudentLanguageById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await studentLanguageService.getStudentLanguageById(id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student language:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all languages for a student
export const getLanguagesByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;
        const result = await studentLanguageService.getLanguagesByStudentId(studentId);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student languages:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get student's top languages
export const getStudentTopLanguages = async (req, res) => {
    try {
        const { studentId } = req.params;
        const minLevel = parseInt(req.query.minLevel) || 7;
        const result = await studentLanguageService.getStudentTopLanguages(studentId, minLevel);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student top languages:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all students who know a language
export const getStudentsByLanguage = async (req, res) => {
    try {
        const { language } = req.params;

        // Validate language
        const matchedLang = ALLOWED_LANGUAGES.find(l => l.toLowerCase() === language.toLowerCase());
        if (!matchedLang) {
            return res.status(400).json({ 
                message: `Invalid language '${language}'`,
                allowedLanguages: ALLOWED_LANGUAGES
            });
        }

        const result = await studentLanguageService.getStudentsByLanguage(matchedLang);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching students by language:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get experts in a language
export const getLanguageExperts = async (req, res) => {
    try {
        const { language } = req.params;
        const minLevel = parseInt(req.query.minLevel) || 7;

        // Validate language
        const matchedLang = ALLOWED_LANGUAGES.find(l => l.toLowerCase() === language.toLowerCase());
        if (!matchedLang) {
            return res.status(400).json({ 
                message: `Invalid language '${language}'`,
                allowedLanguages: ALLOWED_LANGUAGES
            });
        }

        const result = await studentLanguageService.getLanguageExperts(matchedLang, minLevel);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching language experts:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get proficient students
export const getProficientStudents = async (req, res) => {
    try {
        const minLevel = parseInt(req.query.minLevel) || 7;

        if (minLevel < 1 || minLevel > 10) {
            return res.status(400).json({ message: "minLevel must be between 1 and 10" });
        }

        const result = await studentLanguageService.getProficientStudents(minLevel);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching proficient students:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Advanced search
export const searchStudentLanguages = async (req, res) => {
    try {
        const { language, minLevel, maxLevel, studentId, search } = req.query;

        // Validate language if provided
        if (language) {
            const matchedLang = ALLOWED_LANGUAGES.find(l => l.toLowerCase() === language.toLowerCase());
            if (!matchedLang) {
                return res.status(400).json({ 
                    message: `Invalid language '${language}'`,
                    allowedLanguages: ALLOWED_LANGUAGES
                });
            }
        }

        // Validate levels
        if (minLevel && (parseInt(minLevel) < 1 || parseInt(minLevel) > 10)) {
            return res.status(400).json({ message: "minLevel must be between 1 and 10" });
        }
        if (maxLevel && (parseInt(maxLevel) < 1 || parseInt(maxLevel) > 10)) {
            return res.status(400).json({ message: "maxLevel must be between 1 and 10" });
        }

        const searchParams = { language, minLevel, maxLevel, studentId, search };
        const result = await studentLanguageService.searchStudentLanguages(searchParams);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error searching student languages:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Menu for search bar
export const getStudentLanguagesMenu = async (req, res) => {
    try {
        const { search, searchField } = req.query;
        const searchParams = {
            search: search || '',
            searchField: searchField || ''
        };
        const result = await studentLanguageService.getStudentLanguagesMenu(searchParams);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching menu:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get allowed languages list
export const getAllowedLanguages = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: ALLOWED_LANGUAGES,
            message: 'Allowed languages fetched successfully',
            count: ALLOWED_LANGUAGES.length
        });
    } catch (err) {
        logger.error("Error fetching allowed languages:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update by lang_id
export const updateStudentLanguageById = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateLanguageSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ 
                message: error.details[0].message,
                allowedLanguages: ALLOWED_LANGUAGES
            });
        }

        const result = await studentLanguageService.updateStudentLanguageById(id, value);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        logger.error("Error updating student language:", err);
        if (err.code === '23503') {
            return res.status(400).json({ message: "Student ID does not exist" });
        }
        if (err.code === '23505') {
            return res.status(400).json({ message: "This language already exists for this student" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// Bulk update student's languages
export const bulkUpdateStudentLanguages = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { languages } = req.body;

        if (!languages || typeof languages !== 'object' || Object.keys(languages).length === 0) {
            return res.status(400).json({ message: "languages object is required with at least one language" });
        }

        // Validate each language and level
        const validationErrors = validateLanguagesObject(languages);
        if (validationErrors.length > 0) {
            return res.status(400).json({ 
                message: validationErrors.join('. '),
                allowedLanguages: ALLOWED_LANGUAGES
            });
        }

        const result = await studentLanguageService.bulkUpdateStudentLanguages(studentId, languages);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error bulk updating student languages:", err);
        if (err.code === '23503') {
            return res.status(400).json({ message: "Student ID does not exist" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete by lang_id
export const deleteStudentLanguageById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await studentLanguageService.deleteStudentLanguageById(id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        logger.error("Error deleting student language:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete all languages for a student
export const deleteAllStudentLanguages = async (req, res) => {
    try {
        const { studentId } = req.params;
        const result = await studentLanguageService.deleteAllStudentLanguages(studentId);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error deleting all student languages:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete specific language for a student
export const deleteStudentSpecificLanguage = async (req, res) => {
    try {
        const { studentId, language } = req.params;

        // Validate language
        const matchedLang = ALLOWED_LANGUAGES.find(l => l.toLowerCase() === language.toLowerCase());
        if (!matchedLang) {
            return res.status(400).json({ 
                message: `Invalid language '${language}'`,
                allowedLanguages: ALLOWED_LANGUAGES
            });
        }

        const result = await studentLanguageService.deleteStudentSpecificLanguage(studentId, matchedLang);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        logger.error("Error deleting student specific language:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
