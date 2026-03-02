import { Router } from 'express';
import * as userController from '../controller/users.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

// Public
router.post('/register', userController.createUser);

// Protected — require authentication
router.get('/', authenticate, userController.getAllUsers);
router.get('/:id', authenticate, userController.getUserById);
router.put('/:id', authenticate, userController.updateUser);
router.delete('/:id', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), userController.deleteUser);

export default router;
