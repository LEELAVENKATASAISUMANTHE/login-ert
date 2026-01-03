import logger from "../utils/logger.js";
import * as studentAcademicService from "../db/student_academics.db.js";
import joi from "joi";

// Validation schema for creating student academic record
const studentAcademicSchema = joi.object({
    student_id: joi.number().integer().required(),
    tenth_percent: joi.number().precision(2).min(0).max(100).required().allow(null),
    tenth_year: joi.number().integer().min(1900).max(2100).required().allow(null),
    tenth_board: joi.string().max(100).required(),
    tenth_school: joi.string().max(200).required(),
    twelfth_percent: joi.number().precision(2).min(0).max(100).optional().allow(null),
    twelfth_year: joi.number().integer().min(1900).max(2100).optional().allow(null),
    twelfth_board: joi.string().max(100).optional().allow(null, ''),
    twelfth_college: joi.string().max(200).optional().allow(null, ''),
    diploma_percent: joi.number().precision(2).min(0).max(100).optional().allow(null),
    diploma_year: joi.number().integer().min(1900).max(2100).optional().allow(null),
    diploma_college: joi.string().max(200).optional().allow(null, ''),
    ug_cgpa: joi.number().precision(2).min(0).max(10).required().allow(null),
    ug_year_of_passing: joi.number().integer().min(1900).max(2100).required().allow(null),
    pg_cgpa: joi.number().precision(2).min(0).max(10).optional().allow(null),
    history_of_backs: joi.number().integer().min(0).optional().allow(null),
    updated_arrears: joi.number().integer().min(0).optional().allow(null),
    gap_years: joi.number().integer().min(0).optional().allow(null),
    cet_rank: joi.number().integer().min(1).optional().allow(null),
    comedk_rank: joi.number().integer().min(1).optional().allow(null),
    category: joi.string().max(50).optional().allow(null, '')
});

// Validation schema for updating student academic record
const updateStudentAcademicSchema = joi.object({
    student_id: joi.number().integer().required(),
    tenth_percent: joi.number().precision(2).min(0).max(100).required(),
    tenth_year: joi.number().integer().min(1900).max(2100).required(),
    tenth_board: joi.string().max(100).required(),
    tenth_school: joi.string().max(200).required(),
    twelfth_percent: joi.number().precision(2).min(0).max(100).optional().allow(null),
    twelfth_year: joi.number().integer().min(1900).max(2100).optional().allow(null),
    twelfth_board: joi.string().max(100).optional().allow(null, ''),
    twelfth_college: joi.string().max(200).optional().allow(null, ''),
    diploma_percent: joi.number().precision(2).min(0).max(100).optional().allow(null),
    diploma_year: joi.number().integer().min(1900).max(2100).optional().allow(null),
    diploma_college: joi.string().max(200).optional().allow(null, ''),
    ug_cgpa: joi.number().precision(2).min(0).max(10).required(),
    ug_year_of_passing: joi.number().integer().min(1900).max(2100).required(),
    pg_cgpa: joi.number().precision(2).min(0).max(10).optional().allow(null),
    history_of_backs: joi.number().integer().min(0).optional().allow(null),
    updated_arrears: joi.number().integer().min(0).optional().allow(null),
    gap_years: joi.number().integer().min(0).optional().allow(null),
    cet_rank: joi.number().integer().min(1).optional().allow(null),
    comedk_rank: joi.number().integer().min(1).optional().allow(null),
    category: joi.string().max(50).optional().allow(null, '')
});

// Helper function to check if twelfth and diploma fields are mutually exclusive
const validateTwelfthDiplomaMutualExclusion = (data) => {
    const twelfthFields = ['twelfth_percent', 'twelfth_year', 'twelfth_board', 'twelfth_college'];
    const diplomaFields = ['diploma_percent', 'diploma_year', 'diploma_college'];

    const hasTwelfthData = twelfthFields.some(field => 
        data[field] !== null && data[field] !== undefined && data[field] !== ''
    );
    const hasDiplomaData = diplomaFields.some(field => 
        data[field] !== null && data[field] !== undefined && data[field] !== ''
    );

    if (hasTwelfthData && hasDiplomaData) {
        return {
            isValid: false,
            message: "Cannot fill both 12th and Diploma fields. Please choose either 12th or Diploma pathway."
        };
    }

    return { isValid: true };
};

// Create a new student academic record
export const createStudentAcademic = async (req, res) => {
    try {
        const { error, value } = studentAcademicSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Check mutual exclusion between 12th and Diploma
        const exclusionCheck = validateTwelfthDiplomaMutualExclusion(value);
        if (!exclusionCheck.isValid) {
            return res.status(400).json({ message: exclusionCheck.message });
        }

        const academic = await studentAcademicService.createStudentAcademic(value);
        res.status(201).json(academic);
    } catch (err) {
        logger.error("Error creating student academic record:", err);
        if (err.code === '23503') {
            return res.status(400).json({ message: "Student ID does not exist" });
        }
        if (err.code === '23505') {
            return res.status(400).json({ message: "Academic record for this student already exists" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all student academics
export const getAllStudentAcademics = async (req, res) => {
    try {
        const result = await studentAcademicService.getAllStudentAcademics();
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student academics:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get student academic by student ID
export const getStudentAcademicById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await studentAcademicService.getStudentAcademicById(id);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student academic:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get students menu for dropdowns
export const getStudentsMenu = async (req, res) => {
    try {
        const { search, searchField } = req.query;
        const result = await studentAcademicService.getStudentsMenu({ search, searchField });
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching students menu:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update student academic (full update)
export const updateStudentAcademicById = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateStudentAcademicSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Check mutual exclusion between 12th and Diploma
        const exclusionCheck = validateTwelfthDiplomaMutualExclusion(value);
        if (!exclusionCheck.isValid) {
            return res.status(400).json({ message: exclusionCheck.message });
        }

        const result = await studentAcademicService.updateStudentAcademicById(id, value);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error updating student academic:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Patch student academic (partial update)
export const patchStudentAcademicById = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateStudentAcademicSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Check mutual exclusion between 12th and Diploma
        const exclusionCheck = validateTwelfthDiplomaMutualExclusion(value);
        if (!exclusionCheck.isValid) {
            return res.status(400).json({ message: exclusionCheck.message });
        }

        const result = await studentAcademicService.patchStudentAcademicById(id, value);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error patching student academic:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete student academic
export const deleteStudentAcademicById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await studentAcademicService.deleteStudentAcademicById(id);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error deleting student academic:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get academics by category
export const getAcademicsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const result = await studentAcademicService.getAcademicsByCategory(category);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching academics by category:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get academics with filters
export const getAcademicsWithFilters = async (req, res) => {
    try {
        const { 
            minTenthPercent, 
            minTwelfthPercent, 
            minUgCgpa, 
            category, 
            maxHistoryOfBacks,
            ugYearOfPassing 
        } = req.query;

        const filters = {};
        if (minTenthPercent) filters.minTenthPercent = parseFloat(minTenthPercent);
        if (minTwelfthPercent) filters.minTwelfthPercent = parseFloat(minTwelfthPercent);
        if (minUgCgpa) filters.minUgCgpa = parseFloat(minUgCgpa);
        if (category) filters.category = category;
        if (maxHistoryOfBacks !== undefined) filters.maxHistoryOfBacks = parseInt(maxHistoryOfBacks);
        if (ugYearOfPassing) filters.ugYearOfPassing = parseInt(ugYearOfPassing);

        const result = await studentAcademicService.getAcademicsWithFilters(filters);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching filtered academics:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
