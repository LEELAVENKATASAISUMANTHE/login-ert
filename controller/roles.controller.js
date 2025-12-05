import Joi from 'joi';
import * as roleDB from '../db/role.db.js';
import logger from '../utils/logger.js';

// ===== VALIDATION SCHEMAS =====

export const createRoleSchema = Joi.object({
  role_name: Joi.string()
    .trim()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.base': 'Role name should be a type of text',
      'string.empty': 'Role name cannot be an empty field',
      'string.min': 'Role name should have a minimum length of 3 characters',
      'string.max': 'Role name should have a maximum length of 30 characters',
      'any.required': 'Role name is a required field'
    }),
  role_description: Joi.string()
    .trim()
    .max(255)
    .optional()
    .messages({
      'string.base': 'Role description should be a type of text',
      'string.max': 'Role description should have a maximum length of 255 characters'
    })
});

export const updateRoleSchema = createRoleSchema;

export const getRolesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('id', 'role_name', 'role_description', 'created_at', 'updated_at').default('created_at'),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
});

export const roleIdSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
});

// ===== CONTROLLER FUNCTIONS =====

/**
 * Create a new role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createRole = async (req, res) => {
  try {
    logger.info('POST /roles - Create role request received', {
      body: req.body,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Validate request body
    const { error, value } = createRoleSchema.validate(req.body);
    if (error) {
      logger.warn('Role creation validation failed', {
        error: error.details[0].message,
        body: req.body
      });
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if role already exists
    const exists = await roleDB.roleExistsByName(value.role_name);
    if (exists) {
      logger.warn('Role creation failed - role already exists', {
        role_name: value.role_name
      });
      return res.status(409).json({
        success: false,
        message: 'Role name already exists'
      });
    }

    // Create the role
    const result = await roleDB.createRole(value);
    
    logger.info('Role created successfully', {
      role: result.data
    });

    return res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: result.data
    });

  } catch (error) {
    logger.error('Error in createRole controller', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong' // Removed env check - always show generic error
    });
  }
};

/**
 * Get all roles with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllRoles = async (req, res) => {
  try {
    logger.info('GET /roles - Get all roles request received', {
      query: req.query,
      ip: req.ip
    });

    // Validate query parameters
    const { error, value } = getRolesSchema.validate(req.query);
    if (error) {
      logger.warn('Get roles validation failed', {
        error: error.details[0].message,
        query: req.query
      });
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Get roles from database
    const result = await roleDB.getAllRoles(value);

    logger.info('Roles retrieved successfully', {
      count: result.data.length,
      pagination: result.pagination
    });

    return res.status(200).json({
      success: true,
      message: 'Roles retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });

  } catch (error) {
    logger.error('Error in getAllRoles controller', {
      error: error.message,
      stack: error.stack,
      query: req.query
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong' // Removed env check - always show generic error
    });
  }
};

/**
 * Get role by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRoleById = async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);
    
    logger.info('GET /roles/:id - Get role by ID request received', {
      roleId,
      ip: req.ip
    });

    // Validate role ID
    if (!roleId || isNaN(roleId)) {
      logger.warn('Invalid role ID provided', { roleId: req.params.id });
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
    }

    // Get role from database
    const result = await roleDB.getRoleById(roleId);

    if (!result.success) {
      logger.warn('Role not found', { roleId });
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    logger.info('Role retrieved successfully', {
      roleId,
      role_name: result.data.role_name
    });

    return res.status(200).json({
      success: true,
      message: 'Role retrieved successfully',
      data: result.data
    });

  } catch (error) {
    logger.error('Error in getRoleById controller', {
      error: error.message,
      stack: error.stack,
      roleId: req.params.id
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong' // Removed env check - always show generic error
    });
  }
};

/**
 * Update role by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateRole = async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);
    
    logger.info('PUT /roles/:id - Update role request received', {
      roleId,
      body: req.body,
      ip: req.ip
    });

    // Validate role ID
    if (!roleId || isNaN(roleId)) {
      logger.warn('Invalid role ID provided for update', { roleId: req.params.id });
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
    }

    // Validate request body
    const { error, value } = updateRoleSchema.validate(req.body);
    if (error) {
      logger.warn('Role update validation failed', {
        error: error.details[0].message,
        body: req.body,
        roleId
      });
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if role exists
    const existingRole = await roleDB.getRoleById(roleId);
    if (!existingRole.success) {
      logger.warn('Role not found for update', { roleId });
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if new name already exists (excluding current role)
    if (value.role_name !== existingRole.data.role_name) {
      const nameExists = await roleDB.roleExistsByName(value.role_name);
      if (nameExists) {
        logger.warn('Role update failed - name already exists', {
          roleId,
          existing_name: existingRole.data.role_name,
          new_name: value.role_name
        });
        return res.status(409).json({
          success: false,
          message: 'Role name already exists'
        });
      }
    }

    // Update the role
    const result = await roleDB.updateRole(roleId, value);

    if (!result.success) {
      logger.warn('Role update failed', { roleId });
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    logger.info('Role updated successfully', {
      roleId,
      old_name: existingRole.data.role_name,
      new_name: result.data.role_name
    });

    return res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: result.data
    });

  } catch (error) {
    logger.error('Error in updateRole controller', {
      error: error.message,
      stack: error.stack,
      roleId: req.params.id,
      body: req.body
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong' // Removed env check - always show generic error
    });
  }
};

/**
 * Delete role by ID (soft delete)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteRole = async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);
    
    logger.info('DELETE /roles/:id - Delete role request received', {
      roleId,
      ip: req.ip
    });

    // Validate role ID
    if (!roleId || isNaN(roleId)) {
      logger.warn('Invalid role ID provided for deletion', { roleId: req.params.id });
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
    }

    // Check if role exists before deletion
    const existingRole = await roleDB.getRoleById(roleId);
    if (!existingRole.success) {
      logger.warn('Role not found for deletion', { roleId });
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Delete the role (soft delete)
    const result = await roleDB.deleteRole(roleId);

    if (!result.success) {
      logger.warn('Role deletion failed', { roleId });
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    logger.info('Role deleted successfully', {
      roleId,
      role_name: existingRole.data.role_name
    });

    return res.status(200).json({
      success: true,
      message: 'Role deleted successfully',
      data: { id: roleId }
    });

  } catch (error) {
    logger.error('Error in deleteRole controller', {
      error: error.message,
      stack: error.stack,
      roleId: req.params.id
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong' // Removed env check - always show generic error
    });
  }
};

/**
 * Check if role exists by name
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const checkRoleExists = async (req, res) => {
  try {
    const { role_name } = req.params;
    
    logger.info('GET /roles/check/:role_name - Check role exists request received', {
      role_name,
      ip: req.ip
    });

    if (!role_name || role_name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    const exists = await roleDB.roleExistsByName(role_name);

    logger.info('Role existence check completed', {
      role_name,
      exists
    });

    return res.status(200).json({
      success: true,
      message: 'Role existence check completed',
      data: { exists, role_name }
    });

  } catch (error) {
    logger.error('Error in checkRoleExists controller', {
      error: error.message,
      stack: error.stack,
      role_name: req.params.role_name
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong' // Removed env check - always show generic error
    });
  }
};