import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import * as branchesController from '../controller/branches.controller.js';

const router = Router();

/**
 * @swagger
 * /branches:
 *   get:
 *     summary: List all branches with their full names
 *     tags: [Branches]
 *     responses:
 *       200:
 *         description: Branch list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code: { type: string, example: CSE }
 *                       name: { type: string, example: Computer Science and Engineering }
 */
router.get('/', branchesController.listBranches);

/**
 * @swagger
 * /branches:
 *   post:
 *     summary: Add a new branch (Admin only)
 *     tags: [Branches]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code:
 *                 type: string
 *                 example: AIML
 *                 description: Short unique identifier (e.g. AIML, DS)
 *               name:
 *                 type: string
 *                 example: Artificial Intelligence and Machine Learning
 *     responses:
 *       201:
 *         description: Branch added, returns full updated list
 *       400:
 *         description: Validation error
 *       409:
 *         description: Branch code already exists
 */
router.post('/', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), branchesController.createBranch);

/**
 * @swagger
 * /branches/{code}:
 *   delete:
 *     summary: Remove a branch by code (Admin only)
 *     tags: [Branches]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *         example: MECH
 *     responses:
 *       200:
 *         description: Branch removed, returns full updated list
 *       404:
 *         description: Branch code not found
 */
router.delete('/:code', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), branchesController.deleteBranch);

export default router;
