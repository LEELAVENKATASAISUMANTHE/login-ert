import { Router } from "express";
import * as combineController from "../controller/combine.controller.js";

const router = Router();

/**
 * @route   POST /api/jobs-with-requirements
 * @desc    Create job and job requirements in one request
 */
router.post("/", combineController.createCombinedJob);

/**
 * @route   PUT /api/jobs-with-requirements/:jobId
 * @desc    Full update of job and job requirements in one request
 */
router.put("/:jobId", combineController.updateCombinedJob);

export default router;