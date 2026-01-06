import logger from "../utils/logger.js";
import * as studentFamilyService from "../db/student_family.db.js";
import { parseExcelBuffer, validateColumns, generateExcelTemplate } from "../utils/excelParser.js";
import joi from "joi";

// Valid blood groups
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Validation schema for creating/updating student family record
const studentFamilySchema = joi.object({
    student_id: joi.string().required(),
    father_name: joi.string().max(150).optional().allow(null, ''),
    father_occupation: joi.string().max(150).optional().allow(null, ''),
    father_phone: joi.string().max(20).pattern(/^[0-9]{10}$/).optional().allow(null, '')
        .messages({ 'string.pattern.base': 'father_phone must be a 10-digit number' }),
    mother_name: joi.string().max(150).optional().allow(null, ''),
    mother_occupation: joi.string().max(150).optional().allow(null, ''),
    mother_phone: joi.string().max(20).pattern(/^[0-9]{10}$/).optional().allow(null, '')
        .messages({ 'string.pattern.base': 'mother_phone must be a 10-digit number' }),
    blood_group: joi.string().max(10).valid(...BLOOD_GROUPS).optional().allow(null, '')
        .messages({ 'any.only': `blood_group must be one of: ${BLOOD_GROUPS.join(', ')}` })
});

// Validation schema for Excel import (more lenient)
const importFamilySchema = joi.object({
    student_id: joi.string().required(),
    father_name: joi.string().max(150).optional().allow(null, ''),
    father_occupation: joi.string().max(150).optional().allow(null, ''),
    father_phone: joi.string().max(20).optional().allow(null, ''),
    mother_name: joi.string().max(150).optional().allow(null, ''),
    mother_occupation: joi.string().max(150).optional().allow(null, ''),
    mother_phone: joi.string().max(20).optional().allow(null, ''),
    blood_group: joi.string().max(10).optional().allow(null, '')
});

// Template columns for Excel import
const TEMPLATE_COLUMNS = [
    'student_id',
    'father_name',
    'father_occupation',
    'father_phone',
    'mother_name',
    'mother_occupation',
    'mother_phone',
    'blood_group'
];

const REQUIRED_COLUMNS = ['student_id'];

// Create a new student family record
export const createStudentFamily = async (req, res) => {
    try {
        const { error, value } = studentFamilySchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const family = await studentFamilyService.createStudentFamily(value);
        res.status(201).json(family);
    } catch (err) {
        logger.error("Error creating student family:", err);
        if (err.code === '23503') {
            return res.status(400).json({ message: "Student ID does not exist" });
        }
        if (err.code === '23505') {
            return res.status(400).json({ message: "Family record for this student already exists" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all student family records
export const getAllStudentFamilies = async (req, res) => {
    try {
        const result = await studentFamilyService.getAllStudentFamilies();
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student families:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get student family by student ID
export const getStudentFamilyById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await studentFamilyService.getStudentFamilyById(id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student family:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update student family by student ID
export const updateStudentFamilyById = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = studentFamilySchema.validate(req.body);

        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const result = await studentFamilyService.updateStudentFamilyById(id, value);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        logger.error("Error updating student family:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete student family by student ID
export const deleteStudentFamilyById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await studentFamilyService.deleteStudentFamilyById(id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        logger.error("Error deleting student family:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Import student family records from Excel file
export const importFromExcel = async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({
                success: false,
                message: "No Excel file uploaded. Please upload an .xlsx or .xls file."
            });
        }

        const parseResult = parseExcelBuffer(req.file.buffer);
        if (!parseResult.success) {
            return res.status(400).json(parseResult);
        }

        const columnValidation = validateColumns(parseResult.data, REQUIRED_COLUMNS);
        if (!columnValidation.success) {
            return res.status(400).json({
                success: false,
                message: columnValidation.message,
                requiredColumns: REQUIRED_COLUMNS,
                existingColumns: columnValidation.existingColumns
            });
        }

        const validatedData = [];
        const validationErrors = [];

        for (let i = 0; i < parseResult.data.length; i++) {
            const row = parseResult.data[i];
            const rowNumber = i + 2;

            const { error, value } = importFamilySchema.validate(row, { abortEarly: false });

            if (error) {
                validationErrors.push({
                    row: rowNumber,
                    errors: error.details.map(d => d.message)
                });
            } else {
                validatedData.push(value);
            }
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Validation failed for ${validationErrors.length} rows`,
                validationErrors,
                totalRows: parseResult.data.length,
                validRows: validatedData.length
            });
        }

        const result = await studentFamilyService.bulkInsertStudentFamilies(validatedData);
        res.status(result.success ? 201 : 400).json(result);
    } catch (err) {
        logger.error("Error importing student families from Excel:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Download Excel template for import
export const downloadTemplate = async (req, res) => {
    try {
        const sampleData = [
            ['STU001', 'John Smith Sr.', 'Engineer', '9876543210', 'Mary Smith', 'Teacher', '9876543211', 'O+'],
            ['STU002', 'Robert Johnson', 'Doctor', '9876543212', 'Jane Johnson', 'Nurse', '9876543213', 'A+']
        ];

        const buffer = generateExcelTemplate(TEMPLATE_COLUMNS, sampleData, 'Family');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=student_family_template.xlsx');
        res.send(buffer);
    } catch (err) {
        logger.error("Error generating template:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
