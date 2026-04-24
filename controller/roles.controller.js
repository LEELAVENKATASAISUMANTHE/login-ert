import Joi from 'joi';
import * as roleDB from '../db/role.db.js';
import logger from '../utils/logger.js';
import { handleError } from '../utils/errors.js';

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
    logger.info({
      body: req.body,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }, 'POST /roles - Create role request received');

    // Validate request body
    const { error, value } = createRoleSchema.validate(req.body);
    if (error) {
      logger.warn({
        error: error.details[0].message,
        body: req.body
      }, 'Role creation validation failed');
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Check if role already exists
    const exists = await roleDB.roleExistsByName(value.role_name);
    if (exists) {
      logger.warn({
        role_name: value.role_name
      }, 'Role creation failed - role already exists');
      return res.status(409).json({
        success: false,
        message: 'Role name already exists'
      });
    }

    // Create the role
    const result = await roleDB.createRole(value);
    
    logger.info({
      role: result.data
    }, 'Role created successfully');

    return res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: result.data
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack,
      body: req.body
    }, 'Error in createRole controller');

    return handleError(error, res, 'roles');
  }
};

/**
 * Get all roles with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllRoles = async (req, res) => {
  try {
    logger.info({
      query: req.query,
      ip: req.ip
    }, 'GET /roles - Get all roles request received');

    // Validate query parameters
    const { error, value } = getRolesSchema.validate(req.query);
    if (error) {
      logger.warn({
        error: error.details[0].message,
        query: req.query
      }, 'Get roles validation failed');
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Get roles from database
    const result = await roleDB.getAllRoles(value);

    logger.info({
      count: result.data.length,
      pagination: result.pagination
    }, 'Roles retrieved successfully');

    return res.status(200).json({
      success: true,
      message: 'Roles retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack,
      query: req.query
    }, 'Error in getAllRoles controller');

    return handleError(error, res, 'roles');
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
    
    logger.info({
      roleId,
      ip: req.ip
    }, 'GET /roles/:id - Get role by ID request received');

    // Validate role ID
    if (!roleId || isNaN(roleId)) {
      logger.warn({ roleId: req.params.id }, 'Invalid role ID provided');
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
    }

    // Get role from database
    const result = await roleDB.getRoleById(roleId);

    if (!result.success) {
      logger.warn({ roleId }, 'Role not found');
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    logger.info({
      roleId,
      role_name: result.data.role_name
    }, 'Role retrieved successfully');

    return res.status(200).json({
      success: true,
      message: 'Role retrieved successfully',
      data: result.data
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack,
      roleId: req.params.id
    }, 'Error in getRoleById controller');

    return handleError(error, res, 'roles');
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
    
    logger.info({
      roleId,
      body: req.body,
      ip: req.ip
    }, 'PUT /roles/:id - Update role request received');

    // Validate role ID
    if (!roleId || isNaN(roleId)) {
      logger.warn({ roleId: req.params.id }, 'Invalid role ID provided for update');
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
    }

    // Validate request body
    const { error, value } = updateRoleSchema.validate(req.body);
    if (error) {
      logger.warn({
        error: error.details[0].message,
        body: req.body,
        roleId
      }, 'Role update validation failed');
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Optimized: Use combined query to reduce 3 DB calls to 1
    const validation = await roleDB.validateRoleUpdate(roleId, value.role_name);
    
    if (!validation.roleExists) {
      logger.warn({ roleId }, 'Role not found for update');
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    if (validation.nameExists) {
      logger.warn({
        roleId,
        existing_name: validation.oldName,
        new_name: value.role_name
      }, 'Role update failed - name already exists');
      return res.status(409).json({
        success: false,
        message: 'Role name already exists'
      });
    }

    // Update the role
    const result = await roleDB.updateRole(roleId, value);

    if (!result.success) {
      logger.warn({ roleId }, 'Role update failed');
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    logger.info({
      roleId,
      old_name: validation.oldName,
      new_name: result.data.role_name
    }, 'Role updated successfully');

    return res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: result.data
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack,
      roleId: req.params.id,
      body: req.body
    }, 'Error in updateRole controller');

    return handleError(error, res, 'roles');
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
    
    logger.info({
      roleId,
      ip: req.ip
    }, 'DELETE /roles/:id - Delete role request received');

    // Validate role ID
    if (!roleId || isNaN(roleId)) {
      logger.warn({ roleId: req.params.id }, 'Invalid role ID provided for deletion');
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
    }

    // Optimized: Use combined query to reduce 2 DB calls to 1
    const validation = await roleDB.validateRoleDelete(roleId);
    
    if (!validation.roleExists) {
      logger.warn({ roleId }, 'Role not found for deletion');
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Delete the role (soft delete)
    const result = await roleDB.deleteRole(roleId);

    if (!result.success) {
      logger.warn({ roleId }, 'Role deletion failed');
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    logger.info({
      roleId,
      role_name: validation.roleName
    }, 'Role deleted successfully');

    return res.status(200).json({
      success: true,
      message: 'Role deleted successfully',
      data: { id: roleId }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack,
      roleId: req.params.id
    }, 'Error in deleteRole controller');

    return handleError(error, res, 'roles');
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
    
    logger.info({
      role_name,
      ip: req.ip
    }, 'GET /roles/check/:role_name - Check role exists request received');

    if (!role_name || role_name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    const exists = await roleDB.roleExistsByName(role_name);

    logger.info({
      role_name,
      exists
    }, 'Role existence check completed');

    return res.status(200).json({
      success: true,
      message: 'Role existence check completed',
      data: { exists, role_name }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack,
      role_name: req.params.role_name
    }, 'Error in checkRoleExists controller');

    return handleError(error, res, 'roles');
  }
};


export const getRolesformenu = async (req, res) => {
  try {
    const result = await roleDB.getRoles();
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'Roles not found'
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Roles retrieved successfully',
      data: result.data
    });
  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Error in getRolesformenu controller');
    return handleError(error, res, 'roles');
  }
};  