import { Router } from 'express';
import * as studentroutes from '../controller/student.controller.js';
import logger from '../utils/logger.js';

const router = Router();

router.post('/', studentroutes.upload.single('student_photo'), studentroutes.createStudent);

export default router;