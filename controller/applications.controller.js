import logger from "../utils/logger.js";
import * as applicationService from "../db/applications.db.js";
import joi from "joi";

// Validation schema for creating an application
const createApplicationSchema = joi.object({
    student_id: joi.string().required(),
    job_id: joi.number().integer().positive().required(),
    applied_at: joi.date().optional().allow(null),
    status: joi.string().trim().max(50).optional().default('Applied'),
    offer_type: joi.string().trim().max(50).optional().allow(null, ''),
    offer_ctc: joi.number().precision(2).min(0).max(9999999.99).optional().allow(null),
    offer_stipend: joi.number().precision(2).min(0).max(9999999999.99).optional().allow(null),
    placement_date: joi.date().optional().allow(null),
    remarks: joi.string().trim().optional().allow(null, '')
});

// Validation schema for updating an application
const updateApplicationSchema = joi.object({
    status: joi.string().trim().max(50).optional(),
    offer_type: joi.string().trim().max(50).optional().allow(null, ''),
    offer_ctc: joi.number().precision(2).min(0).max(9999999.99).optional().allow(null),
    offer_stipend: joi.number().precision(2).min(0).max(9999999999.99).optional().allow(null),
    placement_date: joi.date().optional().allow(null),
    remarks: joi.string().trim().optional().allow(null, '')
});

// Validation schema for updating status only
const updateStatusSchema = joi.object({
    status: joi.string().trim().max(50).required()
});

// Validation schema for query params
const getApplicationsSchema = joi.object({
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).max(100).default(10),
    sortBy: joi.string().valid('application_id', 'student_id', 'job_id', 'applied_at', 'status', 'offer_ctc', 'placement_date').default('application_id'),
    sortOrder: joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC'),
    search: joi.string().trim().max(100).optional().allow(''),
    status: joi.string().trim().max(50).optional(),
    offer_type: joi.string().trim().max(50).optional()
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

// Create a new application
export const createApplication = async (req, res) => {
    try {
        const { error, value } = createApplicationSchema.validate(req.body);
        if (error) {
            logger.warn(`createApplication: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const result = await applicationService.createApplication(value);
        res.status(201).json(result);
    } catch (err) {
        logger.error("Error creating application:", err);
        
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

// Get all applications
export const getAllApplications = async (req, res) => {
    try {
        const { error, value } = getApplicationsSchema.validate(req.query);
        if (error) {
            logger.warn(`getAllApplications: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const result = await applicationService.getAllApplications(value);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching applications:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Get application by ID
export const getApplicationById = async (req, res) => {
    try {
        const { error } = idSchema.validate(req.params);
        if (error) {
            logger.warn(`getApplicationById: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const { id } = req.params;
        const result = await applicationService.getApplicationById(id);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching application:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Get applications by student ID
export const getApplicationsByStudentId = async (req, res) => {
    try {
        const { error: paramError } = studentIdSchema.validate(req.params);
        if (paramError) {
            logger.warn(`getApplicationsByStudentId: Param validation failed - ${paramError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: paramError.details[0].message 
            });
        }

        const { error: queryError, value: queryValue } = getApplicationsSchema.validate(req.query);
        if (queryError) {
            logger.warn(`getApplicationsByStudentId: Query validation failed - ${queryError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: queryError.details[0].message 
            });
        }

        const { studentId } = req.params;
        const result = await applicationService.getApplicationsByStudentId(studentId, queryValue);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching applications by student:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Get applications by job ID
export const getApplicationsByJobId = async (req, res) => {
    try {
        const { error: paramError } = jobIdSchema.validate(req.params);
        if (paramError) {
            logger.warn(`getApplicationsByJobId: Param validation failed - ${paramError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: paramError.details[0].message 
            });
        }

        const { error: queryError, value: queryValue } = getApplicationsSchema.validate(req.query);
        if (queryError) {
            logger.warn(`getApplicationsByJobId: Query validation failed - ${queryError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: queryError.details[0].message 
            });
        }

        const { jobId } = req.params;
        const result = await applicationService.getApplicationsByJobId(jobId, queryValue);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching applications by job:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Update application by ID
export const updateApplication = async (req, res) => {
    try {
        const { error: idError } = idSchema.validate(req.params);
        if (idError) {
            logger.warn(`updateApplication: ID validation failed - ${idError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: idError.details[0].message 
            });
        }

        const { error: bodyError, value } = updateApplicationSchema.validate(req.body);
        if (bodyError) {
            logger.warn(`updateApplication: Body validation failed - ${bodyError.details[0].message}`);
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
        const result = await applicationService.updateApplication(id, value);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error updating application:", err);
        
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

// Update application status only
export const updateApplicationStatus = async (req, res) => {
    try {
        const { error: idError } = idSchema.validate(req.params);
        if (idError) {
            logger.warn(`updateApplicationStatus: ID validation failed - ${idError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: idError.details[0].message 
            });
        }

        const { error: bodyError, value } = updateStatusSchema.validate(req.body);
        if (bodyError) {
            logger.warn(`updateApplicationStatus: Body validation failed - ${bodyError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: bodyError.details[0].message 
            });
        }

        const { id } = req.params;
        const result = await applicationService.updateApplicationStatus(id, value.status);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error updating application status:", err);
        
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

// Delete application by ID
export const deleteApplication = async (req, res) => {
    try {
        const { error } = idSchema.validate(req.params);
        if (error) {
            logger.warn(`deleteApplication: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const { id } = req.params;
        const result = await applicationService.deleteApplication(id);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error deleting application:", err);
        
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
