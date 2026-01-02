import logger from "../utils/logger.js";
import * as studentService from "../db/student.db.js";
import joi from "joi";
import { uploadToCloudinary } from "../utils/cloudinary.js";


const studentSchema = joi.object({
    student_id: joi.string().alphanum().required(),
    first_name: joi.string().min(1).max(50).required(),
    middle_name: joi.string().min(1).max(50).optional().allow(null, ''),
    last_name: joi.string().min(1).max(50).required(),
    full_name: joi.string().min(1).max(150).required(),
    gender: joi.string().valid('Male', 'Female', 'Other').required(),
    dob: joi.date().less('now').required(),
    email: joi.string().email().required(),
    alt_email: joi.string().email().optional().allow(null, ''),
    college_mail: joi.string().email().required(),
    mobile: joi.string().pattern(/^[0-9]{10}$/).required(),
    emergency_contact: joi.string().pattern(/^[0-9]{10}$/).required(),
    nationality: joi.string().min(1).max(50).required(),
    placement_fee_status: joi.string().valid('Paid', 'Unpaid').required(),
    student_photo: joi.string().optional().allow(null, '')  // base64 image
});

const updateStudentSchema = joi.object({
    first_name: joi.string().min(1).max(50).optional(),
    middle_name: joi.string().min(1).max(50).optional().allow(null, ''),
    last_name: joi.string().min(1).max(50).optional(),
    full_name: joi.string().min(1).max(150).optional(),
    gender: joi.string().valid('Male', 'Female', 'Other').optional(),
    dob: joi.date().less('now').optional(),
    email: joi.string().email().optional(),
    alt_email: joi.string().email().optional().allow(null, ''),
    college_mail: joi.string().email().optional(),
    mobile: joi.string().pattern(/^[0-9]{10}$/).optional(),
    emergency_contact: joi.string().pattern(/^[0-9]{10}$/).optional(),
    nationality: joi.string().min(1).max(50).optional(),
    placement_fee_status: joi.string().valid('Paid', 'Unpaid').optional(),
    student_photo: joi.string().optional().allow(null, '')  // base64 image
});

export const createStudent = async (req, res) => {
    try {
        const { error, value } = studentSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Check if base64 photo was provided
        if (value.student_photo && value.student_photo.length > 0) {
            console.log("Base64 photo received, uploading to Cloudinary...");
            const cloudinaryResult = await uploadToCloudinary(value.student_photo, "students");
            value.student_photo_path = cloudinaryResult.url;
        } else {
            value.student_photo_path = null;
        }
        
        // Remove student_photo from value (we only need student_photo_path for DB)
        delete value.student_photo;

        const student = await studentService.createStudent(value);
        res.status(201).json(student);
    } catch (err) {
        logger.error("Error creating student:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all students
export const getAllStudents = async (req, res) => {
    try {
        const result = await studentService.getAllStudents();
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching students:", err);
        res.status(500).json({ message: "Internal server error" });
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
        logger.error("Error fetching student:", err);
        res.status(500).json({ message: "Internal server error" });
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

        // Check if base64 photo was provided
        if (value.student_photo && value.student_photo.length > 0) {
            const cloudinaryResult = await uploadToCloudinary(value.student_photo, "students");
            value.student_photo_path = cloudinaryResult.url;
        }
        
        // Remove student_photo from value
        delete value.student_photo;

        const result = await studentService.updateStudentById(id, value);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error updating student:", err);
        res.status(500).json({ message: "Internal server error" });
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

        // Check if base64 photo was provided
        if (value.student_photo && value.student_photo.length > 0) {
            const cloudinaryResult = await uploadToCloudinary(value.student_photo, "students");
            value.student_photo_path = cloudinaryResult.url;
        }
        
        // Remove student_photo from value
        delete value.student_photo;

        const result = await studentService.patchStudentById(id, value);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error patching student:", err);
        res.status(500).json({ message: "Internal server error" });
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
        logger.error("Error deleting student:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};