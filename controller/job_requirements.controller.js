import logger from "../utils/logger.js";
import * as jobRequirementService from "../db/job_requirements.db.js";
import joi from "joi";
const Branches = ["CSE","AI","ECE","MECH","EEE","CIVIL","CSBS","ETE","MCA","ALL"];

console.log('Loaded job_requirements.controller.js (patched)');

const normalizeRequestBody = (body = {}) => {
    if (!body || typeof body !== 'object') return body;
    const map = {
        jobId: 'job_id',
        tenthPercent: 'tenth_percent',
        twelfthPercent: 'twelfth_percent',
        ugCgpa: 'ug_cgpa',
        minExperienceYrs: 'min_experience_yrs',
        allowedBranches: 'allowed_branches',
        skillsRequired: 'skills_required',
        additionalNotes: 'additional_notes',
        backlogsAllowed: 'backlogs_allowed'
    };

    const out = {};
    for (const key of Object.keys(body)) {
        const mapped = map[key] || key;
        out[mapped] = body[key];
    }
    return out;
}
// Validation schema for creating a job requirement
const createJobRequirementSchema = joi.object({
    job_id: joi.number().integer().positive().required(),
    tenth_percent: joi.number().precision(2).min(0).max(100).optional().allow(null),
    twelfth_percent: joi.number().precision(2).min(0).max(100).optional().allow(null),
    ug_cgpa: joi.number().precision(2).min(0).max(10).optional().allow(null),
    min_experience_yrs: joi.number().precision(2).min(0).max(50).optional().allow(null),
    allowed_branches: joi.array().items(joi.string().trim().uppercase().valid(...Branches)).optional().allow(null),
    skills_required: joi.string().trim().optional().allow(null, ''),
    additional_notes: joi.string().trim().optional().allow(null, ''),
    backlogs_allowed: joi.number().integer().min(0).optional().allow(null)
});

// Validation schema for updating a job requirement
const updateJobRequirementSchema = joi.object({
    job_id: joi.number().integer().positive().optional(),
    tenth_percent: joi.number().precision(2).min(0).max(100).optional().allow(null),
    twelfth_percent: joi.number().precision(2).min(0).max(100).optional().allow(null),
    ug_cgpa: joi.number().precision(2).min(0).max(10).optional().allow(null),
    min_experience_yrs: joi.number().precision(2).min(0).max(50).optional().allow(null),
    allowed_branches: joi.array().items(joi.string().trim().uppercase().valid(...Branches)).optional().allow(null),
    skills_required: joi.string().trim().optional().allow(null, ''),
    additional_notes: joi.string().trim().optional().allow(null, ''),
    backlogs_allowed: joi.number().integer().min(0).optional().allow(null)
});

// Validation schema for query params (pagination & search)
const getJobRequirementsSchema = joi.object({
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).max(100).default(10),
    sortBy: joi.string().valid('job_requirement_id', 'job_id', 'tenth_percent', 'twelfth_percent', 'ug_cgpa', 'min_experience_yrs', 'backlogs_allowed').default('job_requirement_id'),
    sortOrder: joi.string().uppercase().valid('ASC', 'DESC').default('DESC'),
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
        const normalizedBody = normalizeRequestBody(req.body);
        // plain console logs to ensure visibility even if logger filters fields
        console.log('createJobRequirement - rawBody', JSON.stringify(req.body));
        console.log('createJobRequirement - normalizedBody', JSON.stringify(normalizedBody));
        logger.info('createJobRequirement - rawBody', { rawBody: req.body });
        logger.info('createJobRequirement - normalizedBody', { normalizedBody });
        const { error, value } = createJobRequirementSchema.validate(normalizedBody);
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

// Update job requirement by Job ID
export const updateJobRequirementByJobId = async (req, res) => {
    try {
        const { error } = jobIdSchema.validate(req.params);
        if (error) {
            logger.warn(`updateJobRequirementByJobId: Param validation failed - ${error.details[0].message}`);
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const normalizedBody = normalizeRequestBody(req.body);
        console.log('updateJobRequirementByJobId - rawBody', JSON.stringify(req.body));
        console.log('updateJobRequirementByJobId - normalizedBody', JSON.stringify(normalizedBody));
        logger.info('updateJobRequirementByJobId - rawBody', { rawBody: req.body });
        logger.info('updateJobRequirementByJobId - normalizedBody', { normalizedBody });

        const { error: bodyError, value } = updateJobRequirementSchema.validate(normalizedBody);
        if (bodyError) {
            logger.warn(`updateJobRequirementByJobId: Body validation failed - ${bodyError.details[0].message}`);
            return res.status(400).json({ success: false, message: bodyError.details[0].message });
        }

        if (Object.keys(value).length === 0) {
            return res.status(400).json({ success: false, message: 'No fields provided for update' });
        }

        const { jobId } = req.params;
        const result = await jobRequirementService.updateJobRequirementByJobId(jobId, value);
        res.status(200).json(result);
    } catch (err) {
        logger.error('Error updating job requirement by job ID:', err);
        if (err.message.includes('not found')) {
            return res.status(404).json({ success: false, message: err.message });
        }
        if (err.message.includes('already exists')) {
            return res.status(409).json({ success: false, message: err.message });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
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

        const normalizedBody = normalizeRequestBody(req.body);
        console.log('updateJobRequirement - rawBody', JSON.stringify(req.body));
        console.log('updateJobRequirement - normalizedBody', JSON.stringify(normalizedBody));
        logger.info('updateJobRequirement - rawBody', { rawBody: req.body });
        logger.info('updateJobRequirement - normalizedBody', { normalizedBody });
        const { error: bodyError, value } = updateJobRequirementSchema.validate(normalizedBody);
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
