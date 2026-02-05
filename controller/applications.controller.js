import logger from "../utils/logger.js";
import * as applicationService from "../db/applications.db.js";
import joi from "joi";

// Validation schema for creating an application
const createApplicationSchema = joi.object({
    student_id: joi.string().trim().required(),
    job_id: joi.number().integer().positive().required(),
    skills_match_score: joi.number().precision(2).min(0).max(1).optional().allow(null),
    offer_type: joi.string().trim().max(50).optional().allow(null, ''),
    offer_ctc: joi.number().precision(2).min(0).optional().allow(null),
    offer_stipend: joi.number().precision(2).min(0).optional().allow(null),
    placement_date: joi.date().optional().allow(null),
    remarks: joi.string().trim().optional().allow(null, '')
});

// Validation schema for updating application status
const updateApplicationSchema = joi.object({
    status: joi.string().trim().max(50).optional(),
    eligibility_status: joi.string().valid(
        'pending', 'eligible', 'not_eligible', 'conditionally_eligible'
    ).optional(),
    eligibility_comments: joi.string().trim().max(1000).optional().allow(null, ''),
    skills_match_score: joi.number().precision(2).min(0).max(1).optional().allow(null),
    offer_type: joi.string().trim().max(50).optional().allow(null, ''),
    offer_ctc: joi.number().precision(2).min(0).optional().allow(null),
    offer_stipend: joi.number().precision(2).min(0).optional().allow(null),
    placement_date: joi.date().optional().allow(null),
    remarks: joi.string().trim().optional().allow(null, '')
});

// Validation schema for query params
const getApplicationsSchema = joi.object({
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).max(100).default(10),
    sortBy: joi.string().valid(
        'application_id', 'applied_at', 'updated_at', 'student_id', 
        'job_id', 'status', 'eligibility_status', 'full_name', 'job_title'
    ).default('applied_at'),
    sortOrder: joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC'),
    search: joi.string().trim().max(100).optional().allow(''),
    student_id: joi.string().trim().optional(),
    job_id: joi.number().integer().positive().optional(),
    status: joi.string().trim().max(50).optional(),
    eligibility_status: joi.string().valid(
        'pending', 'eligible', 'not_eligible', 'conditionally_eligible'
    ).optional()
});

// Validation schema for ID param
const idSchema = joi.object({
    id: joi.number().integer().positive().required()
});

// Validation schema for student ID param
const studentIdSchema = joi.object({
    studentId: joi.string().trim().required()
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
        
        // Return appropriate status code based on eligibility
        const statusCode = result.data.eligibility_status === 'eligible' ? 201 : 202;
        
        res.status(statusCode).json(result);
    } catch (err) {
        logger.error("Error creating application:", err);
        
        if (err.message.includes('already exists')) {
            return res.status(409).json({ 
                success: false, 
                message: 'You have already applied for this job' 
            });
        }
        
        if (err.message.includes('Student') || err.message.includes('job not found')) {
            return res.status(404).json({ 
                success: false, 
                message: err.message 
            });
        }
        
        if (err.message.includes('deadline has passed')) {
            return res.status(400).json({ 
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

// Get all applications with filtering and pagination
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

        const { error: queryError, value: queryParams } = joi.object({
            page: joi.number().integer().min(1).default(1),
            limit: joi.number().integer().min(1).max(100).default(10),
            sortBy: joi.string().valid(
                'application_id', 'applied_at', 'updated_at', 'job_id', 
                'status', 'eligibility_status', 'job_title'
            ).default('applied_at'),
            sortOrder: joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC')
        }).validate(req.query);

        if (queryError) {
            logger.warn(`getApplicationsByStudentId: Query validation failed - ${queryError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: queryError.details[0].message 
            });
        }

        const { studentId } = req.params;
        const result = await applicationService.getApplicationsByStudentId(studentId, queryParams);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student applications:", err);
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

        const { error: queryError, value: queryParams } = joi.object({
            page: joi.number().integer().min(1).default(1),
            limit: joi.number().integer().min(1).max(100).default(10),
            sortBy: joi.string().valid(
                'application_id', 'applied_at', 'updated_at', 'student_id', 
                'status', 'eligibility_status', 'full_name'
            ).default('applied_at'),
            sortOrder: joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC'),
            status: joi.string().trim().max(50).optional(),
            eligibility_status: joi.string().valid(
                'pending', 'eligible', 'not_eligible', 'conditionally_eligible'
            ).optional()
        }).validate(req.query);

        if (queryError) {
            logger.warn(`getApplicationsByJobId: Query validation failed - ${queryError.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: queryError.details[0].message 
            });
        }

        const { jobId } = req.params;
        const result = await applicationService.getApplicationsByJobId(jobId, queryParams);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching job applications:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Update application status
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

        // Check if at least one field is being updated
        if (Object.keys(value).length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "No fields provided for update" 
            });
        }

        const { id } = req.params;
        const result = await applicationService.updateApplicationStatus(id, value);
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error updating application:", err);
        
        if (err.message.includes('not found')) {
            return res.status(404).json({ 
                success: false, 
                message: err.message 
            });
        }
        
        if (err.message.includes('No valid fields')) {
            return res.status(400).json({ 
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

// Delete application
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

// Check eligibility for a student and job
export const checkEligibility = async (req, res) => {
    try {
        const schema = joi.object({
            student_id: joi.string().trim().required(),
            job_id: joi.number().integer().positive().required()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            logger.warn(`checkEligibility: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        const result = await applicationService.checkEligibility(value.student_id, value.job_id);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error checking eligibility:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Bulk eligibility check
export const bulkEligibilityCheck = async (req, res) => {
    try {
        logger.info("bulkEligibilityCheck: Starting bulk eligibility check");
        
        const result = await applicationService.bulkEligibilityCheck();
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error in bulk eligibility check:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Get application statistics
export const getApplicationStats = async (req, res) => {
    try {
        const statsQuery = joi.object({
            student_id: joi.string().trim().optional(),
            job_id: joi.number().integer().positive().optional(),
            date_from: joi.date().iso().optional(),
            date_to: joi.date().iso().optional()
        });

        const { error, value } = statsQuery.validate(req.query);
        if (error) {
            logger.warn(`getApplicationStats: Validation failed - ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }

        // Build the stats query based on filters
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (value.student_id) {
            conditions.push(`student_id = $${paramIndex}`);
            params.push(value.student_id);
            paramIndex++;
        }

        if (value.job_id) {
            conditions.push(`job_id = $${paramIndex}`);
            params.push(value.job_id);
            paramIndex++;
        }

        if (value.date_from) {
            conditions.push(`applied_at >= $${paramIndex}`);
            params.push(value.date_from);
            paramIndex++;
        }

        if (value.date_to) {
            conditions.push(`applied_at <= $${paramIndex}`);
            params.push(value.date_to);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Import pool for direct query
        const pool = (await import('../db/connection.js')).default;
        const statsResult = await pool.query(`
            SELECT 
                COUNT(*) as total_applications,
                COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted,
                COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review,
                COUNT(CASE WHEN status = 'shortlisted' THEN 1 END) as shortlisted,
                COUNT(CASE WHEN status = 'selected' THEN 1 END) as selected,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
                COUNT(CASE WHEN status = 'withdrawn' THEN 1 END) as withdrawn,
                COUNT(CASE WHEN eligibility_status = 'eligible' THEN 1 END) as eligible,
                COUNT(CASE WHEN eligibility_status = 'not_eligible' THEN 1 END) as not_eligible,
                COUNT(CASE WHEN eligibility_status = 'conditionally_eligible' THEN 1 END) as conditionally_eligible,
                COUNT(CASE WHEN eligibility_status = 'pending' THEN 1 END) as eligibility_pending
            FROM applications 
            ${whereClause}
        `, params);

        res.status(200).json({
            success: true,
            data: statsResult.rows[0],
            message: 'Application statistics fetched successfully'
        });
    } catch (err) {
        logger.error("Error fetching application stats:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};
