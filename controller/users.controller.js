import Joi from 'joi';
import * as userDB from '../db/users.db.js';
import * as studentUsersDB from '../db/student_users.db.js';
import * as studentDB from '../db/student.db.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcrypt';
import { generateToken, generateRefreshToken } from '../utils/jwt.js';

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
    }),
    student_id: Joi.alternatives().try(
        Joi.string().trim().min(1).max(50),
        Joi.number().integer().min(1)
    ).optional().messages({
        'alternatives.match': 'Student ID should be a string or number',
        'string.min': 'Student ID should have at least 1 character',
        'string.max': 'Student ID should have at most 50 characters',
        'number.base': 'Student ID should be a number',
        'number.min': 'Student ID should be a positive integer'
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

        // Create the user first
        const result = await userDB.createUser(userData);
        
        // If user was created successfully and has student role, create student_users entry
        if (result.success && result.data) {
            try {
                // Check if the user's role is student (either by role_id check or role_name)
                // We need to get the role information to check if it's a student role
                const userWithRole = await userDB.getUserById(result.data.user_id);
                
                if (userWithRole.success && userWithRole.data.role_name && 
                    userWithRole.data.role_name.toLowerCase() === 'student') {
                    
                    // Use provided student_id or generate a simple numeric one
                    let studentId = req.body.student_id;
                    if (!studentId) {
                        // Generate simple student_id using user_id directly
                        studentId = result.data.user_id.toString();
                    }
                    
                    // Create student_users association
                    const studentUserData = {
                        student_id: studentId,
                        user_id: result.data.user_id
                    };
                    
                    const studentUserResult = await studentUsersDB.createStudentUser(studentUserData);
                    
                    if (studentUserResult.success) {
                        logger.info(`createUser: Successfully created student_users entry for user ${result.data.user_id} with student_id ${studentId}`);
                        result.message += ` Student association created with ID: ${studentId}`;
                        result.data.student_id = studentId;
                    } else {
                        logger.warn(`createUser: Failed to create student_users entry for user ${result.data.user_id}`);
                    }
                } else {
                    logger.debug(`createUser: User ${result.data.user_id} does not have student role, skipping student_users creation`);
                }
            } catch (studentError) {
                logger.error(`createUser: Error creating student_users entry: ${studentError.message}`, {
                    userId: result.data.user_id,
                    error: studentError.stack
                });
                // Don't fail the whole operation, just log the error
            }
        }
        
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

// User login with JWT access and refresh tokens
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
        if (!result.success) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Generate JWT access and refresh tokens
        const user = result.data;
        const token = generateToken({
            user_id: user.user_id,
            username: user.username,
            role_id: user.role_id,
            role_name: user.role_name
        });
        const refreshToken = generateRefreshToken({
            user_id: user.user_id,
            username: user.username,
            role_id: user.role_id,
            role_name: user.role_name
        });

        // Set both tokens as HttpOnly cookies
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            domain: process.env.NODE_ENV === 'production' ? '.sumantheluri.tech' : undefined,
            path: '/',
            maxAge: 15 * 60 * 1000 // 15 min
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            domain: process.env.NODE_ENV === 'production' ? '.sumantheluri.tech' : undefined,
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: user
        });
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

// User logout (clear JWT cookies)
export const logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        domain: process.env.NODE_ENV === 'production' ? '.sumantheluri.tech' : undefined,
        path: '/'
    });
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        domain: process.env.NODE_ENV === 'production' ? '.sumantheluri.tech' : undefined,
        path: '/'
    });
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
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

/**
 * Get current user information from JWT with student ID if applicable
 */
export const whoami = async (req, res) => {
    try {
        logger.info('whoami: Fetching current user information');
        
        // Extract user information from JWT (set by authentication middleware)
        const userInfo = {
            user_id: req.user.user_id,
            username: req.user.username,
            role_id: req.user.role_id,
            role_name: req.user.role_name,
            exp: req.user.exp,
            iat: req.user.iat
        };

        // Check if user role is student and get student information
        if (req.user.role_name && req.user.role_name.toLowerCase() === 'student') {
            try {
                const studentUserResult = await studentUsersDB.getStudentUserByUserId(req.user.user_id);
                if (studentUserResult.success) {
                    userInfo.student_id = studentUserResult.data.student_id;
                    
                    // Get complete student information
                    const studentResult = await studentDB.getStudentById(studentUserResult.data.student_id);
                    if (studentResult.success) {
                        userInfo.student = studentResult.data;
                        logger.info(`whoami: Found complete student record for user ${req.user.user_id}`);
                    }
                }
            } catch (error) {
                // Log but don't fail the request if student record is not found
                logger.warn(`whoami: Could not find student record for user ${req.user.user_id}: ${error.message}`);
            }
        }

        res.status(200).json({
            success: true,
            message: 'User information retrieved successfully',
            data: userInfo
        });

    } catch (error) {
        logger.error(`whoami: ${error.message}`, {
            user_id: req.user?.user_id,
            stack: error.stack
        });

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};;