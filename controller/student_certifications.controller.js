import logger from "../utils/logger.js";
import * as studentCertificationService from "../db/student_certifications.db.js";
import { handleError } from "../utils/errors.js";
import { parseExcelBuffer, validateColumns, generateExcelTemplate } from "../utils/excelParser.js";
import { uploadToStorage } from "../utils/r2.js";
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
        logger.info('createStudentCertification', { student_id: req.body.student_id });
        const { error, value } = studentCertificationSchema.validate(req.body);
        if (error) {
            logger.warn('createStudentCertification: validation failed', { message: error.details[0].message });
            return res.status(400).json({ message: error.details[0].message });
        }

        if (req.file && req.file.buffer && req.file.buffer.length > 0) {
            logger.info('createStudentCertification: uploading to R2', {
                filename: req.file.originalname,
                mimetype: req.file.mimetype,
                sizeBytes: req.file.size,
            });
            const r2Result = await uploadToStorage(req.file.buffer, "R2_BUCKET_CERTIFICATIONS", req.file.mimetype);
            value.certificate_file = r2Result.url;
            logger.info('createStudentCertification: upload success', { url: r2Result.url });
        } else {
            value.certificate_file = null;
        }

        const certification = await studentCertificationService.createStudentCertification(value);
        logger.info('createStudentCertification: success', { student_id: value.student_id });
        res.status(201).json(certification);
    } catch (err) {
        return handleError(err, res, 'createStudentCertification');
    }
};

// Get all student certifications
export const getAllStudentCertifications = async (req, res) => {
    try {
        logger.info('getAllStudentCertifications');
        const result = await studentCertificationService.getAllStudentCertifications();
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'studentCertifications');
    }
};

// Get student certification by ID
export const getStudentCertificationById = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info('getStudentCertificationById', { id });
        const result = await studentCertificationService.getStudentCertificationById(id);

        if (!result.success) {
            logger.warn('getStudentCertificationById: not found', { id });
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'studentCertifications');
    }
};

// Get all certifications for a specific student
export const getCertificationsByStudentId = async (req, res) => {
    try {
        logger.info('getCertificationsByStudentId', { studentId: req.params.studentId });
        const { studentId } = req.params;
        const result = await studentCertificationService.getCertificationsByStudentId(studentId);
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'studentCertifications');
    }
};

// Search certifications by skill name
export const searchCertificationsBySkill = async (req, res) => {
    try {
        logger.info('searchCertificationsBySkill', { skill: req.query.skill });
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
        return handleError(err, res, 'studentCertifications');
    }
};

// Update student certification by ID (with optional file upload)
export const updateStudentCertificationById = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info('updateStudentCertificationById', { id });
        const { error, value } = updateCertificationSchema.validate(req.body);

        if (error) {
            logger.warn('updateStudentCertificationById: validation failed', { message: error.details[0].message });
            return res.status(400).json({ message: error.details[0].message });
        }

        if (req.file && req.file.buffer && req.file.buffer.length > 0) {
            logger.info('updateStudentCertificationById: replacing file in R2', {
                filename: req.file.originalname,
                mimetype: req.file.mimetype,
                sizeBytes: req.file.size,
            });
            const r2Result = await uploadToStorage(req.file.buffer, "R2_BUCKET_CERTIFICATIONS", req.file.mimetype);
            value.certificate_file = r2Result.url;
            logger.info('updateStudentCertificationById: upload success', { url: r2Result.url });
        }

        const result = await studentCertificationService.updateStudentCertificationById(id, value);

        if (!result.success) {
            logger.warn('updateStudentCertificationById: not found', { id });
            return res.status(404).json(result);
        }

        logger.info('updateStudentCertificationById: success', { id });
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'updateStudentCertification');
    }
};

// Delete student certification by ID
export const deleteStudentCertificationById = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info('deleteStudentCertificationById', { id });
        const result = await studentCertificationService.deleteStudentCertificationById(id);

        if (!result.success) {
            logger.warn('deleteStudentCertificationById: not found', { id });
            return res.status(404).json(result);
        }

        logger.info('deleteStudentCertificationById: success', { id });
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'studentCertifications');
    }
};

// Import student certifications from Excel file
export const importFromExcel = async (req, res) => {
    try {
        logger.info('importFromExcel', { filename: req.file?.originalname });
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
        if (result.success) logger.info('importFromExcel: success', { inserted: result.inserted });
        res.status(result.success ? 201 : 400).json(result);
    } catch (err) {
        return handleError(err, res, 'studentCertifications');
    }
};

// Download Excel template for import
export const downloadTemplate = async (req, res) => {
    try {
        logger.info('downloadTemplate');
        const sampleData = [
            ['STU001', 'AWS Solutions Architect', '3 months', 'Amazon Web Services', 'https://example.com/cert1.pdf'],
            ['STU002', 'Python Programming', '6 weeks', 'Coursera', 'https://example.com/cert2.pdf']
        ];

        const buffer = generateExcelTemplate(TEMPLATE_COLUMNS, sampleData, 'Certifications');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=student_certifications_template.xlsx');
        res.send(buffer);
    } catch (err) {
        return handleError(err, res, 'studentCertifications');
    }
};
