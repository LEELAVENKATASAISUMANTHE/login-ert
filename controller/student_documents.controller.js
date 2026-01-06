import logger from "../utils/logger.js";
import * as studentDocumentService from "../db/student_documents.db.js";
import { parseExcelBuffer, validateColumns, generateExcelTemplate } from "../utils/excelParser.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import joi from "joi";

// Validation schema for creating student document record
const studentDocumentSchema = joi.object({
    student_id: joi.string().required(),
    document_type: joi.string().max(80).required()
});

// Validation schema for updating student document record
const updateStudentDocumentSchema = joi.object({
    student_id: joi.string().required(),
    document_type: joi.string().max(80).required(),
    file_path: joi.string().optional().allow(null, '')
});

// Validation schema for Excel import
const importDocumentSchema = joi.object({
    student_id: joi.string().required(),
    document_type: joi.string().max(80).optional().allow(null, ''),
    file_path: joi.string().optional().allow(null, '')
});

// Template columns for Excel import
const TEMPLATE_COLUMNS = [
    'student_id',
    'document_type',
    'file_path'
];

const REQUIRED_COLUMNS = ['student_id'];

// Create a new student document record (with file upload)
export const createStudentDocument = async (req, res) => {
    try {
        const { error, value } = studentDocumentSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Handle file upload to Cloudinary
        if (req.file && req.file.buffer && req.file.buffer.length > 0) {
            const cloudinaryResult = await uploadToCloudinary(req.file.buffer, "student_documents");
            value.file_path = cloudinaryResult.url;
        } else {
            return res.status(400).json({ message: "Document file is required" });
        }

        const document = await studentDocumentService.createStudentDocument(value);
        res.status(201).json(document);
    } catch (err) {
        logger.error("Error creating student document:", err);
        if (err.code === '23503') {
            return res.status(400).json({ message: "Student ID does not exist" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all student documents
export const getAllStudentDocuments = async (req, res) => {
    try {
        const result = await studentDocumentService.getAllStudentDocuments();
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student documents:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get student document by ID
export const getStudentDocumentById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await studentDocumentService.getStudentDocumentById(id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student document:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all documents for a specific student
export const getDocumentsByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;
        const result = await studentDocumentService.getDocumentsByStudentId(studentId);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student documents:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update student document by ID (with optional file upload)
export const updateStudentDocumentById = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateStudentDocumentSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Handle file upload to Cloudinary if new file provided
        if (req.file && req.file.buffer && req.file.buffer.length > 0) {
            const cloudinaryResult = await uploadToCloudinary(req.file.buffer, "student_documents");
            value.file_path = cloudinaryResult.url;
        }

        const result = await studentDocumentService.updateStudentDocumentById(id, value);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        logger.error("Error updating student document:", err);
        if (err.code === '23503') {
            return res.status(400).json({ message: "Student ID does not exist" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete student document by ID
export const deleteStudentDocumentById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await studentDocumentService.deleteStudentDocumentById(id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        logger.error("Error deleting student document:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Import student documents from Excel file (metadata only - file_path as URLs)
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

            const { error, value } = importDocumentSchema.validate(row, { abortEarly: false });

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
        const result = await studentDocumentService.bulkInsertStudentDocuments(validatedData);

        res.status(result.success ? 201 : 400).json(result);
    } catch (err) {
        logger.error("Error importing student documents from Excel:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Download Excel template for import
export const downloadTemplate = async (req, res) => {
    try {
        // Sample data to help users understand the format
        const sampleData = [
            ['STU001', 'Resume', 'https://example.com/resume.pdf'],
            ['STU002', '10th Marksheet', 'https://example.com/marksheet.pdf']
        ];

        const buffer = generateExcelTemplate(TEMPLATE_COLUMNS, sampleData, 'Documents');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=student_documents_template.xlsx');
        res.send(buffer);
    } catch (err) {
        logger.error("Error generating template:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
