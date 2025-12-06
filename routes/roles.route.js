import express from 'express';
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  checkRoleExists
} from '../controller/roles.controller.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Middleware to log all role route requests
router.use((req, res, next) => {
  logger.info('Role route accessed', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// ===== ROLE ROUTES =====

/**
 * @route   GET /api/roles
 * @desc    Get all roles with pagination
 * @access  Public
 * @query   { page?: number, limit?: number, sortBy?: string, sortOrder?: string }
 * @example GET /api/roles?page=1&limit=10&sortBy=role_name&sortOrder=ASC
 */
router.get('/', getAllRoles);

/**
 * @route   GET /api/roles/check/:role_name
 * @desc    Check if a role exists by name
 * @access  Public
 * @params  role_name (string)
 * @example GET /api/roles/check/admin
 */
router.get('/check/:role_name', checkRoleExists);

/**
 * @route   GET /api/roles/:role_id
 * @desc    Get a single role by ID (Updated to use role_id)
 * @access  Public
 * @params  role_id (number) - The role ID from your database
 * @example GET /api/roles/1
 */
router.get('/:role_id', (req, res, next) => {
  // Convert role_id parameter to match controller expectation
  req.params.id = req.params.role_id;
  getRoleById(req, res, next);
});


/**
 * @route   GET /api/roles/search/:searchTerm
 * @desc    Search roles by name (bonus endpoint)
 * @access  Public
 * @params  searchTerm (string)
 * @example GET /api/roles/search/admin
 */
router.get('/search/:searchTerm', async (req, res) => {
  try {
    const { searchTerm } = req.params;
    
    logger.info('Role search request received', {
      searchTerm,
      ip: req.ip
    });

    // You can implement this in your role.db.js if needed
    // For now, return a simple response
    res.status(200).json({
      success: true,
      message: 'Search endpoint - not implemented yet',
      searchTerm: searchTerm
    });
  } catch (error) {
    logger.error('Error in role search', {
      error: error.message,
      searchTerm: req.params.searchTerm
    });
    
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: 'Something went wrong'
    });
  }
});

/**
 * @route   GET /api/roles/count/total
 * @desc    Get total count of roles (bonus endpoint)
 * @access  Public
 * @example GET /api/roles/count/total
 */
router.get('/count/total', async (req, res) => {
  try {
    logger.info('Role count request received', { ip: req.ip });
    
    // You can implement this in your role.db.js if needed
    res.status(200).json({
      success: true,
      message: 'Count endpoint - not implemented yet',
      data: { count: 0 }
    });
  } catch (error) {
    logger.error('Error getting role count', {
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Count failed',
      error: 'Something went wrong'
    });
  }
});

// ===== ERROR HANDLING MIDDLEWARE =====

// Handle 404 for role routes
router.use('*', (req, res) => {
  logger.warn('Role route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  
  res.status(404).json({
    success: false,
    message: 'Role endpoint not found',
    error: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: {
      'POST /api/roles': 'Create a new role',
      'GET /api/roles': 'Get all roles with pagination',
      'GET /api/roles/:role_id': 'Get role by ID',
      'PUT /api/roles/:role_id': 'Update role by ID',
      'DELETE /api/roles/:role_id': 'Delete role by ID',
      'GET /api/roles/check/:role_name': 'Check if role exists',
      'GET /api/roles/search/:searchTerm': 'Search roles (not implemented)',
      'GET /api/roles/count/total': 'Get total role count (not implemented)'
    }
  });
});

/**
 * @route   POST /api/roles
 * @desc    Create a new role
 * @access  Public (you can add authentication middleware later)
 * @body    { role_name: string, role_description?: string }
 * @example POST /api/roles
 *          Body: { "role_name": "admin", "role_description": "Administrator role" }
 */
router.post('/', createRole);

/**
 * @route   PUT /api/roles/:role_id
 * @desc    Update a role by ID (Updated to use role_id)
 * @access  Public (you can add authentication middleware later)
 * @params  role_id (number) - The role ID from your database
 * @body    { role_name: string, role_description?: string }
 * @example PUT /api/roles/1
 *          Body: { "role_name": "super_admin", "role_description": "Super administrator" }
 */
router.put('/:role_id', (req, res, next) => {
  // Convert role_id parameter to match controller expectation
  req.params.id = req.params.role_id;
  updateRole(req, res, next);
});

/**
 * @route   DELETE /api/roles/:role_id
 * @desc    Delete a role by ID (Updated to use role_id - HARD DELETE)
 * @access  Public (you can add authentication middleware later)
 * @params  role_id (number) - The role ID from your database
 * @example DELETE /api/roles/1
 */
router.delete('/:role_id', (req, res, next) => {
  // Convert role_id parameter to match controller expectation
  req.params.id = req.params.role_id;
  deleteRole(req, res, next);
});

// ===== ADDITIONAL HELPFUL ROUTES =====

// Handle errors in role routes
router.use((error, req, res, next) => {
  logger.error('Role route error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error in role routes',
    error: 'Something went wrong'
  });
});

export default router;