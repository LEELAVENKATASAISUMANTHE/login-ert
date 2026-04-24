import logger from "../utils/logger.js";
import * as studentOfferService from "../db/student_offers.db.js";
import joi from "joi";
import { handleError } from "../utils/errors.js";

// Validation schema for creating a student offer
const createStudentOfferSchema = joi.object({
    student_id: joi.string().required(),
    job_id: joi.number().integer().positive().optional().allow(null),
    offered_at: joi.date().optional().allow(null),
    is_primary_offer: joi.boolean().optional().default(false),
    is_pbc: joi.boolean().optional().default(false),
    is_internship: joi.boolean().optional().default(false),
    is_offcampus: joi.boolean().optional().default(false),
    offcampus_company_name: joi.string().trim().max(255).optional().allow(null, ''),
    offcampus_job_title: joi.string().trim().max(255).optional().allow(null, ''),
    offcampus_location: joi.string().trim().max(255).optional().allow(null, ''),
    offer_ctc: joi.number().precision(2).min(0).max(9999999.99).optional().allow(null),
    offer_stipend: joi.number().precision(2).min(0).max(9999999999.99).optional().allow(null),
    remarks: joi.string().trim().optional().allow(null, '')
}).custom((value, helpers) => {
    // Validate: off-campus offers need company name, on-campus offers need job_id
    if (value.is_offcampus) {
        if (!value.offcampus_company_name) {
            return helpers.error('any.custom', { message: 'offcampus_company_name is required for off-campus offers' });
        }
    } else {
        if (!value.job_id) {
            return helpers.error('any.custom', { message: 'job_id is required for on-campus offers' });
        }
    }
    return value;
});

// Validation schema for updating a student offer
const updateStudentOfferSchema = joi.object({
    is_primary_offer: joi.boolean().optional(),
    is_pbc: joi.boolean().optional(),
    is_internship: joi.boolean().optional(),
    offcampus_company_name: joi.string().trim().max(255).optional().allow(null, ''),
    offcampus_job_title: joi.string().trim().max(255).optional().allow(null, ''),
    offcampus_location: joi.string().trim().max(255).optional().allow(null, ''),
    offer_ctc: joi.number().precision(2).min(0).max(9999999.99).optional().allow(null),
    offer_stipend: joi.number().precision(2).min(0).max(9999999999.99).optional().allow(null),
    remarks: joi.string().trim().optional().allow(null, '')
});

// Validation schema for query params
const getStudentOffersSchema = joi.object({
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).max(100).default(10),
    sortBy: joi.string().valid('offer_id', 'student_id', 'job_id', 'offered_at', 'offer_ctc', 'offer_stipend').default('offer_id'),
    sortOrder: joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC'),
    is_primary_offer: joi.boolean().optional(),
    is_pbc: joi.boolean().optional(),
    is_internship: joi.boolean().optional(),
    is_offcampus: joi.boolean().optional()
});

// Validation schema for ID param
const idSchema = joi.object({
    id: joi.number().integer().positive().required()
});

// Validation schema for student ID param
const studentIdSchema = joi.object({
    studentId: joi.string().required()
});

// Validation schema for job ID param
const jobIdSchema = joi.object({
    jobId: joi.number().integer().positive().required()
});

// Create a new student offer
export const createStudentOffer = async (req, res) => {
    try {
        logger.info({ student_id: req.body.student_id }, 'createStudentOffer');
        const { error, value } = createStudentOfferSchema.validate(req.body);
        if (error) {
            logger.warn(`createStudentOffer: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const result = await studentOfferService.createStudentOffer(value);
        logger.info({ student_id: value.student_id }, 'createStudentOffer: success');
        res.status(201).json(result);
    } catch (err) {
        return handleError(err, res, 'createStudentOffer');
    }
};

// Get all student offers
export const getAllStudentOffers = async (req, res) => {
    try {
        logger.info({ query: req.query }, 'getAllStudentOffers');
        const { error, value } = getStudentOffersSchema.validate(req.query);
        if (error) {
            logger.warn(`getAllStudentOffers: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const result = await studentOfferService.getAllStudentOffers(value);
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'getAllStudentOffers');
    }
};

// Get student offer by ID
export const getStudentOfferById = async (req, res) => {
    try {
        logger.info({ id: req.params.id }, 'getStudentOfferById');
        const { error } = idSchema.validate(req.params);
        if (error) {
            logger.warn(`getStudentOfferById: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const { id } = req.params;
        const result = await studentOfferService.getStudentOfferById(id);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'getStudentOfferById');
    }
};

// Get offers by student ID
export const getOffersByStudentId = async (req, res) => {
    try {
        logger.info({ studentId: req.params.studentId }, 'getOffersByStudentId');
        const { error: paramError } = studentIdSchema.validate(req.params);
        if (paramError) {
            logger.warn(`getOffersByStudentId: Param validation failed - ${paramError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: paramError.details[0].message 
            });
        }

        const { error: queryError, value: queryValue } = getStudentOffersSchema.validate(req.query);
        if (queryError) {
            logger.warn(`getOffersByStudentId: Query validation failed - ${queryError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: queryError.details[0].message 
            });
        }

        const { studentId } = req.params;
        const result = await studentOfferService.getOffersByStudentId(studentId, queryValue);
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'getOffersByStudentId');
    }
};

// Get offers by job ID
export const getOffersByJobId = async (req, res) => {
    try {
        logger.info({ jobId: req.params.jobId }, 'getOffersByJobId');
        const { error: paramError } = jobIdSchema.validate(req.params);
        if (paramError) {
            logger.warn(`getOffersByJobId: Param validation failed - ${paramError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: paramError.details[0].message 
            });
        }

        const { error: queryError, value: queryValue } = getStudentOffersSchema.validate(req.query);
        if (queryError) {
            logger.warn(`getOffersByJobId: Query validation failed - ${queryError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: queryError.details[0].message 
            });
        }

        const { jobId } = req.params;
        const result = await studentOfferService.getOffersByJobId(jobId, queryValue);
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'getOffersByJobId');
    }
};

// Update student offer by ID
export const updateStudentOffer = async (req, res) => {
    try {
        logger.info({ id: req.params.id }, 'updateStudentOffer');
        const { error: idError } = idSchema.validate(req.params);
        if (idError) {
            logger.warn(`updateStudentOffer: ID validation failed - ${idError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: idError.details[0].message 
            });
        }

        const { error: bodyError, value } = updateStudentOfferSchema.validate(req.body);
        if (bodyError) {
            logger.warn(`updateStudentOffer: Body validation failed - ${bodyError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: bodyError.details[0].message 
            });
        }

        if (Object.keys(value).length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "No fields provided for update" 
            });
        }

        const { id } = req.params;
        const result = await studentOfferService.updateStudentOffer(id, value);
        logger.info({ id }, 'updateStudentOffer: success');
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'updateStudentOffer');
    }
};

// Delete student offer by ID
export const deleteStudentOffer = async (req, res) => {
    try {
        logger.info({ id: req.params.id }, 'deleteStudentOffer');
        const { error } = idSchema.validate(req.params);
        if (error) {
            logger.warn(`deleteStudentOffer: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const { id } = req.params;
        const result = await studentOfferService.deleteStudentOffer(id);
        logger.info({ id }, 'deleteStudentOffer: success');
        res.status(200).json(result);
    } catch (err) {
        return handleError(err, res, 'deleteStudentOffer');
    }
};
