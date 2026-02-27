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
 * @swagger
 * /roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role_name]
 *             properties:
 *               role_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: admin
 *               role_description:
 *                 type: string
 *                 maxLength: 255
 *                 example: Administrator with full access
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Role name already exists
 */
router.post('/', createRole);

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get all roles (paginated)
 *     tags: [Roles]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [ASC, DESC] }
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 */
router.get('/', getAllRoles);

/**
 * @swagger
 * /roles/check/{role_name}:
 *   get:
 *     summary: Check if a role exists by name
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: role_name
 *         required: true
 *         schema: { type: string }
 *         example: admin
 *     responses:
 *       200:
 *         description: Role existence check result
 */
router.get('/check/:role_name', checkRoleExists);

/**
 * @swagger
 * /roles/search/{searchTerm}:
 *   get:
 *     summary: Search roles by name (not implemented)
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: searchTerm
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search/:searchTerm', async (req, res) => {
  try {
    const { searchTerm } = req.params;
    logger.info('Role search request received', { searchTerm, ip: req.ip });
    res.status(200).json({
      success: true,
      message: 'Search endpoint - not implemented yet',
      searchTerm: searchTerm
    });
  } catch (error) {
    logger.error('Error in role search', { error: error.message, searchTerm: req.params.searchTerm });
    res.status(500).json({ success: false, message: 'Search failed', error: 'Something went wrong' });
  }
});

/**
 * @swagger
 * /roles/count/total:
 *   get:
 *     summary: Get total count of roles (not implemented)
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Total role count
 */
router.get('/count/total', async (req, res) => {
  try {
    logger.info('Role count request received', { ip: req.ip });
    res.status(200).json({ success: true, message: 'Count endpoint - not implemented yet', data: { count: 0 } });
  } catch (error) {
    logger.error('Error getting role count', { error: error.message });
    res.status(500).json({ success: false, message: 'Count failed', error: 'Something went wrong' });
  }
});

/**
 * @swagger
 * /roles/{role_id}:
 *   get:
 *     summary: Get a single role by ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Role retrieved
 *       404:
 *         description: Role not found
 */
router.get('/:role_id', (req, res, next) => {
  req.params.id = req.params.role_id;
  getRoleById(req, res, next);
});

/**
 * @swagger
 * /roles/{role_id}:
 *   put:
 *     summary: Update a role by ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_name:
 *                 type: string
 *                 example: moderator
 *               role_description:
 *                 type: string
 *                 example: Moderator with limited access
 *     responses:
 *       200:
 *         description: Role updated
 *       404:
 *         description: Role not found
 */
router.put('/:role_id', (req, res, next) => {
  req.params.id = req.params.role_id;
  updateRole(req, res, next);
});

/**
 * @swagger
 * /roles/{role_id}:
 *   delete:
 *     summary: Delete a role by ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Role deleted
 *       404:
 *         description: Role not found
 */
router.delete('/:role_id', (req, res, next) => {
  req.params.id = req.params.role_id;
  deleteRole(req, res, next);
});

// ===== ERROR HANDLING =====
router.use('*', (req, res) => {
  logger.warn('Role route not found', { method: req.method, url: req.originalUrl, ip: req.ip });
  res.status(404).json({
    success: false,
    message: 'Role endpoint not found',
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
});

router.use((error, req, res, next) => {
  logger.error('Role route error', { error: error.message, stack: error.stack, method: req.method, url: req.originalUrl, ip: req.ip });
  res.status(500).json({ success: false, message: 'Internal server error in role routes', error: 'Something went wrong' });
});

export default router;