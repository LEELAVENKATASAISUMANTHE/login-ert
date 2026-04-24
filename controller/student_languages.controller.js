import logger from "../utils/logger.js";
import * as studentLanguageService from "../db/student_languages.db.js";
import { handleError } from "../utils/errors.js";
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
        logger.info({ student_id: req.body.student_id }, 'createStudentLanguage');
        const { error, value } = singleLanguageSchema.validate(req.body);
        if (error) {
            logger.warn({ message: error.details[0].message }, 'createStudentLanguage: validation failed');
            return res.status(400).json({
                message: error.details[0].message,
                allowedLanguages: ALLOWED_LANGUAGES
            });
        }

        const result = await studentLanguageService.createStudentLanguage(value);
        logger.info({ student_id: value.student_id }, 'createStudentLanguage: success');
        res.status(201).json(result);
    } catch (err) {
        return handleError(err, res, 'createStudentLanguage');
    }
};

// Bulk create languages
export const bulkCreateStudentLanguages = async (req, res) => {
    try {
        logger.info({ student_id: req.body.student_id }, 'bulkCreateStudentLanguages');
        const { student_id, languages } = req.body;

        if (!student_id) {
            logger.warn({ message: 'student_id is required' }, 'bulkCreateStudentLanguages: validation failed');
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
        logger.info({ student_id }, 'bulkCreateStudentLanguages: success');
        res.status(201).json(result);
    } catch (err) {
        return handleError(err, res, 'bulkCreateStudentLanguages');
    }
};

// Get all languages
export const getAllStudentLanguages = async (req, res) => {
    try {
        logger.info('getAllStudentLanguages');
        const result = await studentLanguageService.getAllStudentLanguages();
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'studentLanguages');
    }
};

// Get by lang_id
export const getStudentLanguageById = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info({ id }, 'getStudentLanguageById');
        const result = await studentLanguageService.getStudentLanguageById(id);

        if (!result.success) {
            logger.warn({ id }, 'getStudentLanguageById: not found');
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'studentLanguages');
    }
};

// Get all languages for a student
export const getLanguagesByStudentId = async (req, res) => {
    try {
        logger.info({ studentId: req.params.studentId }, 'getLanguagesByStudentId');
        const { studentId } = req.params;
        const result = await studentLanguageService.getLanguagesByStudentId(studentId);
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'studentLanguages');
    }
};

// Get student's top languages
export const getStudentTopLanguages = async (req, res) => {
    try {
        logger.info({ studentId: req.params.studentId }, 'getStudentTopLanguages');
        const { studentId } = req.params;
        const minLevel = parseInt(req.query.minLevel) || 7;
        const result = await studentLanguageService.getStudentTopLanguages(studentId, minLevel);
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'studentLanguages');
    }
};

// Get all students who know a language
export const getStudentsByLanguage = async (req, res) => {
    try {
        logger.info({ language: req.params.language }, 'getStudentsByLanguage');
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
        return handleError(err, res, 'studentLanguages');
    }
};

// Get experts in a language
export const getLanguageExperts = async (req, res) => {
    try {
        logger.info({ language: req.params.language }, 'getLanguageExperts');
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
        return handleError(err, res, 'studentLanguages');
    }
};

// Get proficient students
export const getProficientStudents = async (req, res) => {
    try {
        logger.info({ minLevel: req.query.minLevel }, 'getProficientStudents');
        const minLevel = parseInt(req.query.minLevel) || 7;

        if (minLevel < 1 || minLevel > 10) {
            return res.status(400).json({ message: "minLevel must be between 1 and 10" });
        }

        const result = await studentLanguageService.getProficientStudents(minLevel);
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'studentLanguages');
    }
};

// Advanced search
export const searchStudentLanguages = async (req, res) => {
    try {
        logger.info({ query: req.query }, 'searchStudentLanguages');
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
        return handleError(err, res, 'studentLanguages');
    }
};

// Menu for search bar
export const getStudentLanguagesMenu = async (req, res) => {
    try {
        logger.info({ search: req.query.search }, 'getStudentLanguagesMenu');
        const { search, searchField } = req.query;
        const searchParams = {
            search: search || '',
            searchField: searchField || ''
        };
        const result = await studentLanguageService.getStudentLanguagesMenu(searchParams);
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'studentLanguages');
    }
};

// Get allowed languages list
export const getAllowedLanguages = async (req, res) => {
    try {
        logger.info('getAllowedLanguages');
        res.status(200).json({
            success: true,
            data: ALLOWED_LANGUAGES,
            message: 'Allowed languages fetched successfully',
            count: ALLOWED_LANGUAGES.length
        });
    } catch (err) {
        return handleError(err, res, 'studentLanguages');
    }
};

// Update by lang_id
export const updateStudentLanguageById = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info({ id }, 'updateStudentLanguageById');
        const { error, value } = updateLanguageSchema.validate(req.body);

        if (error) {
            logger.warn({ message: error.details[0].message }, 'updateStudentLanguageById: validation failed');
            return res.status(400).json({
                message: error.details[0].message,
                allowedLanguages: ALLOWED_LANGUAGES
            });
        }

        const result = await studentLanguageService.updateStudentLanguageById(id, value);

        if (!result.success) {
            logger.warn({ id }, 'updateStudentLanguageById: not found');
            return res.status(404).json(result);
        }

        logger.info({ id }, 'updateStudentLanguageById: success');
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'updateStudentLanguage');
    }
};

// Bulk update student's languages
export const bulkUpdateStudentLanguages = async (req, res) => {
    try {
        const { studentId } = req.params;
        logger.info({ studentId }, 'bulkUpdateStudentLanguages');
        const { languages } = req.body;

        if (!languages || typeof languages !== 'object' || Object.keys(languages).length === 0) {
            logger.warn({ message: 'languages object is required with at least one language' }, 'bulkUpdateStudentLanguages: validation failed');
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
        logger.info({ studentId }, 'bulkUpdateStudentLanguages: success');
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'bulkUpdateStudentLanguages');
    }
};

// Delete by lang_id
export const deleteStudentLanguageById = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info({ id }, 'deleteStudentLanguageById');
        const result = await studentLanguageService.deleteStudentLanguageById(id);

        if (!result.success) {
            logger.warn({ id }, 'deleteStudentLanguageById: not found');
            return res.status(404).json(result);
        }

        logger.info({ id }, 'deleteStudentLanguageById: success');
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'studentLanguages');
    }
};

// Delete all languages for a student
export const deleteAllStudentLanguages = async (req, res) => {
    try {
        const { studentId } = req.params;
        logger.info({ studentId }, 'deleteAllStudentLanguages');
        const result = await studentLanguageService.deleteAllStudentLanguages(studentId);
        logger.info({ studentId }, 'deleteAllStudentLanguages: success');
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'studentLanguages');
    }
};

// Delete specific language for a student
export const deleteStudentSpecificLanguage = async (req, res) => {
    try {
        logger.info({ studentId: req.params.studentId, language: req.params.language }, 'deleteStudentSpecificLanguage');
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
            logger.warn({ studentId, language: matchedLang }, 'deleteStudentSpecificLanguage: not found');
            return res.status(404).json(result);
        }

        logger.info({ studentId, language: matchedLang }, 'deleteStudentSpecificLanguage: success');
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'studentLanguages');
    }
};
