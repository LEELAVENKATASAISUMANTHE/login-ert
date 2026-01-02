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
    placement_fee_status: joi.string().valid('Paid', 'Unpaid').required()
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
});

export const createStudent = async (req, res) => {
    try {
        // Debug: Log everything about the file
        console.log("=== FILE DEBUG ===");
        console.log("req.file exists:", !!req.file);
        if (req.file) {
            console.log("req.file.fieldname:", req.file.fieldname);
            console.log("req.file.originalname:", req.file.originalname);
            console.log("req.file.mimetype:", req.file.mimetype);
            console.log("req.file.size:", req.file.size);
            console.log("req.file.buffer exists:", !!req.file.buffer);
            console.log("req.file.buffer length:", req.file.buffer ? req.file.buffer.length : 0);
        }
        console.log("=== END DEBUG ===");

        const { error, value } = studentSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Check if file was uploaded
        if (req.file && req.file.buffer && req.file.buffer.length > 0) {
            console.log("File received:", req.file.originalname, "Size:", req.file.size);
            
            // Upload buffer to Cloudinary
            const cloudinaryResult = await uploadToCloudinary(req.file.buffer, "students");
            value.student_photo_path = cloudinaryResult.url;
        } else {
            // No file uploaded or empty buffer - set to null
            console.log("No valid file uploaded, setting photo to null");
            value.student_photo_path = null;
        }

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

        // Check if file was uploaded
        if (req.file) {
            const cloudinaryResult = await uploadToCloudinary(req.file.buffer, "students");
            value.student_photo_path = cloudinaryResult.url;
        }

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

        // Check if file was uploaded
        if (req.file) {
            const cloudinaryResult = await uploadToCloudinary(req.file.buffer, "students");
            value.student_photo_path = cloudinaryResult.url;
        }

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