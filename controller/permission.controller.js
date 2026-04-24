import Joi from 'joi';
import * as permissionDB from '../db/permission.db.js';
import logger from '../utils/logger.js';
import { handleError } from '../utils/errors.js';

export const createPermissionSchema = Joi.object({
    permission_name: Joi.string().trim().min(3).max(100).required().messages({
        'string.base': 'Permission name should be a type of text',
        'string.empty': 'Permission name cannot be an empty field',
        'string.min': 'Permission name should have a minimum length of 3 characters',
        'string.max': 'Permission name should have a maximum length of 100 characters',
        'any.required': 'Permission name is a required field'
    }),
    module: Joi.string().trim().max(50).optional().messages({
        'string.base': 'Module should be a type of text',
        'string.max': 'Module should have a maximum length of 50 characters'
    }),
    description: Joi.string().trim().max(255).optional().messages({
        'string.base': 'Permission description should be a type of text',
        'string.max': 'Permission description should have a maximum length of 255 characters'
    })
});

export const updatePermissionSchema = Joi.object({
    permission_name: Joi.string().trim().min(3).max(100).optional().messages({
        'string.base': 'Permission name should be a type of text',
        'string.empty': 'Permission name cannot be an empty field',
        'string.min': 'Permission name should have a minimum length of 3 characters',
        'string.max': 'Permission name should have a maximum length of 100 characters'
    }),
    module: Joi.string().trim().max(50).optional().allow('').messages({
        'string.base': 'Module should be a type of text',
        'string.max': 'Module should have a maximum length of 50 characters'
    }),
    description: Joi.string().trim().max(255).optional().allow('').messages({
        'string.base': 'Permission description should be a type of text',
        'string.max': 'Permission description should have a maximum length of 255 characters'
    })
}).min(1);

export const getPermissionsSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('permission_id', 'permission_name', 'module', 'description').default('permission_id'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC')
});

export const permissionIdSchema = Joi.object({
    id: Joi.number().integer().min(1).required()
});

export const createPermission = async (req, res) => {
    try {
        logger.info({
            body: req.body,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        }, 'POST /permissions - Create permission request received');

        const { error, value } = createPermissionSchema.validate(req.body);
        if (error) {
            logger.warn({
                error: error.details[0].message,
                body: req.body
            }, 'Permission creation validation failed');
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const existingPermission = await permissionDB.permissionExistsByName(value.permission_name);
        if (existingPermission) {
            logger.warn({
                permission_name: value.permission_name
            }, 'Permission creation failed - name already exists');
            return res.status(409).json({
                success: false,
                message: 'Permission name already exists'
            });
        }

        const result = await permissionDB.createPermission(value);
        logger.info({
            permission_id: result.data.permission_id,
            permission_name: result.data.permission_name
        }, 'Permission created successfully');

        return res.status(201).json({
            success: true,
            data: result.data,
            message: 'Permission created successfully'
        });
    } catch (error) {
        logger.error({
            error: error.message,
            stack: error.stack,
            body: req.body
        }, 'Error in createPermission controller');
        return handleError(error, res, 'permissions');
    }
};


export const getAllPermissions = async (req, res) => {
    try {
        logger.info({
            query: req.query,
            ip: req.ip
        }, 'GET /permissions - Get all permissions request received');

        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            sortBy: req.query.sortBy || 'permission_id',
            sortOrder: req.query.sortOrder || 'ASC'
        };

        const result = await permissionDB.getAllPermissions(options);
        logger.info({
            count: result.data.length,
            pagination: result.pagination
        }, 'Permissions retrieved successfully');

        return res.status(200).json({
            success: true,
            data: result.data,
            pagination: result.pagination,
            message: 'Permissions retrieved successfully'
        });
    } catch (error) {
        logger.error({
            error: error.message,
            stack: error.stack,
            query: req.query
        }, 'Error in getAllPermissions controller');
        return handleError(error, res, 'permissions');
    }
};


export const getPermissionById = async (req, res) => {
    try {
        const permissionId = parseInt(req.params.id);
        
        logger.info({
            permissionId,
            ip: req.ip
        }, 'GET /permissions/:id - Get permission by ID request received');

        if (!permissionId || isNaN(permissionId)) {
            logger.warn({ permissionId: req.params.id }, 'Invalid permission ID provided');
            return res.status(400).json({
                success: false,
                message: 'Invalid permission ID'
            });
        }

        const result = await permissionDB.getPermissionById(permissionId);

        if (!result.success) {
            logger.warn({ permissionId }, 'Permission not found');
            return res.status(404).json({
                success: false,
                message: 'Permission not found'
            });
        }

        logger.info({
            permissionId,
            permission_name: result.data.permission_name
        }, 'Permission retrieved successfully');

        return res.status(200).json({
            success: true,
            data: result.data,
            message: 'Permission retrieved successfully'
        });
    } catch (error) {
        logger.error({
            error: error.message,
            stack: error.stack,
            permissionId: req.params.id
        }, 'Error in getPermissionById controller');
        return handleError(error, res, 'permissions');
    }
};

export const updatePermission = async (req, res) => {
    try {
        const permissionId = parseInt(req.params.id);
        
        logger.info({
            permissionId,
            body: req.body,
            ip: req.ip
        }, 'PUT /permissions/:id - Update permission request received');

        if (!permissionId || isNaN(permissionId)) {
            logger.warn({ permissionId: req.params.id }, 'Invalid permission ID provided for update');
            return res.status(400).json({
                success: false,
                message: 'Invalid permission ID'
            });
        }

        const { error, value } = updatePermissionSchema.validate(req.body);
        if (error) {
            logger.warn({
                error: error.details[0].message,
                body: req.body,
                permissionId
            }, 'Permission update validation failed');
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const existingPermission = await permissionDB.getPermissionById(permissionId);
        if (!existingPermission.success) {
            logger.warn({ permissionId }, 'Permission not found for update');
            return res.status(404).json({
                success: false,
                message: 'Permission not found'
            });
        }

        // Check if new name already exists (excluding current permission)
        if (value.permission_name !== existingPermission.data.permission_name) {
            const nameExists = await permissionDB.permissionExistsByName(value.permission_name);
            if (nameExists) {
                logger.warn({
                    permissionId,
                    existing_name: existingPermission.data.permission_name,
                    new_name: value.permission_name
                }, 'Permission update failed - name already exists');
                return res.status(409).json({
                    success: false,
                    message: 'Permission name already exists'
                });
            }
        }

        const result = await permissionDB.updatePermission(permissionId, value);

        if (!result.success) {
            logger.warn({ permissionId }, 'Permission update failed');
            return res.status(404).json({
                success: false,
                message: 'Permission not found'
            });
        }

        logger.info({
            permissionId,
            old_name: existingPermission.data.permission_name,
            new_name: result.data.permission_name
        }, 'Permission updated successfully');

        return res.status(200).json({
            success: true,
            data: result.data,
            message: 'Permission updated successfully'
        });
    } catch (error) {
        logger.error({
            error: error.message,
            stack: error.stack,
            permissionId: req.params.id,
            body: req.body
        }, 'Error in updatePermission controller');
        return handleError(error, res, 'permissions');
    }
};

export const deletePermission = async (req, res) => {
    try {
        const permissionId = parseInt(req.params.id);
        
        logger.info({
            permissionId,
            ip: req.ip
        }, 'DELETE /permissions/:id - Delete permission request received');

        if (!permissionId || isNaN(permissionId)) {
            logger.warn({ permissionId: req.params.id }, 'Invalid permission ID provided for deletion');
            return res.status(400).json({
                success: false,
                message: 'Invalid permission ID'
            });
        }

        const existingPermission = await permissionDB.getPermissionById(permissionId);
        if (!existingPermission.success) {
            logger.warn({ permissionId }, 'Permission not found for deletion');
            return res.status(404).json({
                success: false,
                message: 'Permission not found'
            });
        }

        const result = await permissionDB.deletePermission(permissionId);

        if (!result.success) {
            logger.warn({ permissionId }, 'Permission deletion failed');
            return res.status(404).json({
                success: false,
                message: 'Permission not found'
            });
        }

        logger.info({
            permissionId,
            permission_name: existingPermission.data.permission_name
        }, 'Permission deleted successfully');

        return res.status(200).json({
            success: true,
            data: { id: permissionId },
            message: 'Permission deleted successfully'
        });
    } catch (error) {
        logger.error({
            error: error.message,
            stack: error.stack,
            permissionId: req.params.id
        }, 'Error in deletePermission controller');
        return handleError(error, res, 'permissions');
    }
};

export const checkPermissionExists = async (req, res) => {
    try {
        const { permission_name } = req.params;
        
        logger.info({
            permission_name,
            ip: req.ip
        }, 'GET /permissions/check/:permission_name - Check permission exists request received');

        if (!permission_name || permission_name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Permission name is required'
            });
        }

        const exists = await permissionDB.permissionExistsByName(permission_name);

        logger.info({
            permission_name,
            exists
        }, 'Permission existence check completed');

        return res.status(200).json({
            success: true,
            message: 'Permission existence check completed',
            data: { exists, permission_name }
        });
    } catch (error) {
        logger.error({
            error: error.message,
            stack: error.stack,
            permission_name: req.params.permission_name
        }, 'Error in checkPermissionExists controller');
        return handleError(error, res, 'permissions');
    }
}; 