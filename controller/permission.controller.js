import Joi from 'joi';
import * as permissionDB from '../db/permission.db.js';
import logger from '../utils/logger.js';

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
        logger.info('POST /permissions - Create permission request received', {
            body: req.body,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        });

        const { error, value } = createPermissionSchema.validate(req.body);
        if (error) {
            logger.warn('Permission creation validation failed', {
                error: error.details[0].message,
                body: req.body
            });
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.details[0].message
            });
        }

        const existingPermission = await permissionDB.permissionExistsByName(value.permission_name);
        if (existingPermission) {
            logger.warn('Permission creation failed - name already exists', {
                permission_name: value.permission_name
            });
            return res.status(409).json({
                success: false,
                message: 'Permission name already exists'
            });
        }

        const result = await permissionDB.createPermission(value);
        logger.info('Permission created successfully', {
            permission_id: result.data.permission_id,
            permission_name: result.data.permission_name
        });

        return res.status(201).json({
            success: true,
            data: result.data,
            message: 'Permission created successfully'
        });
    } catch (error) {
        logger.error('Error in createPermission controller', {
            error: error.message,
            stack: error.stack,
            body: req.body
        });
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: 'Something went wrong'
        });
    }
};


export const getAllPermissions = async (req, res) => {
    try {
        logger.info('GET /permissions - Get all permissions request received', {
            query: req.query,
            ip: req.ip
        });

        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            sortBy: req.query.sortBy || 'permission_id',
            sortOrder: req.query.sortOrder || 'ASC'
        };

        const result = await permissionDB.getAllPermissions(options);
        logger.info('Permissions retrieved successfully', {
            count: result.data.length,
            pagination: result.pagination
        });

        return res.status(200).json({
            success: true,
            data: result.data,
            pagination: result.pagination,
            message: 'Permissions retrieved successfully'
        });
    } catch (error) {
        logger.error('Error in getAllPermissions controller', {
            error: error.message,
            stack: error.stack,
            query: req.query
        });
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: 'Something went wrong'
        });
    }
};


export const getPermissionById = async (req, res) => {
    try {
        const permissionId = parseInt(req.params.id);
        
        logger.info('GET /permissions/:id - Get permission by ID request received', {
            permissionId,
            ip: req.ip
        });

        if (!permissionId || isNaN(permissionId)) {
            logger.warn('Invalid permission ID provided', { permissionId: req.params.id });
            return res.status(400).json({
                success: false,
                message: 'Invalid permission ID'
            });
        }

        const result = await permissionDB.getPermissionById(permissionId);

        if (!result.success) {
            logger.warn('Permission not found', { permissionId });
            return res.status(404).json({
                success: false,
                message: 'Permission not found'
            });
        }

        logger.info('Permission retrieved successfully', {
            permissionId,
            permission_name: result.data.permission_name
        });

        return res.status(200).json({
            success: true,
            data: result.data,
            message: 'Permission retrieved successfully'
        });
    } catch (error) {
        logger.error('Error in getPermissionById controller', {
            error: error.message,
            stack: error.stack,
            permissionId: req.params.id
        });
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: 'Something went wrong'
        });
    }
};

export const updatePermission = async (req, res) => {
    try {
        const permissionId = parseInt(req.params.id);
        
        logger.info('PUT /permissions/:id - Update permission request received', {
            permissionId,
            body: req.body,
            ip: req.ip
        });

        if (!permissionId || isNaN(permissionId)) {
            logger.warn('Invalid permission ID provided for update', { permissionId: req.params.id });
            return res.status(400).json({
                success: false,
                message: 'Invalid permission ID'
            });
        }

        const { error, value } = updatePermissionSchema.validate(req.body);
        if (error) {
            logger.warn('Permission update validation failed', {
                error: error.details[0].message,
                body: req.body,
                permissionId
            });
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.details[0].message
            });
        }

        const existingPermission = await permissionDB.getPermissionById(permissionId);
        if (!existingPermission.success) {
            logger.warn('Permission not found for update', { permissionId });
            return res.status(404).json({
                success: false,
                message: 'Permission not found'
            });
        }

        // Check if new name already exists (excluding current permission)
        if (value.permission_name !== existingPermission.data.permission_name) {
            const nameExists = await permissionDB.permissionExistsByName(value.permission_name);
            if (nameExists) {
                logger.warn('Permission update failed - name already exists', {
                    permissionId,
                    existing_name: existingPermission.data.permission_name,
                    new_name: value.permission_name
                });
                return res.status(409).json({
                    success: false,
                    message: 'Permission name already exists'
                });
            }
        }

        const result = await permissionDB.updatePermission(permissionId, value);

        if (!result.success) {
            logger.warn('Permission update failed', { permissionId });
            return res.status(404).json({
                success: false,
                message: 'Permission not found'
            });
        }

        logger.info('Permission updated successfully', {
            permissionId,
            old_name: existingPermission.data.permission_name,
            new_name: result.data.permission_name
        });

        return res.status(200).json({
            success: true,
            data: result.data,
            message: 'Permission updated successfully'
        });
    } catch (error) {
        logger.error('Error in updatePermission controller', {
            error: error.message,
            stack: error.stack,
            permissionId: req.params.id,
            body: req.body
        });
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: 'Something went wrong'
        });
    }
};

export const deletePermission = async (req, res) => {
    try {
        const permissionId = parseInt(req.params.id);
        
        logger.info('DELETE /permissions/:id - Delete permission request received', {
            permissionId,
            ip: req.ip
        });

        if (!permissionId || isNaN(permissionId)) {
            logger.warn('Invalid permission ID provided for deletion', { permissionId: req.params.id });
            return res.status(400).json({
                success: false,
                message: 'Invalid permission ID'
            });
        }

        const existingPermission = await permissionDB.getPermissionById(permissionId);
        if (!existingPermission.success) {
            logger.warn('Permission not found for deletion', { permissionId });
            return res.status(404).json({
                success: false,
                message: 'Permission not found'
            });
        }

        const result = await permissionDB.deletePermission(permissionId);

        if (!result.success) {
            logger.warn('Permission deletion failed', { permissionId });
            return res.status(404).json({
                success: false,
                message: 'Permission not found'
            });
        }

        logger.info('Permission deleted successfully', {
            permissionId,
            permission_name: existingPermission.data.permission_name
        });

        return res.status(200).json({
            success: true,
            data: { id: permissionId },
            message: 'Permission deleted successfully'
        });
    } catch (error) {
        logger.error('Error in deletePermission controller', {
            error: error.message,
            stack: error.stack,
            permissionId: req.params.id
        });
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: 'Something went wrong'
        });
    }
};

export const checkPermissionExists = async (req, res) => {
    try {
        const { permission_name } = req.params;
        
        logger.info('GET /permissions/check/:permission_name - Check permission exists request received', {
            permission_name,
            ip: req.ip
        });

        if (!permission_name || permission_name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Permission name is required'
            });
        }

        const exists = await permissionDB.permissionExistsByName(permission_name);

        logger.info('Permission existence check completed', {
            permission_name,
            exists
        });

        return res.status(200).json({
            success: true,
            message: 'Permission existence check completed',
            data: { exists, permission_name }
        });
    } catch (error) {
        logger.error('Error in checkPermissionExists controller', {
            error: error.message,
            stack: error.stack,
            permission_name: req.params.permission_name
        });
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: 'Something went wrong'
        });
    }
}; 