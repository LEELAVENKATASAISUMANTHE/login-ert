import { Router } from 'express';
import * as rolePermissionController from '../controller/role_permissions.controller.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @route   POST /api/role-permissions/assign
 * @desc    Assign a single permission to a role
 * @access  Private (Admin only)
 * @body    { role_id: number, permission_id: number }
 * @example POST /api/role-permissions/assign
 *          {
 *            "role_id": 1,
 *            "permission_id": 5
 *          }
 */
router.post('/assign', rolePermissionController.assignPermissionToRole);

/**
 * @route   POST /api/role-permissions/assign-multiple
 * @desc    Assign multiple permissions to a role
 * @access  Private (Admin only)
 * @body    { role_id: number, permission_ids: number[] }
 * @example POST /api/role-permissions/assign-multiple
 *          {
 *            "role_id": 1,
 *            "permission_ids": [1, 2, 3, 4]
 *          }
 */
router.post('/assign-multiple', rolePermissionController.assignPermissionsToRole);

/**
 * @route   GET /api/role-permissions
 * @desc    Get all role-permission assignments with optional filtering
 * @access  Private
 * @query   { page?: number, limit?: number, role_id?: number, permission_id?: number }
 * @example GET /api/role-permissions?page=1&limit=10&role_id=1
 */
router.get('/', rolePermissionController.getAllRolePermissions);

/**
 * @route   GET /api/role-permissions/role/:role_id
 * @desc    Get all permissions assigned to a specific role
 * @access  Private
 * @params  { role_id: number }
 * @query   { page?: number, limit?: number }
 * @example GET /api/role-permissions/role/1?page=1&limit=10
 */
router.get('/role/:role_id', rolePermissionController.getRolePermissions);

/**
 * @route   DELETE /api/role-permissions/remove
 * @desc    Remove a specific permission from a role
 * @access  Private (Admin only)
 * @body    { role_id: number, permission_id: number }
 * @example DELETE /api/role-permissions/remove
 *          {
 *            "role_id": 1,
 *            "permission_id": 5
 *          }
 */
router.delete('/remove', rolePermissionController.removePermissionFromRole);

/**
 * @route   DELETE /api/role-permissions/role/:role_id
 * @desc    Remove all permissions from a specific role
 * @access  Private (Admin only)
 * @params  { role_id: number }
 * @example DELETE /api/role-permissions/role/1
 */
router.delete('/role/:role_id', rolePermissionController.removeAllPermissionsFromRole);

export default router;