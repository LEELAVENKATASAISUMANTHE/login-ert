import { Router } from 'express';
import * as rolePermissionController from '../controller/role_permissions.controller.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @swagger
 * /role-permissions/assign:
 *   post:
 *     summary: Assign a single permission to a role
 *     tags: [Role Permissions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role_id, permission_id]
 *             properties:
 *               role_id:
 *                 type: integer
 *                 example: 1
 *               permission_id:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Permission assigned to role
 *       400:
 *         description: Validation error
 *       409:
 *         description: Assignment already exists
 */
router.post('/assign', rolePermissionController.assignPermissionToRole);

/**
 * @swagger
 * /role-permissions/assign-multiple:
 *   post:
 *     summary: Assign multiple permissions to a role
 *     tags: [Role Permissions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role_id, permission_ids]
 *             properties:
 *               role_id:
 *                 type: integer
 *                 example: 1
 *               permission_ids:
 *                 type: array
 *                 items: { type: integer }
 *                 example: [1, 2, 3, 4]
 *     responses:
 *       201:
 *         description: Permissions assigned to role
 *       400:
 *         description: Validation error
 */
router.post('/assign-multiple', rolePermissionController.assignPermissionsToRole);

/**
 * @swagger
 * /role-permissions:
 *   get:
 *     summary: Get all role-permission assignments
 *     tags: [Role Permissions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: role_id
 *         schema: { type: integer }
 *       - in: query
 *         name: permission_id
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Assignments retrieved successfully
 */
router.get('/', rolePermissionController.getAllRolePermissions);

/**
 * @swagger
 * /role-permissions/role/{role_id}:
 *   get:
 *     summary: Get all permissions for a specific role
 *     tags: [Role Permissions]
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Role permissions retrieved
 */
router.get('/role/:role_id', rolePermissionController.getRolePermissions);

/**
 * @swagger
 * /role-permissions/remove:
 *   delete:
 *     summary: Remove a specific permission from a role
 *     tags: [Role Permissions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role_id, permission_id]
 *             properties:
 *               role_id:
 *                 type: integer
 *                 example: 1
 *               permission_id:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       200:
 *         description: Permission removed from role
 *       404:
 *         description: Assignment not found
 */
router.delete('/remove', rolePermissionController.removePermissionFromRole);

/**
 * @swagger
 * /role-permissions/role/{role_id}:
 *   delete:
 *     summary: Remove all permissions from a role
 *     tags: [Role Permissions]
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: All permissions removed from role
 */
router.delete('/role/:role_id', rolePermissionController.removeAllPermissionsFromRole);

export default router;