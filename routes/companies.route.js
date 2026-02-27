import { Router } from 'express';
import * as companyController from '../controller/companies.controller.js';
import { upload } from '../utils/multer.js';

const router = Router();

/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Create a new company
 *     tags: [Companies]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [company_name]
 *             properties:
 *               company_name:
 *                 type: string
 *                 example: Google India
 *               website:
 *                 type: string
 *                 format: uri
 *                 example: https://google.com
 *               contact_email:
 *                 type: string
 *                 format: email
 *                 example: hr@google.com
 *               contact_phone:
 *                 type: string
 *                 example: "9876543210"
 *               address:
 *                 type: string
 *               description:
 *                 type: string
 *               company_logo:
 *                 type: string
 *                 format: binary
 *                 description: Company logo image
 *     responses:
 *       201:
 *         description: Company created
 *       400:
 *         description: Validation error
 */
router.post('/', upload.single('company_logo'), companyController.createCompany);

/**
 * @swagger
 * /companies:
 *   get:
 *     summary: Get all companies (paginated, searchable)
 *     tags: [Companies]
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
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Companies retrieved
 */
router.get('/', companyController.getAllCompanies);

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     summary: Get company by ID
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Company retrieved
 *       404:
 *         description: Not found
 */
router.get('/:id', companyController.getCompanyById);

/**
 * @swagger
 * /companies/{id}:
 *   put:
 *     summary: Update company by ID (full update)
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               company_name:
 *                 type: string
 *               website:
 *                 type: string
 *               contact_email:
 *                 type: string
 *               description:
 *                 type: string
 *               company_logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Company updated
 *       404:
 *         description: Not found
 */
router.put('/:id', upload.single('company_logo'), companyController.updateCompany);

/**
 * @swagger
 * /companies/{id}:
 *   patch:
 *     summary: Partially update company by ID
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               company_name:
 *                 type: string
 *               website:
 *                 type: string
 *               company_logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Company patched
 *       404:
 *         description: Not found
 */
router.patch('/:id', upload.single('company_logo'), companyController.updateCompany);

/**
 * @swagger
 * /companies/{id}:
 *   delete:
 *     summary: Delete company by ID
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Company deleted
 *       404:
 *         description: Not found
 */
router.delete('/:id', companyController.deleteCompany);

export default router;
