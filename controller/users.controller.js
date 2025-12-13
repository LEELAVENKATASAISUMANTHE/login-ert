import Joi from 'joi';
import * as userDB from '../db/users.db.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcrypt';

export const createUserSchema = Joi.object({
    username: Joi.string().trim().min(3).max(100).required().messages({
        'string.base': 'Username should be a type of text',
        'string.empty': 'Username cannot be an empty field',
        'string.min': 'Username should have a minimum length of 3 characters',
        'string.max': 'Username should have a maximum length of 100 characters',
        'any.required': 'Username is a required field'
    }),
    password: Joi.string().min(8).max(100).required().messages({
        'string.base': 'Password should be a type of text',
        'string.empty': 'Password cannot be an empty field',
        'string.min': 'Password should have a minimum length of 8 characters',
        'string.max': 'Password should have a maximum length of 100 characters',
        'any.required': 'Password is a required field'
    }),
    email: Joi.string().email().max(150).optional().messages({
        'string.base': 'Email should be a type of text',
        'string.email': 'Email must be a valid email address',
        'string.max': 'Email should have a maximum length of 150 characters'
    }),
    full_name: Joi.string().trim().max(200).optional().messages({
        'string.base': 'Full name should be a type of text',
        'string.max': 'Full name should have a maximum length of 200 characters'
    }),
    role_id: Joi.number().integer().min(1).optional().messages({
        'number.base': 'Role ID should be a number',
        'number.min': 'Role ID should be a positive integer'
    }),
    is_active: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'Active status should be a boolean value'
    })
});

export const updateUserSchema = Joi.object({
    username: Joi.string().trim().min(3).max(100).optional().messages({
        'string.base': 'Username should be a type of text',
        'string.empty': 'Username cannot be an empty field',
        'string.min': 'Username should have a minimum length of 3 characters',
        'string.max': 'Username should have a maximum length of 100 characters'
    }),
    email: Joi.string().email().max(150).optional().allow('').messages({
        'string.base': 'Email should be a type of text',
        'string.email': 'Email must be a valid email address',
        'string.max': 'Email should have a maximum length of 150 characters'
    }),
    full_name: Joi.string().trim().max(200).optional().allow('').messages({
        'string.base': 'Full name should be a type of text',
        'string.max': 'Full name should have a maximum length of 200 characters'
    }),
    role_id: Joi.number().integer().min(1).optional().allow(null).messages({
        'number.base': 'Role ID should be a number',
        'number.min': 'Role ID should be a positive integer'
    }),
    is_active: Joi.boolean().optional().messages({
        'boolean.base': 'Active status should be a boolean value'
    })
}).min(1);

export const changePasswordSchema = Joi.object({
    current_password: Joi.string().required().messages({
        'string.empty': 'Current password is required',
        'any.required': 'Current password is required'
    }),
    new_password: Joi.string().min(8).max(100).required().messages({
        'string.base': 'New password should be a type of text',
        'string.empty': 'New password cannot be an empty field',
        'string.min': 'New password should have a minimum length of 8 characters',
        'string.max': 'New password should have a maximum length of 100 characters',
        'any.required': 'New password is a required field'
    })
});

export const loginSchema = Joi.object({
    username: Joi.string().required().messages({
        'string.empty': 'Username is required',
        'any.required': 'Username is required'
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Password is required',
        'any.required': 'Password is required'
    })
});

export const getUsersSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('user_id', 'username', 'email', 'full_name', 'created_at', 'last_login').default('user_id'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
    is_active: Joi.boolean().optional(),
    role_id: Joi.number().integer().min(1).optional(),
    search: Joi.string().trim().max(100).optional()
});

export const userIdSchema = Joi.object({
    id: Joi.number().integer().min(1).required()
});

// Create a new user
export const createUser = async (req, res) => {
    try {
        const { error } = createUserSchema.validate(req.body);
        if (error) {
            logger.warn(`createUser: Validation failed: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        // Hash the password before storing
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        
        const userData = {
            ...req.body,
            password_hash: hashedPassword
        };
        delete userData.password;

        const result = await userDB.createUser(userData);
        
        res.status(201).json(result);
    } catch (error) {
        logger.error(`createUser: ${error.message}`, { 
            body: { ...req.body, password: '[HIDDEN]' }, 
            stack: error.stack 
        });
        
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('Role not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to create user'
        });
    }
};

// Get all users with pagination and filtering
export const getAllUsers = async (req, res) => {
    try {
        const { error } = getUsersSchema.validate(req.query);
        if (error) {
            logger.warn(`getAllUsers: Validation failed: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const result = await userDB.getAllUsers(req.query);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error(`getAllUsers: ${error.message}`, { 
            query: req.query,
            stack: error.stack 
        });
        
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve users'
        });
    }
};

// Get a user by ID
export const getUserById = async (req, res) => {
    try {
        const { error } = userIdSchema.validate(req.params);
        if (error) {
            logger.warn(`getUserById: Invalid user ID: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const user_id = parseInt(req.params.id);
        const result = await userDB.getUserById(user_id);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error(`getUserById: ${error.message}`, { 
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
            message: 'Failed to retrieve user'
        });
    }
};

// Update a user
export const updateUser = async (req, res) => {
    try {
        const { error: paramsError } = userIdSchema.validate(req.params);
        if (paramsError) {
            logger.warn(`updateUser: Invalid user ID: ${paramsError.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: paramsError.details[0].message
            });
        }

        const { error: bodyError } = updateUserSchema.validate(req.body);
        if (bodyError) {
            logger.warn(`updateUser: Validation failed: ${bodyError.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: bodyError.details[0].message
            });
        }

        const user_id = parseInt(req.params.id);
        const result = await userDB.updateUser(user_id, req.body);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error(`updateUser: ${error.message}`, { 
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
            message: 'Failed to update user'
        });
    }
};

// Delete a user
export const deleteUser = async (req, res) => {
    try {
        const { error } = userIdSchema.validate(req.params);
        if (error) {
            logger.warn(`deleteUser: Invalid user ID: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const user_id = parseInt(req.params.id);
        const result = await userDB.deleteUser(user_id);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error(`deleteUser: ${error.message}`, { 
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
            message: 'Failed to delete user'
        });
    }
};

// Change user password
export const changePassword = async (req, res) => {
    try {
        const { error: paramsError } = userIdSchema.validate(req.params);
        if (paramsError) {
            logger.warn(`changePassword: Invalid user ID: ${paramsError.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: paramsError.details[0].message
            });
        }

        const { error: bodyError } = changePasswordSchema.validate(req.body);
        if (bodyError) {
            logger.warn(`changePassword: Validation failed: ${bodyError.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: bodyError.details[0].message
            });
        }

        const user_id = parseInt(req.params.id);
        
        // Hash the new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(req.body.new_password, saltRounds);
        
        const result = await userDB.changePassword(user_id, req.body.current_password, hashedNewPassword);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error(`changePassword: ${error.message}`, { 
            params: req.params,
            stack: error.stack 
        });
        
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('current password')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
};

// User login
export const login = async (req, res) => {
    try {
        const { error } = loginSchema.validate(req.body);
        if (error) {
            logger.warn(`login: Validation failed: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const result = await userDB.authenticateUser(req.body.username, req.body.password);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error(`login: ${error.message}`, { 
            username: req.body.username,
            stack: error.stack 
        });
        
        if (error.message.includes('Invalid credentials') || error.message.includes('not found')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        
        if (error.message.includes('inactive') || error.message.includes('disabled')) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
};

// Update last login timestamp
export const updateLastLogin = async (req, res) => {
    try {
        const { error } = userIdSchema.validate(req.params);
        if (error) {
            logger.warn(`updateLastLogin: Invalid user ID: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const user_id = parseInt(req.params.id);
        const result = await userDB.updateLastLogin(user_id);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error(`updateLastLogin: ${error.message}`, { 
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
            message: 'Failed to update last login'
        });
    }
};