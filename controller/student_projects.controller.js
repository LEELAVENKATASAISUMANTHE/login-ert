import logger from "../utils/logger.js";
import * as studentProjectService from "../db/student_projects.db.js";
import { parseExcelBuffer, validateColumns, generateExcelTemplate } from "../utils/excelParser.js";
import joi from "joi";

// URL validation pattern
const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

// Validation schema for creating/updating student project record
const studentProjectSchema = joi.object({
    student_id: joi.string().required(),
    title: joi.string().max(200).required(),
    description: joi.string().optional().allow(null, ''),
    tools_used: joi.string().optional().allow(null, ''),
    repo_link: joi.string().max(300).pattern(urlPattern).optional().allow(null, '')
        .messages({
            'string.pattern.base': 'repo_link must be a valid URL (e.g., https://github.com/user/repo)'
        })
});

// Validation schema for Excel import (more lenient)
const importProjectSchema = joi.object({
    student_id: joi.string().required(),
    title: joi.string().max(200).optional().allow(null, ''),
    description: joi.string().optional().allow(null, ''),
    tools_used: joi.string().optional().allow(null, ''),
    repo_link: joi.string().max(300).optional().allow(null, '')
});

// Template columns for Excel import
const TEMPLATE_COLUMNS = [
    'student_id',
    'title',
    'description',
    'tools_used',
    'repo_link'
];

const REQUIRED_COLUMNS = ['student_id'];

// Create a new student project record
export const createStudentProject = async (req, res) => {
    try {
        const { error, value } = studentProjectSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const project = await studentProjectService.createStudentProject(value);
        res.status(201).json(project);
    } catch (err) {
        logger.error("Error creating student project:", err);
        if (err.code === '23503') {
            return res.status(400).json({ message: "Student ID does not exist" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all student projects
export const getAllStudentProjects = async (req, res) => {
    try {
        const result = await studentProjectService.getAllStudentProjects();
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student projects:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get student project by ID
export const getStudentProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await studentProjectService.getStudentProjectById(id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student project:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all projects for a specific student
export const getProjectsByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;
        const result = await studentProjectService.getProjectsByStudentId(studentId);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student projects:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Search projects by tools used
export const searchProjectsByTools = async (req, res) => {
    try {
        const { tools } = req.query;

        if (!tools || tools.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Please provide 'tools' query parameter (e.g., ?tools=React,Node.js)"
            });
        }

        const result = await studentProjectService.searchProjectsByTools(tools);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error searching projects by tools:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update student project by ID
export const updateStudentProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = studentProjectSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const result = await studentProjectService.updateStudentProjectById(id, value);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        logger.error("Error updating student project:", err);
        if (err.code === '23503') {
            return res.status(400).json({ message: "Student ID does not exist" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete student project by ID
export const deleteStudentProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await studentProjectService.deleteStudentProjectById(id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        logger.error("Error deleting student project:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Import student projects from Excel file
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

            const { error, value } = importProjectSchema.validate(row, { abortEarly: false });

            if (error) {
                validationErrors.push({
                    row: rowNumber,
                    errors: error.details.map(d => d.message)
                });
            } else {
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
        const result = await studentProjectService.bulkInsertStudentProjects(validatedData);

        res.status(result.success ? 201 : 400).json(result);
    } catch (err) {
        logger.error("Error importing student projects from Excel:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Download Excel template for import
export const downloadTemplate = async (req, res) => {
    try {
        // Sample data to help users understand the format
        const sampleData = [
            ['STU001', 'E-Commerce Platform', 'Full-stack shopping website with payment integration', 'React, Node.js, MongoDB, Stripe', 'https://github.com/student/ecommerce'],
            ['STU002', 'Weather App', 'Real-time weather forecasting application', 'Flutter, Dart, OpenWeather API', 'https://github.com/student/weather-app']
        ];

        const buffer = generateExcelTemplate(TEMPLATE_COLUMNS, sampleData, 'Projects');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=student_projects_template.xlsx');
        res.send(buffer);
    } catch (err) {
        logger.error("Error generating template:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
