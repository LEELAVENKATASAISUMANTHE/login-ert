import Joi from 'joi';
import * as studentUserDB from '../db/student_users.db.js';
import logger from '../utils/logger.js';

export const createStudentUserSchema = Joi.object({
    user_id: Joi.number().integer().min(1).required().messages({
        'number.base': 'User ID should be a number',
        'number.min': 'User ID should be a positive integer',
        'any.required': 'User ID is required'
    })
});

export const updateStudentUserSchema = Joi.object({
    user_id: Joi.number().integer().min(1).optional().allow(null).messages({
        'number.base': 'User ID should be a number',
        'number.min': 'User ID should be a positive integer'
    })
});

export const getStudentUsersSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('student_id', 'user_id').default('student_id'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
    user_id: Joi.number().integer().min(1).optional(),
    search: Joi.string().trim().max(100).optional()
});

export const studentIdSchema = Joi.object({
    id: Joi.number().integer().min(1).required()
});

export const userIdSchema = Joi.object({
    user_id: Joi.number().integer().min(1).required()
});

// Create a new student user association
export const createStudentUser = async (req, res) => {
    try {
        const { error } = createStudentUserSchema.validate(req.body);
        if (error) {
            logger.warn(`createStudentUser: Validation failed: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const result = await studentUserDB.createStudentUser(req.body);
        
        res.status(201).json(result);
    } catch (error) {
        logger.error(`createStudentUser: ${error.message}`, { 
            body: req.body, 
            stack: error.stack 
        });
        
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('User not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to create student user association'
        });
    }
};

// Get all student users with pagination and filtering
export const getAllStudentUsers = async (req, res) => {
    try {
        const { error } = getStudentUsersSchema.validate(req.query);
        if (error) {
            logger.warn(`getAllStudentUsers: Validation failed: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const result = await studentUserDB.getAllStudentUsers(req.query);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error(`getAllStudentUsers: ${error.message}`, { 
            query: req.query,
            stack: error.stack 
        });
        
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve student users'
        });
    }
};

// Get a student user by student ID
export const getStudentUserById = async (req, res) => {
    try {
        const { error } = studentIdSchema.validate(req.params);
        if (error) {
            logger.warn(`getStudentUserById: Invalid student ID: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const student_id = parseInt(req.params.id);
        const result = await studentUserDB.getStudentUserById(student_id);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error(`getStudentUserById: ${error.message}`, { 
            params: req.params,
            stack: error.stack 
        });
        
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve student user'
        });
    }
};

// Get student user by user ID
export const getStudentUserByUserId = async (req, res) => {
    try {
        const { error } = userIdSchema.validate(req.params);
        if (error) {
            logger.warn(`getStudentUserByUserId: Invalid user ID: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const user_id = parseInt(req.params.user_id);
        const result = await studentUserDB.getStudentUserByUserId(user_id);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error(`getStudentUserByUserId: ${error.message}`, { 
            params: req.params,
            stack: error.stack 
        });
        
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve student user'
        });
    }
};

// Update a student user association
export const updateStudentUser = async (req, res) => {
    try {
        const { error: paramsError } = studentIdSchema.validate(req.params);
        if (paramsError) {
            logger.warn(`updateStudentUser: Invalid student ID: ${paramsError.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: paramsError.details[0].message
            });
        }

        const { error: bodyError } = updateStudentUserSchema.validate(req.body);
        if (bodyError) {
            logger.warn(`updateStudentUser: Validation failed: ${bodyError.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: bodyError.details[0].message
            });
        }

        const student_id = parseInt(req.params.id);
        const result = await studentUserDB.updateStudentUser(student_id, req.body);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error(`updateStudentUser: ${error.message}`, { 
            params: req.params,
            body: req.body, 
            stack: error.stack 
        });
        
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to update student user association'
        });
    }
};

// Delete a student user association
export const deleteStudentUser = async (req, res) => {
    try {
        const { error } = studentIdSchema.validate(req.params);
        if (error) {
            logger.warn(`deleteStudentUser: Invalid student ID: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const student_id = parseInt(req.params.id);
        const result = await studentUserDB.deleteStudentUser(student_id);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error(`deleteStudentUser: ${error.message}`, { 
            params: req.params,
            stack: error.stack 
        });
        
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to delete student user association'
        });
    }
};

// Get all students (users with student associations)
export const getAllStudents = async (req, res) => {
    try {
        const { error } = getStudentUsersSchema.validate(req.query);
        if (error) {
            logger.warn(`getAllStudents: Validation failed: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const result = await studentUserDB.getAllStudents(req.query);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error(`getAllStudents: ${error.message}`, { 
            query: req.query,
            stack: error.stack 
        });
        
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve students'
        });
    }
};

// Bulk create student user associations
export const bulkCreateStudentUsers = async (req, res) => {
    try {
        const bulkSchema = Joi.object({
            user_ids: Joi.array().items(Joi.number().integer().min(1)).min(1).max(50).required().messages({
                'array.base': 'User IDs should be an array',
                'array.min': 'At least one user ID is required',
                'array.max': 'Maximum 50 user IDs allowed',
                'any.required': 'User IDs are required'
            })
        });

        const { error } = bulkSchema.validate(req.body);
        if (error) {
            logger.warn(`bulkCreateStudentUsers: Validation failed: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const result = await studentUserDB.bulkCreateStudentUsers(req.body.user_ids);
        
        res.status(201).json(result);
    } catch (error) {
        logger.error(`bulkCreateStudentUsers: ${error.message}`, { 
            body: req.body,
            stack: error.stack 
        });
        
        res.status(500).json({
            success: false,
            message: 'Failed to create student user associations'
        });
    }
};