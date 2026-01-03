import logger from "../utils/logger.js";
import * as studentAddressService from "../db/student_addresses.db.js";
import joi from "joi";

const studentAddressSchema = joi.object({
    student_id: joi.string().max(50).required(),
    permanent_address: joi.string().optional().allow(null, ''),
    permanent_city: joi.string().max(100).optional().allow(null, ''),
    permanent_state: joi.string().max(100).optional().allow(null, ''),
    permanent_pin: joi.string().max(20).optional().allow(null, ''),
    permanent_contact: joi.string().max(20).optional().allow(null, ''),
    current_address: joi.string().optional().allow(null, ''),
    current_city: joi.string().max(100).optional().allow(null, ''),
    current_state: joi.string().max(100).optional().allow(null, ''),
    current_pin: joi.string().max(20).optional().allow(null, '')
});

const updateStudentAddressSchema = joi.object({
    student_id: joi.string().max(50).optional(),
    permanent_address: joi.string().optional().allow(null, ''),
    permanent_city: joi.string().max(100).optional().allow(null, ''),
    permanent_state: joi.string().max(100).optional().allow(null, ''),
    permanent_pin: joi.string().max(20).optional().allow(null, ''),
    permanent_contact: joi.string().max(20).optional().allow(null, ''),
    current_address: joi.string().optional().allow(null, ''),
    current_city: joi.string().max(100).optional().allow(null, ''),
    current_state: joi.string().max(100).optional().allow(null, ''),
    current_pin: joi.string().max(20).optional().allow(null, '')
});

// Create a new student address
export const createStudentAddress = async (req, res) => {
    try {
        const { error, value } = studentAddressSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const address = await studentAddressService.createStudentAddress(value);
        res.status(201).json(address);
    } catch (err) {
        logger.error("Error creating student address:", err);
        if (err.code === '23503') {
            return res.status(400).json({ message: "Student ID does not exist" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all student addresses
export const getAllStudentAddresses = async (req, res) => {
    try {
        const result = await studentAddressService.getAllStudentAddresses();
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student addresses:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get student address by ID
export const getStudentAddressById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await studentAddressService.getStudentAddressById(id);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student address:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get address by student ID
export const getAddressByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;
        const result = await studentAddressService.getAddressByStudentId(studentId);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student address by student ID:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update student address (full update)
export const updateStudentAddressById = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateStudentAddressSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const result = await studentAddressService.updateStudentAddressById(id, value);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error updating student address:", err);
        if (err.code === '23503') {
            return res.status(400).json({ message: "Student ID does not exist" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// Patch student address (partial update)
export const patchStudentAddressById = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateStudentAddressSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const result = await studentAddressService.patchStudentAddressById(id, value);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error patching student address:", err);
        if (err.code === '23503') {
            return res.status(400).json({ message: "Student ID does not exist" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete student address
export const deleteStudentAddressById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await studentAddressService.deleteStudentAddressById(id);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error deleting student address:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get students menu (student_id, full_name, address_id for search bar)
export const getStudentsMenu = async (req, res) => {
    try {
        const { search, searchField } = req.query;
        
        const searchParams = {
            search: search || '',
            searchField: searchField || '' // 'student_id', 'full_name', 'address_id', or empty for all
        };
        
        const result = await studentAddressService.getStudentsMenu(searchParams);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching students menu:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

