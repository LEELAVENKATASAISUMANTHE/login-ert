import logger from "../utils/logger.js";
import * as studentOfferService from "../db/student_offers.db.js";
import joi from "joi";

// Validation schema for creating a student offer
const createStudentOfferSchema = joi.object({
    student_id: joi.string().required(),
    job_id: joi.number().integer().positive().required(),
    offered_at: joi.date().optional().allow(null),
    is_primary_offer: joi.boolean().optional().default(false),
    is_pbc: joi.boolean().optional().default(false),
    is_internship: joi.boolean().optional().default(false),
    offer_ctc: joi.number().precision(2).min(0).max(9999999.99).optional().allow(null),
    offer_stipend: joi.number().precision(2).min(0).max(9999999999.99).optional().allow(null),
    remarks: joi.string().trim().optional().allow(null, '')
});

// Validation schema for updating a student offer
const updateStudentOfferSchema = joi.object({
    is_primary_offer: joi.boolean().optional(),
    is_pbc: joi.boolean().optional(),
    is_internship: joi.boolean().optional(),
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
    is_internship: joi.boolean().optional()
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
        const { error, value } = createStudentOfferSchema.validate(req.body);
        if (error) {
            logger.warn(`createStudentOffer: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const result = await studentOfferService.createStudentOffer(value);
        res.status(201).json(result);
    } catch (err) {
        logger.error("Error creating student offer:", err);
        
        if (err.message.includes('not found')) {
            return res.status(404).json({ 
                success: false, 
                message: err.message 
            });
        }
        if (err.message.includes('already exists')) {
            return res.status(409).json({ 
                success: false, 
                message: err.message 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Get all student offers
export const getAllStudentOffers = async (req, res) => {
    try {
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
        logger.error("Error fetching student offers:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Get student offer by ID
export const getStudentOfferById = async (req, res) => {
    try {
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
        logger.error("Error fetching student offer:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Get offers by student ID
export const getOffersByStudentId = async (req, res) => {
    try {
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
        logger.error("Error fetching offers by student:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Get offers by job ID
export const getOffersByJobId = async (req, res) => {
    try {
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
        logger.error("Error fetching offers by job:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Update student offer by ID
export const updateStudentOffer = async (req, res) => {
    try {
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
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error updating student offer:", err);
        
        if (err.message.includes('not found')) {
            return res.status(404).json({ 
                success: false, 
                message: err.message 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Delete student offer by ID
export const deleteStudentOffer = async (req, res) => {
    try {
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
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error deleting student offer:", err);
        
        if (err.message.includes('not found')) {
            return res.status(404).json({ 
                success: false, 
                message: err.message 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};
