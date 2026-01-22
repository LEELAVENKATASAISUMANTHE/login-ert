import logger from "../utils/logger.js";
import * as jobRequirementService from "../db/job_requirements.db.js";
import joi from "joi";

// Validation schema for creating a job requirement
const createJobRequirementSchema = joi.object({
    job_id: joi.number().integer().positive().required(),
    tenth_percent: joi.number().precision(2).min(0).max(100).optional().allow(null),
    twelfth_percent: joi.number().precision(2).min(0).max(100).optional().allow(null),
    ug_cgpa: joi.number().precision(2).min(0).max(10).optional().allow(null),
    pg_cgpa: joi.number().precision(2).min(0).max(10).optional().allow(null),
    min_experience_yrs: joi.number().precision(2).min(0).max(50).optional().allow(null),
    allowed_branches: joi.array().items(joi.string().trim().max(100)).optional().allow(null),
    skills_required: joi.string().trim().optional().allow(null, ''),
    additional_notes: joi.string().trim().optional().allow(null, '')
});

// Validation schema for updating a job requirement
const updateJobRequirementSchema = joi.object({
    job_id: joi.number().integer().positive().optional(),
    tenth_percent: joi.number().precision(2).min(0).max(100).optional().allow(null),
    twelfth_percent: joi.number().precision(2).min(0).max(100).optional().allow(null),
    ug_cgpa: joi.number().precision(2).min(0).max(10).optional().allow(null),
    pg_cgpa: joi.number().precision(2).min(0).max(10).optional().allow(null),
    min_experience_yrs: joi.number().precision(2).min(0).max(50).optional().allow(null),
    allowed_branches: joi.array().items(joi.string().trim().max(100)).optional().allow(null),
    skills_required: joi.string().trim().optional().allow(null, ''),
    additional_notes: joi.string().trim().optional().allow(null, '')
});

// Validation schema for query params (pagination & search)
const getJobRequirementsSchema = joi.object({
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).max(100).default(10),
    sortBy: joi.string().valid('job_requirement_id', 'job_id', 'tenth_percent', 'twelfth_percent', 'ug_cgpa', 'pg_cgpa', 'min_experience_yrs').default('job_requirement_id'),
    sortOrder: joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC'),
    search: joi.string().trim().max(100).optional().allow('')
});

// Validation schema for ID param
const idSchema = joi.object({
    id: joi.number().integer().positive().required()
});

// Validation schema for Job ID param
const jobIdSchema = joi.object({
    jobId: joi.number().integer().positive().required()
});

// Create a new job requirement
export const createJobRequirement = async (req, res) => {
    try {
        const { error, value } = createJobRequirementSchema.validate(req.body);
        if (error) {
            logger.warn(`createJobRequirement: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const result = await jobRequirementService.createJobRequirement(value);
        res.status(201).json(result);
    } catch (err) {
        logger.error("Error creating job requirement:", err);
        
        if (err.message.includes('Job not found')) {
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

// Get all job requirements with pagination and search
export const getAllJobRequirements = async (req, res) => {
    try {
        const { error, value } = getJobRequirementsSchema.validate(req.query);
        if (error) {
            logger.warn(`getAllJobRequirements: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const result = await jobRequirementService.getAllJobRequirements(value);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching job requirements:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Get job requirement by ID
export const getJobRequirementById = async (req, res) => {
    try {
        const { error } = idSchema.validate(req.params);
        if (error) {
            logger.warn(`getJobRequirementById: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const { id } = req.params;
        const result = await jobRequirementService.getJobRequirementById(id);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching job requirement:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Get job requirement by Job ID
export const getJobRequirementByJobId = async (req, res) => {
    try {
        const { error } = jobIdSchema.validate(req.params);
        if (error) {
            logger.warn(`getJobRequirementByJobId: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const { jobId } = req.params;
        const result = await jobRequirementService.getJobRequirementByJobId(jobId);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching job requirement by job ID:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Update job requirement by ID
export const updateJobRequirement = async (req, res) => {
    try {
        const { error: idError } = idSchema.validate(req.params);
        if (idError) {
            logger.warn(`updateJobRequirement: ID validation failed - ${idError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: idError.details[0].message 
            });
        }

        const { error: bodyError, value } = updateJobRequirementSchema.validate(req.body);
        if (bodyError) {
            logger.warn(`updateJobRequirement: Body validation failed - ${bodyError.details[0].message}`);
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
        const result = await jobRequirementService.updateJobRequirement(id, value);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error updating job requirement:", err);
        
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

// Delete job requirement by ID
export const deleteJobRequirement = async (req, res) => {
    try {
        const { error } = idSchema.validate(req.params);
        if (error) {
            logger.warn(`deleteJobRequirement: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const { id } = req.params;
        const result = await jobRequirementService.deleteJobRequirement(id);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error deleting job requirement:", err);
        
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

// Delete job requirement by Job ID
export const deleteJobRequirementByJobId = async (req, res) => {
    try {
        const { error } = jobIdSchema.validate(req.params);
        if (error) {
            logger.warn(`deleteJobRequirementByJobId: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const { jobId } = req.params;
        const result = await jobRequirementService.deleteJobRequirementByJobId(jobId);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error deleting job requirement by job ID:", err);
        
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
