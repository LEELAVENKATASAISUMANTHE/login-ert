import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getPresignedUrl } from "../controller/files.controller.js";

const router = Router();

/**
 * @swagger
 * /files/presigned:
 *   get:
 *     summary: Get a presigned URL for a private R2 file
 *     tags: [Files]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [student_photo, document, certification, company_logo]
 *         description: The category of the file
 *       - in: query
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: The object key stored in the database (e.g. uuid.jpg)
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 url:
 *                   type: string
 *                   format: uri
 *                   description: Presigned GET URL valid for 1 hour
 *                 expiresIn:
 *                   type: integer
 *                   example: 3600
 *       400:
 *         description: Missing or invalid query params
 *       401:
 *         description: Authentication required
 */
router.get("/presigned", authenticate, getPresignedUrl);

export default router;
