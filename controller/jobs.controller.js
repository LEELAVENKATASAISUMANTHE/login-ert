import logger from "../utils/logger.js";
import * as jobService from "../db/jobs.db.js";
import joi from "joi";

// Validation schema for creating a job
const createJobSchema = joi.object({
    company_id: joi.number().integer().positive().required(),
    job_title: joi.string().trim().min(1).max(200).required(),
    job_description: joi.string().trim().optional().allow(null, ''),
    job_type: joi.string().trim().max(50).optional().allow(null, ''),
    ctc_lpa: joi.number().precision(2).min(0).max(9999999.99).optional().allow(null),
    stipend_per_month: joi.number().precision(2).min(0).max(9999999999.99).optional().allow(null),
    location: joi.string().trim().max(200).optional().allow(null, ''),
    interview_mode: joi.string().trim().max(50).optional().allow(null, ''),
    application_deadline: joi.date().optional().allow(null),
    drive_date: joi.date().optional().allow(null)
});

// Validation schema for updating a job
const updateJobSchema = joi.object({
    company_id: joi.number().integer().positive().optional(),
    job_title: joi.string().trim().min(1).max(200).optional(),
    job_description: joi.string().trim().optional().allow(null, ''),
    job_type: joi.string().trim().max(50).optional().allow(null, ''),
    ctc_lpa: joi.number().precision(2).min(0).max(9999999.99).optional().allow(null),
    stipend_per_month: joi.number().precision(2).min(0).max(9999999999.99).optional().allow(null),
    location: joi.string().trim().max(200).optional().allow(null, ''),
    interview_mode: joi.string().trim().max(50).optional().allow(null, ''),
    application_deadline: joi.date().optional().allow(null),
    drive_date: joi.date().optional().allow(null)
});

// Validation schema for query params (pagination & search)
const getJobsSchema = joi.object({
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).max(100).default(10),
    sortBy: joi.string().valid('job_id', 'job_title', 'job_type', 'ctc_lpa', 'location', 'application_deadline', 'drive_date', 'created_at').default('job_id'),
    sortOrder: joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC'),
    search: joi.string().trim().max(100).optional().allow('')
});

// Validation schema for ID param
const idSchema = joi.object({
    id: joi.number().integer().positive().required()
});

// Validation schema for company ID param
const companyIdSchema = joi.object({
    companyId: joi.number().integer().positive().required()
});

// Create a new job
export const createJob = async (req, res) => {
    try {
        const { error, value } = createJobSchema.validate(req.body);
        if (error) {
            logger.warn(`createJob: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const result = await jobService.createJob(value);
        res.status(201).json(result);
    } catch (err) {
        logger.error("Error creating job:", err);
        
        if (err.message.includes('Company not found')) {
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

// Get all jobs with pagination and search
export const getAllJobs = async (req, res) => {
    try {
        const { error, value } = getJobsSchema.validate(req.query);
        if (error) {
            logger.warn(`getAllJobs: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const result = await jobService.getAllJobs(value);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching jobs:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Get job by ID
export const getJobById = async (req, res) => {
    try {
        const { error } = idSchema.validate(req.params);
        if (error) {
            logger.warn(`getJobById: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const { id } = req.params;
        const result = await jobService.getJobById(id);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching job:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Get jobs by company ID
export const getJobsByCompanyId = async (req, res) => {
    try {
        const { error: paramError } = companyIdSchema.validate(req.params);
        if (paramError) {
            logger.warn(`getJobsByCompanyId: Param validation failed - ${paramError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: paramError.details[0].message 
            });
        }

        const { error: queryError, value: queryValue } = getJobsSchema.validate(req.query);
        if (queryError) {
            logger.warn(`getJobsByCompanyId: Query validation failed - ${queryError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: queryError.details[0].message 
            });
        }

        const { companyId } = req.params;
        const result = await jobService.getJobsByCompanyId(companyId, queryValue);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching jobs by company:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Update job by ID
export const updateJob = async (req, res) => {
    try {
        const { error: idError } = idSchema.validate(req.params);
        if (idError) {
            logger.warn(`updateJob: ID validation failed - ${idError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: idError.details[0].message 
            });
        }

        const { error: bodyError, value } = updateJobSchema.validate(req.body);
        if (bodyError) {
            logger.warn(`updateJob: Body validation failed - ${bodyError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: bodyError.details[0].message 
            });
        }

        // Check if at least one field is being updated
        if (Object.keys(value).length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "No fields provided for update" 
            });
        }

        const { id } = req.params;
        const result = await jobService.updateJob(id, value);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error updating job:", err);
        
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

// Delete job by ID
export const deleteJob = async (req, res) => {
    try {
        const { error } = idSchema.validate(req.params);
        if (error) {
            logger.warn(`deleteJob: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const { id } = req.params;
        const result = await jobService.deleteJob(id);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error deleting job:", err);
        
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
