import { Router } from 'express';
import * as permissionController from '../controller/permission.controller.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @swagger
 * /permissions:
 *   post:
 *     summary: Create a new permission
 *     tags: [Permissions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permission_name]
 *             properties:
 *               permission_name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 example: users.read
 *               module:
 *                 type: string
 *                 maxLength: 50
 *                 example: users
 *               description:
 *                 type: string
 *                 maxLength: 255
 *                 example: Permission to view user information
 *     responses:
 *       201:
 *         description: Permission created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Permission name already exists
 */
router.post('/', permissionController.createPermission);

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: Get all permissions (paginated)
 *     tags: [Permissions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [permission_id, permission_name, module, description] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [ASC, DESC] }
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 */
router.get('/', permissionController.getAllPermissions);

/**
 * @swagger
 * /permissions/check/{permission_name}:
 *   get:
 *     summary: Check if a permission exists by name
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: permission_name
 *         required: true
 *         schema: { type: string }
 *         example: users.read
 *     responses:
 *       200:
 *         description: Existence check result
 */
router.get('/check/:permission_name', permissionController.checkPermissionExists);

/**
 * @swagger
 * /permissions/{id}:
 *   get:
 *     summary: Get permission by ID
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Permission retrieved
 *       404:
 *         description: Permission not found
 */
router.get('/:id', permissionController.getPermissionById);

/**
 * @swagger
 * /permissions/{id}:
 *   put:
 *     summary: Update permission by ID
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permission_name:
 *                 type: string
 *                 example: users.write
 *               module:
 *                 type: string
 *                 example: users
 *               description:
 *                 type: string
 *                 example: Permission to create and modify users
 *     responses:
 *       200:
 *         description: Permission updated
 *       404:
 *         description: Permission not found
 *       409:
 *         description: Permission name already exists
 */
router.put('/:id', permissionController.updatePermission);

/**
 * @swagger
 * /permissions/{id}:
 *   delete:
 *     summary: Delete permission by ID
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Permission deleted
 *       404:
 *         description: Permission not found
 */
router.delete('/:id', permissionController.deletePermission);

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