import Joi from 'joi';
import * as rolePermissionDB from '../db/role_permissions.db.js';
import logger from '../utils/logger.js';
import { handleError } from '../utils/errors.js';

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
        logger.info({ role_id: req.body.role_id, permission_id: req.body.permission_id }, 'assignPermissionToRole');
        const { error } = assignPermissionSchema.validate(req.body);
        if (error) {
            logger.warn(`assignPermissionToRole: Validation failed: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const result = await rolePermissionDB.assignPermissionToRole(req.body);
        logger.info({ role_id: req.body.role_id, permission_id: req.body.permission_id }, 'assignPermissionToRole: success');
        res.status(201).json(result);
    } catch (error) {
        return handleError(error, res, 'assignPermissionToRole');
    }
};

// Assign multiple permissions to a role
export const assignPermissionsToRole = async (req, res) => {
    try {
        logger.info({ role_id: req.body.role_id, count: req.body.permission_ids?.length }, 'assignPermissionsToRole');
        const { error } = assignPermissionsToRoleSchema.validate(req.body);
        if (error) {
            logger.warn(`assignPermissionsToRole: Validation failed: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const result = await rolePermissionDB.assignPermissionsToRole(req.body);
        logger.info({ role_id: req.body.role_id, count: req.body.permission_ids?.length }, 'assignPermissionsToRole: success');
        res.status(201).json(result);
    } catch (error) {
        return handleError(error, res, 'assignPermissionsToRole');
    }
};

// Get permissions for a specific role
export const getRolePermissions = async (req, res) => {
    try {
        logger.info({ role_id: req.params.role_id }, 'getRolePermissions');
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
        return handleError(error, res, 'getRolePermissions');
    }
};

// Get all role-permission assignments
export const getAllRolePermissions = async (req, res) => {
    try {
        logger.info({ query: req.query }, 'getAllRolePermissions');
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
        return handleError(error, res, 'getAllRolePermissions');
    }
};

// Remove a permission from a role
export const removePermissionFromRole = async (req, res) => {
    try {
        logger.info({ role_id: req.body.role_id, permission_id: req.body.permission_id }, 'removePermissionFromRole');
        const { error } = assignPermissionSchema.validate(req.body);
        if (error) {
            logger.warn(`removePermissionFromRole: Validation failed: ${error.details[0].message}`);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const result = await rolePermissionDB.removePermissionFromRole(req.body);
        logger.info({ role_id: req.body.role_id, permission_id: req.body.permission_id }, 'removePermissionFromRole: success');
        res.status(200).json(result);
    } catch (error) {
        return handleError(error, res, 'removePermissionFromRole');
    }
};

// Remove all permissions from a role
export const removeAllPermissionsFromRole = async (req, res) => {
    try {
        logger.info({ role_id: req.params.role_id }, 'removeAllPermissionsFromRole');
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
        logger.info({ role_id }, 'removeAllPermissionsFromRole: success');
        res.status(200).json(result);
    } catch (error) {
        return handleError(error, res, 'removeAllPermissionsFromRole');
    }
};