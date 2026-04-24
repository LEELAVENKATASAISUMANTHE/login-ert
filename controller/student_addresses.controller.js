import logger from "../utils/logger.js";
import * as studentAddressService from "../db/student_addresses.db.js";
import joi from "joi";
import { handleError } from "../utils/errors.js";

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
        logger.info('createStudentAddress', { student_id: req.body.student_id });
        const { error, value } = studentAddressSchema.validate(req.body);
        if (error) {
            logger.warn('createStudentAddress: validation failed', { message: error.details[0].message });
            return res.status(400).json({ message: error.details[0].message });
        }

        const address = await studentAddressService.createStudentAddress(value);
        logger.info('createStudentAddress: success', { student_id: value.student_id });
        res.status(201).json(address);
    } catch (err) {
        return handleError(err, res, 'createStudentAddress');
    }
};

// Get all student addresses
export const getAllStudentAddresses = async (req, res) => {
    try {
        logger.info('getAllStudentAddresses');
        const result = await studentAddressService.getAllStudentAddresses();
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'studentAddresses');
    }
};

// Get student address by ID
export const getStudentAddressById = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info('getStudentAddressById', { id });
        const result = await studentAddressService.getStudentAddressById(id);

        if (!result.success) {
            logger.warn('getStudentAddressById: not found', { id });
            return res.status(404).json(result);
        }
        
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'studentAddresses');
    }
};

// Get address by student ID
export const getAddressByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;
        logger.info('getAddressByStudentId', { studentId });
        const result = await studentAddressService.getAddressByStudentId(studentId);

        if (!result.success) {
            logger.warn('getAddressByStudentId: not found', { id: studentId });
            return res.status(404).json(result);
        }
        
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'studentAddresses');
    }
};

// Update student address (full update)
export const updateStudentAddressById = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info('updateStudentAddressById', { id });
        const { error, value } = updateStudentAddressSchema.validate(req.body);

        if (error) {
            logger.warn('updateStudentAddressById: validation failed', { message: error.details[0].message });
            return res.status(400).json({ message: error.details[0].message });
        }

        const result = await studentAddressService.updateStudentAddressById(id, value);

        if (!result.success) {
            logger.warn('updateStudentAddressById: not found', { id });
            return res.status(404).json(result);
        }

        logger.info('updateStudentAddressById: success', { id });
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'updateStudentAddress');
    }
};

// Patch student address (partial update)
export const patchStudentAddressById = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info('patchStudentAddressById', { id });
        const { error, value } = updateStudentAddressSchema.validate(req.body);

        if (error) {
            logger.warn('patchStudentAddressById: validation failed', { message: error.details[0].message });
            return res.status(400).json({ message: error.details[0].message });
        }

        const result = await studentAddressService.patchStudentAddressById(id, value);

        if (!result.success) {
            logger.warn('patchStudentAddressById: not found', { id });
            return res.status(404).json(result);
        }

        logger.info('patchStudentAddressById: success', { id });
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'patchStudentAddress');
    }
};

// Delete student address
export const deleteStudentAddressById = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info('deleteStudentAddressById', { id });
        const result = await studentAddressService.deleteStudentAddressById(id);

        if (!result.success) {
            logger.warn('deleteStudentAddressById: not found', { id });
            return res.status(404).json(result);
        }

        logger.info('deleteStudentAddressById: success', { id });
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'studentAddresses');
    }
};

// Get students menu (student_id, full_name, address_id for search bar)
export const getStudentsMenu = async (req, res) => {
    try {
        logger.info('getStudentsMenu', { search: req.query.search });
        const { search, searchField } = req.query;
        
        const searchParams = {
            search: search || '',
            searchField: searchField || '' // 'student_id', 'full_name', 'address_id', or empty for all
        };
        
        const result = await studentAddressService.getStudentsMenu(searchParams);
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'studentAddresses');
    }
};

