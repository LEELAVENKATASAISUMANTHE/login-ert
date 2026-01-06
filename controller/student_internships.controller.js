import logger from "../utils/logger.js";
import * as studentInternshipService from "../db/student_internships.db.js";
import { parseExcelBuffer, validateColumns, generateExcelTemplate } from "../utils/excelParser.js";
import joi from "joi";

// Validation schema for creating/updating student internship record
const studentInternshipSchema = joi.object({
    student_id: joi.string().required(),
    organization: joi.string().max(200).optional().allow(null, ''),
    skills_acquired: joi.string().optional().allow(null, ''),
    duration: joi.string().max(50).optional().allow(null, ''),
    start_date: joi.date().optional().allow(null, ''),
    end_date: joi.date().optional().allow(null, ''),
    description: joi.string().optional().allow(null, ''),
    stipend: joi.number().precision(2).min(0).optional().allow(null)
});

// Validation schema for Excel import (more lenient for bulk operations)
const importInternshipSchema = joi.object({
    student_id: joi.string().required(),
    organization: joi.string().max(200).optional().allow(null, ''),
    skills_acquired: joi.string().optional().allow(null, ''),
    duration: joi.string().max(50).optional().allow(null, ''),
    start_date: joi.alternatives().try(
        joi.date(),
        joi.string().allow(null, '')
    ).optional(),
    end_date: joi.alternatives().try(
        joi.date(),
        joi.string().allow(null, '')
    ).optional(),
    description: joi.string().optional().allow(null, ''),
    stipend: joi.alternatives().try(
        joi.number().precision(2).min(0),
        joi.string().allow(null, '')
    ).optional()
});

// Template columns for Excel import
const TEMPLATE_COLUMNS = [
    'student_id',
    'organization',
    'skills_acquired',
    'duration',
    'start_date',
    'end_date',
    'description',
    'stipend'
];

const REQUIRED_COLUMNS = ['student_id'];

// Create a new student internship record
export const createStudentInternship = async (req, res) => {
    try {
        const { error, value } = studentInternshipSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const internship = await studentInternshipService.createStudentInternship(value);
        res.status(201).json(internship);
    } catch (err) {
        logger.error("Error creating student internship:", err);
        if (err.code === '23503') {
            return res.status(400).json({ message: "Student ID does not exist" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all student internships
export const getAllStudentInternships = async (req, res) => {
    try {
        const result = await studentInternshipService.getAllStudentInternships();
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student internships:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get student internship by ID
export const getStudentInternshipById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await studentInternshipService.getStudentInternshipById(id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student internship:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all internships for a specific student
export const getInternshipsByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;
        const result = await studentInternshipService.getInternshipsByStudentId(studentId);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student internships:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update student internship by ID
export const updateStudentInternshipById = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = studentInternshipSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const result = await studentInternshipService.updateStudentInternshipById(id, value);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        logger.error("Error updating student internship:", err);
        if (err.code === '23503') {
            return res.status(400).json({ message: "Student ID does not exist" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete student internship by ID
export const deleteStudentInternshipById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await studentInternshipService.deleteStudentInternshipById(id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        logger.error("Error deleting student internship:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Import student internships from Excel file
export const importFromExcel = async (req, res) => {
    try {
        // Check if file exists
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({
                success: false,
                message: "No Excel file uploaded. Please upload an .xlsx or .xls file."
            });
        }

        // Parse Excel file
        const parseResult = parseExcelBuffer(req.file.buffer);
        if (!parseResult.success) {
            return res.status(400).json(parseResult);
        }

        // Validate required columns
        const columnValidation = validateColumns(parseResult.data, REQUIRED_COLUMNS);
        if (!columnValidation.success) {
            return res.status(400).json({
                success: false,
                message: columnValidation.message,
                requiredColumns: REQUIRED_COLUMNS,
                existingColumns: columnValidation.existingColumns
            });
        }

        // Validate each row
        const validatedData = [];
        const validationErrors = [];

        for (let i = 0; i < parseResult.data.length; i++) {
            const row = parseResult.data[i];
            const rowNumber = i + 2; // Excel row number (1-indexed, +1 for header)

            const { error, value } = importInternshipSchema.validate(row, { abortEarly: false });

            if (error) {
                validationErrors.push({
                    row: rowNumber,
                    errors: error.details.map(d => d.message)
                });
            } else {
                // Convert string dates to proper format if needed
                if (value.start_date && typeof value.start_date === 'string') {
                    value.start_date = value.start_date || null;
                }
                if (value.end_date && typeof value.end_date === 'string') {
                    value.end_date = value.end_date || null;
                }
                // Convert stipend to number if string
                if (value.stipend && typeof value.stipend === 'string') {
                    value.stipend = parseFloat(value.stipend) || null;
                }
                validatedData.push(value);
            }
        }

        // If there are validation errors, return them
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Validation failed for ${validationErrors.length} rows`,
                validationErrors,
                totalRows: parseResult.data.length,
                validRows: validatedData.length
            });
        }

        // Bulk insert validated data
        const result = await studentInternshipService.bulkInsertStudentInternships(validatedData);

        res.status(result.success ? 201 : 400).json(result);
    } catch (err) {
        logger.error("Error importing student internships from Excel:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Download Excel template for import
export const downloadTemplate = async (req, res) => {
    try {
        // Sample data to help users understand the format
        const sampleData = [
            ['STU001', 'Google India', 'Python, Machine Learning, Cloud Computing', '3 months', '2025-06-01', '2025-08-31', 'Worked on ML pipeline development', '25000.00'],
            ['STU002', 'Microsoft', 'Azure, .NET, DevOps', '6 months', '2025-01-15', '2025-07-15', 'Cloud infrastructure development', '30000.00']
        ];

        const buffer = generateExcelTemplate(TEMPLATE_COLUMNS, sampleData, 'Internships');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=student_internships_template.xlsx');
        res.send(buffer);
    } catch (err) {
        logger.error("Error generating template:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
