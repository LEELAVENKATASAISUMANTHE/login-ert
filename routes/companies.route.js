import { Router } from 'express';
import * as companyController from '../controller/companies.controller.js';
import { upload } from '../utils/multer.js';

const router = Router();

/**
 * @route   POST /api/companies
 * @desc    Create a new company
 */
router.post('/', upload.single('company_logo'), companyController.createCompany);

/**
 * @route   GET /api/companies
 * @desc    Get all companies (paginated, searchable)
 * @query   page, limit, sortBy, sortOrder, search
 */
router.get('/', companyController.getAllCompanies);

/**
 * @route   GET /api/companies/:id
 * @desc    Get company by ID
 */
router.get('/:id', companyController.getCompanyById);

/**
 * @route   PUT /api/companies/:id
 * @desc    Update company by ID (full update)
 */
router.put('/:id', upload.single('company_logo'), companyController.updateCompany);

/**
 * @route   PATCH /api/companies/:id
 * @desc    Partially update company by ID
 */
router.patch('/:id', upload.single('company_logo'), companyController.updateCompany);

/**
 * @route   DELETE /api/companies/:id
 * @desc    Delete company by ID
 */
router.delete('/:id', companyController.deleteCompany);

export default router;
