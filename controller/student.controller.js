import logger from "../utils/logger.js";
import * as studentService from "../db/student.db.js";
import joi from "joi";
import { uploadToStorage } from "../utils/r2.js";
import { handleError } from "../utils/errors.js";

const studentSchema = joi.object({
    student_id: joi.string().alphanum().required(),
    first_name: joi.string().min(1).max(100).required(),
    middle_name: joi.string().min(1).max(100).optional().allow(null, ''),
    last_name: joi.string().min(1).max(100).required(),
    full_name: joi.string().min(1).max(300).required(),
    gender: joi.string().valid('Male', 'Female', 'Other').required(),
    dob: joi.date().less('now').required(),
    email: joi.string().email().required(),
    alt_email: joi.string().email().optional().allow(null, ''),
    college_email: joi.string().email().required(),
    mobile: joi.string().pattern(/^[0-9]{10}$/).required(),
    emergency_contact: joi.string().pattern(/^[0-9]{10}$/).required(),
    nationality: joi.string().min(1).max(50).required(),
    placement_fee_status: joi.string().min(1).max(50).required(),
    branch: joi.string().min(1).max(100).required(),
    graduation_year: joi.number().integer().required(),
    semester: joi.number().integer().optional().allow(null)
});

const updateStudentSchema = joi.object({
    first_name: joi.string().min(1).max(100).optional(),
    middle_name: joi.string().min(1).max(100).optional().allow(null, ''),
    last_name: joi.string().min(1).max(100).optional(),
    full_name: joi.string().min(1).max(300).optional(),
    gender: joi.string().valid('Male', 'Female', 'Other').optional(),
    dob: joi.date().less('now').optional(),
    email: joi.string().email().optional(),
    alt_email: joi.string().email().optional().allow(null, ''),
    college_email: joi.string().email().optional(),
    mobile: joi.string().pattern(/^[0-9]{10}$/).optional(),
    emergency_contact: joi.string().pattern(/^[0-9]{10}$/).optional(),
    nationality: joi.string().min(1).max(50).optional(),
    placement_fee_status: joi.string().min(1).max(50).optional(),
    branch: joi.string().min(1).max(100).optional(),
    graduation_year: joi.number().integer().optional(),
    semester: joi.number().integer().optional().allow(null)
});

export const createStudent = async (req, res) => {
    try {
        const { error, value } = studentSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Avoid expensive uploads for known duplicates.
        const existingStudent = await studentService.getStudentById(value.student_id);
        if (existingStudent.success) {
            return res.status(409).json({
                message: `Student with ID ${value.student_id} already exists`
            });
        }

        // Check if file was uploaded
        if (req.file && req.file.buffer && req.file.buffer.length > 0) {
            // Upload buffer to R2
            const r2Result = await uploadToStorage(req.file.buffer, "R2_BUCKET_STUDENTS", req.file.mimetype);
            value.student_photo_path = r2Result.key;
        } else {
            // No file uploaded or empty buffer - set to null
            value.student_photo_path = null;
        }

        const student = await studentService.createStudent(value);
        res.status(201).json(student);
    } catch (err) {
        return handleError(err, res, 'createStudent');
    }
};

// Get all students
export const getAllStudents = async (req, res) => {
    try {
        const result = await studentService.getAllStudents();
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'getAllStudents');
    }
};

// Get student by ID
export const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await studentService.getStudentById(id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'getStudentById');
    }
};

// Update student (full update)
export const updateStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateStudentSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }



        // Check if file was uploaded
        if (req.file) {
            const r2Result = await uploadToStorage(req.file.buffer, "R2_BUCKET_STUDENTS", req.file.mimetype);
            value.student_photo_path = r2Result.key;
        }

        const result = await studentService.updateStudentById(id, value);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'updateStudentById');
    }
};

// Patch student (partial update)
export const patchStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateStudentSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }



        // Check if file was uploaded
        if (req.file) {
            const r2Result = await uploadToStorage(req.file.buffer, "R2_BUCKET_STUDENTS", req.file.mimetype);
            value.student_photo_path = r2Result.key;
        }

        const result = await studentService.patchStudentById(id, value);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'patchStudentById');
    }
};

// Delete student
export const deleteStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await studentService.deleteStudentById(id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'deleteStudentById');
    }
};
