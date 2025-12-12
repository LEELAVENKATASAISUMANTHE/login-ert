import { Router } from 'express';
import * as permissionController from '../controller/permission.controller.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @route   POST /api/permissions
 * @desc    Create a new permission
 * @access  Private (Admin only)
 * @body    { permission_name: string, module?: string, description?: string }
 * @example POST /api/permissions
 *          {
 *            "permission_name": "users.read",
 *            "module": "users",
 *            "description": "Permission to view user information"
 *          }
 */
router.post('/', permissionController.createPermission);

/**
 * @route   GET /api/permissions
 * @desc    Get all permissions with pagination
 * @access  Private
 * @query   { page?: number, limit?: number, sortBy?: string, sortOrder?: 'ASC'|'DESC' }
 * @example GET /api/permissions?page=1&limit=10&sortBy=permission_name&sortOrder=ASC
 */
router.get('/', permissionController.getAllPermissions);

/**
 * @route   GET /api/permissions/:id
 * @desc    Get permission by ID
 * @access  Private
 * @param   {number} id - Permission ID
 * @example GET /api/permissions/123
 */
router.get('/:id', permissionController.getPermissionById);

/**
 * @route   PUT /api/permissions/:id
 * @desc    Update permission by ID
 * @access  Private (Admin only)
 * @param   {number} id - Permission ID
 * @body    { permission_name?: string, module?: string, description?: string }
 * @example PUT /api/permissions/123
 *          {
 *            "permission_name": "users.write",
 *            "description": "Permission to create and modify users"
 *          }
 */
router.put('/:id', permissionController.updatePermission);

/**
 * @route   DELETE /api/permissions/:id
 * @desc    Delete permission by ID
 * @access  Private (Admin only)
 * @param   {number} id - Permission ID
 * @example DELETE /api/permissions/123
 */
router.delete('/:id', permissionController.deletePermission);

/**
 * @route   GET /api/permissions/check/:permission_name
 * @desc    Check if permission exists by name
 * @access  Private
 * @param   {string} permission_name - Permission name to check
 * @example GET /api/permissions/check/users.read
 */
router.get('/check/:permission_name', permissionController.checkPermissionExists);

// Log all permission route registrations
logger.info('Permission routes registered successfully', {
    routes: [
        'POST /',
        'GET /',
        'GET /:id',
        'PUT /:id',
        'DELETE /:id',
        'GET /check/:permission_name'
    ],
    module: 'permissions.route.js'
});

export default router;