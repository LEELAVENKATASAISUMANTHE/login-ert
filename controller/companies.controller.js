import logger from "../utils/logger.js";
import * as companyService from "../db/companies.db.js";
import joi from "joi";
import { uploadToStorage } from "../utils/r2.js";
import { handleError } from "../utils/errors.js";

// Validation schema for creating a company
const createCompanySchema = joi.object({
    company_name: joi.string().trim().min(1).max(200).required(),
    company_type: joi.string().trim().max(50).optional().allow(null, ''),
    website: joi.string().uri().max(255).optional().allow(null, ''),
    contact_person: joi.string().trim().max(150).optional().allow(null, ''),
    contact_email: joi.string().email().max(150).optional().allow(null, ''),
    contact_phone: joi.string().trim().max(30).optional().allow(null, ''),
    company_logo: joi.string().trim().max(500).optional().allow(null, '')
});

// Validation schema for updating a company
const updateCompanySchema = joi.object({
    company_name: joi.string().trim().min(1).max(200).optional(),
    company_type: joi.string().trim().max(50).optional().allow(null, ''),
    website: joi.string().uri().max(255).optional().allow(null, ''),
    contact_person: joi.string().trim().max(150).optional().allow(null, ''),
    contact_email: joi.string().email().max(150).optional().allow(null, ''),
    contact_phone: joi.string().trim().max(30).optional().allow(null, ''),
    company_logo: joi.string().trim().max(500).optional().allow(null, '')
});

// Validation schema for query params (pagination & search)
const getCompaniesSchema = joi.object({
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).max(100).default(10),
    sortBy: joi.string().valid('company_id', 'company_name', 'company_type', 'contact_person', 'created_at').default('company_id'),
    sortOrder: joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('ASC'),
    search: joi.string().trim().max(100).optional().allow('')
});

// Validation schema for ID param
const idSchema = joi.object({
    id: joi.number().integer().positive().required()
});

// Create a new company
export const createCompany = async (req, res) => {
    try {
        const { error, value } = createCompanySchema.validate(req.body);
        if (error) {
            logger.warn(`createCompany: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        if (req.file && req.file.buffer && req.file.buffer.length > 0) {
            logger.info('createCompany: uploading logo to R2', {
                filename: req.file.originalname,
                mimetype: req.file.mimetype,
                sizeBytes: req.file.size,
            });
            const r2Result = await uploadToStorage(req.file.buffer, "R2_BUCKET_COMPANIES", req.file.mimetype);
            value.company_logo = r2Result.url;
            logger.info('createCompany: logo uploaded', { url: r2Result.url });
        }

        const result = await companyService.createCompany(value);
        res.status(201).json(result);
    } catch (err) {
        return handleError(err, res, 'createCompany');
    }
};

// Get all companies with pagination and search
export const getAllCompanies = async (req, res) => {
    try {
        const { error, value } = getCompaniesSchema.validate(req.query);
        if (error) {
            logger.warn(`getAllCompanies: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const result = await companyService.getAllCompanies(value);
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'getAllCompanies');
    }
};

// Get company by ID
export const getCompanyById = async (req, res) => {
    try {
        const { error } = idSchema.validate(req.params);
        if (error) {
            logger.warn(`getCompanyById: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const { id } = req.params;
        const result = await companyService.getCompanyById(id);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'getCompanyById');
    }
};

// Update company by ID
export const updateCompany = async (req, res) => {
    try {
        const { error: idError } = idSchema.validate(req.params);
        if (idError) {
            logger.warn(`updateCompany: ID validation failed - ${idError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: idError.details[0].message 
            });
        }

        const { error: bodyError, value } = updateCompanySchema.validate(req.body);
        if (bodyError) {
            logger.warn(`updateCompany: Body validation failed - ${bodyError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: bodyError.details[0].message 
            });
        }

        // Check if at least one field is being updated
        if (Object.keys(value).length === 0 && !req.file) {
            return res.status(400).json({ 
                success: false, 
                message: "No fields provided for update" 
            });
        }

        if (req.file && req.file.buffer && req.file.buffer.length > 0) {
            logger.info('updateCompany: replacing logo in R2', {
                filename: req.file.originalname,
                mimetype: req.file.mimetype,
                sizeBytes: req.file.size,
            });
            const r2Result = await uploadToStorage(req.file.buffer, "R2_BUCKET_COMPANIES", req.file.mimetype);
            value.company_logo = r2Result.url;
            logger.info('updateCompany: logo replaced', { url: r2Result.url });
        }

        const { id } = req.params;
        const result = await companyService.updateCompany(id, value);
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'updateCompany');
    }
};

// Delete company by ID
export const deleteCompany = async (req, res) => {
    try {
        const { error } = idSchema.validate(req.params);
        if (error) {
            logger.warn(`deleteCompany: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const { id } = req.params;
        const result = await companyService.deleteCompany(id);
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'deleteCompany');
    }
};
