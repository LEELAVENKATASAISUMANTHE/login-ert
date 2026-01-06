import logger from "../utils/logger.js";
import * as studentCertificationService from "../db/student_certifications.db.js";
import { parseExcelBuffer, validateColumns, generateExcelTemplate } from "../utils/excelParser.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import joi from "joi";

// Validation schema for creating/updating student certification record
const studentCertificationSchema = joi.object({
    student_id: joi.string().required(),
    skill_name: joi.string().max(200).required(),
    duration: joi.string().max(50).optional().allow(null, ''),
    vendor: joi.string().max(200).optional().allow(null, '')
});

// Validation schema for updating (includes certificate_file)
const updateCertificationSchema = joi.object({
    student_id: joi.string().required(),
    skill_name: joi.string().max(200).required(),
    duration: joi.string().max(50).optional().allow(null, ''),
    vendor: joi.string().max(200).optional().allow(null, ''),
    certificate_file: joi.string().optional().allow(null, '')
});

// Validation schema for Excel import
const importCertificationSchema = joi.object({
    student_id: joi.string().required(),
    skill_name: joi.string().max(200).optional().allow(null, ''),
    duration: joi.string().max(50).optional().allow(null, ''),
    vendor: joi.string().max(200).optional().allow(null, ''),
    certificate_file: joi.string().optional().allow(null, '')
});

// Template columns for Excel import
const TEMPLATE_COLUMNS = [
    'student_id',
    'skill_name',
    'duration',
    'vendor',
    'certificate_file'
];

const REQUIRED_COLUMNS = ['student_id'];

// Create a new student certification record (with file upload)
export const createStudentCertification = async (req, res) => {
    try {
        const { error, value } = studentCertificationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Handle file upload to Cloudinary
        if (req.file && req.file.buffer && req.file.buffer.length > 0) {
            const cloudinaryResult = await uploadToCloudinary(req.file.buffer, "student_certifications");
            value.certificate_file = cloudinaryResult.url;
        } else {
            value.certificate_file = null;
        }

        const certification = await studentCertificationService.createStudentCertification(value);
        res.status(201).json(certification);
    } catch (err) {
        logger.error("Error creating student certification:", err);
        if (err.code === '23503') {
            return res.status(400).json({ message: "Student ID does not exist" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all student certifications
export const getAllStudentCertifications = async (req, res) => {
    try {
        const result = await studentCertificationService.getAllStudentCertifications();
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student certifications:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get student certification by ID
export const getStudentCertificationById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await studentCertificationService.getStudentCertificationById(id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student certification:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all certifications for a specific student
export const getCertificationsByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;
        const result = await studentCertificationService.getCertificationsByStudentId(studentId);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student certifications:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Search certifications by skill name
export const searchCertificationsBySkill = async (req, res) => {
    try {
        const { skill } = req.query;

        if (!skill || skill.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Please provide 'skill' query parameter (e.g., ?skill=Python)"
            });
        }

        const result = await studentCertificationService.searchCertificationsBySkill(skill);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error searching certifications by skill:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update student certification by ID (with optional file upload)
export const updateStudentCertificationById = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateCertificationSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Handle file upload to Cloudinary if new file provided
        if (req.file && req.file.buffer && req.file.buffer.length > 0) {
            const cloudinaryResult = await uploadToCloudinary(req.file.buffer, "student_certifications");
            value.certificate_file = cloudinaryResult.url;
        }

        const result = await studentCertificationService.updateStudentCertificationById(id, value);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        logger.error("Error updating student certification:", err);
        if (err.code === '23503') {
            return res.status(400).json({ message: "Student ID does not exist" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete student certification by ID
export const deleteStudentCertificationById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await studentCertificationService.deleteStudentCertificationById(id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        logger.error("Error deleting student certification:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Import student certifications from Excel file
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

            const { error, value } = importCertificationSchema.validate(row, { abortEarly: false });

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

        const result = await studentCertificationService.bulkInsertStudentCertifications(validatedData);
        res.status(result.success ? 201 : 400).json(result);
    } catch (err) {
        logger.error("Error importing student certifications from Excel:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Download Excel template for import
export const downloadTemplate = async (req, res) => {
    try {
        const sampleData = [
            ['STU001', 'AWS Solutions Architect', '3 months', 'Amazon Web Services', 'https://example.com/cert1.pdf'],
            ['STU002', 'Python Programming', '6 weeks', 'Coursera', 'https://example.com/cert2.pdf']
        ];

        const buffer = generateExcelTemplate(TEMPLATE_COLUMNS, sampleData, 'Certifications');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=student_certifications_template.xlsx');
        res.send(buffer);
    } catch (err) {
        logger.error("Error generating template:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
