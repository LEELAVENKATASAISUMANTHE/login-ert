import Joi from 'joi';
import * as rolePermissionDB from '../db/role_permissions.db.js';
import logger from '../utils/logger.js';

export const assignPermissionSchema = Joi.object({
    role_id: Joi.number().integer().min(1).required().messages({
        'number.base': 'Role ID should be a number',
        'number.min': 'Role ID should be a positive integer',
        'any.required': 'Role ID is required'
    }),
    permission_id: Joi.number().integer().min(1).required().messages({
        'number.base': 'Permission ID should be a number',
        'number.min': 'Permission ID should be a positive integer',
        'any.required': 'Permission ID is required'
    })
});

export const assignPermissionsToRoleSchema = Joi.object({
    role_id: Joi.number().integer().min(1).required().messages({
        'number.base': 'Role ID should be a number',
        'number.min': 'Role ID should be a positive integer',
        'any.required': 'Role ID is required'
    }),
    permission_ids: Joi.array().items(Joi.number().integer().min(1)).min(1).required().messages({
        'array.base': 'Permission IDs should be an array',
        'array.min': 'At least one permission ID is required',
        'any.required': 'Permission IDs are required'
    })
});

export const roleIdSchema = Joi.object({
    role_id: Joi.number().integer().min(1).required().messages({
        'number.base': 'Role ID should be a number',
        'number.min': 'Role ID should be a positive integer',
        'any.required': 'Role ID is required'
    })
});

export const getRolePermissionsSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    role_id: Joi.number().integer().min(1).optional(),
    permission_id: Joi.number().integer().min(1).optional()
});

// Assign a permission to a role
export const assignPermissionToRole = async (req, res) => {
    try {
        const { error } = assignPermissionSchema.validate(req.body);
        if (error) {
            logger.warn(`assignPermissionToRole: Validation failed: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const result = await rolePermissionDB.assignPermissionToRole(req.body);
        
        res.status(201).json(result);
    } catch (error) {
        logger.error(`assignPermissionToRole: ${error.message}`, { 
            body: req.body, 
            stack: error.stack 
        });
        
        if (error.message.includes('already assigned') || error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('Role not found') || error.message.includes('Permission not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to assign permission to role'
        });
    }
};

// Assign multiple permissions to a role
export const assignPermissionsToRole = async (req, res) => {
    try {
        const { error } = assignPermissionsToRoleSchema.validate(req.body);
        if (error) {
            logger.warn(`assignPermissionsToRole: Validation failed: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const result = await rolePermissionDB.assignPermissionsToRole(req.body);
        
        res.status(201).json(result);
    } catch (error) {
        logger.error(`assignPermissionsToRole: ${error.message}`, { 
            body: req.body, 
            stack: error.stack 
        });
        
        if (error.message.includes('Role not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to assign permissions to role'
        });
    }
};

// Get permissions for a specific role
export const getRolePermissions = async (req, res) => {
    try {
        const { error: paramsError } = roleIdSchema.validate(req.params);
        if (paramsError) {
            logger.warn(`getRolePermissions: Invalid role ID: ${paramsError.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: paramsError.details[0].message
            });
        }

        const { error: queryError } = getRolePermissionsSchema.validate(req.query);
        if (queryError) {
            logger.warn(`getRolePermissions: Validation failed: ${queryError.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: queryError.details[0].message
            });
        }

        const role_id = parseInt(req.params.role_id);
        const queryParams = { ...req.query, role_id };

        const result = await rolePermissionDB.getRolePermissions(queryParams);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error(`getRolePermissions: ${error.message}`, { 
            params: req.params,
            query: req.query,
            stack: error.stack 
        });
        
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve role permissions'
        });
    }
};

// Get all role-permission assignments
export const getAllRolePermissions = async (req, res) => {
    try {
        const { error } = getRolePermissionsSchema.validate(req.query);
        if (error) {
            logger.warn(`getAllRolePermissions: Validation failed: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const result = await rolePermissionDB.getAllRolePermissions(req.query);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error(`getAllRolePermissions: ${error.message}`, { 
            query: req.query,
            stack: error.stack 
        });
        
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve role permissions'
        });
    }
};

// Remove a permission from a role
export const removePermissionFromRole = async (req, res) => {
    try {
        const { error } = assignPermissionSchema.validate(req.body);
        if (error) {
            logger.warn(`removePermissionFromRole: Validation failed: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const result = await rolePermissionDB.removePermissionFromRole(req.body);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error(`removePermissionFromRole: ${error.message}`, { 
            body: req.body, 
            stack: error.stack 
        });
        
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to remove permission from role'
        });
    }
};

// Remove all permissions from a role
export const removeAllPermissionsFromRole = async (req, res) => {
    try {
        const { error } = roleIdSchema.validate(req.params);
        if (error) {
            logger.warn(`removeAllPermissionsFromRole: Invalid role ID: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const role_id = parseInt(req.params.role_id);
        const result = await rolePermissionDB.removeAllPermissionsFromRole(role_id);
        
        res.status(200).json(result);
    } catch (error) {
        logger.error(`removeAllPermissionsFromRole: ${error.message}`, { 
            params: req.params,
            stack: error.stack 
        });
        
        if (error.message.includes('Role not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to remove permissions from role'
        });
    }
};