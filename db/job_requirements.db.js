import logger from '../utils/logger.js';
import pool from './connection.js';
import { AppError } from '../utils/errors.js';


// Get all job requirements with pagination
export const getAllJobRequirements = async (params = {}) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            sortBy = 'job_requirement_id', 
            sortOrder = 'DESC',
            search = ''
        } = params;

        const offset = (page - 1) * limit;
        
        // Validate sortBy to prevent SQL injection
        const allowedSortFields = ['job_requirement_id', 'job_id', 'tenth_percent', 'twelfth_percent', 'ug_cgpa', 'min_experience_yrs', 'backlogs_allowed'];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'job_requirement_id';
        const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        let countQuery = `
            SELECT COUNT(*) as total 
            FROM job_requirements jr
            JOIN jobs j ON jr.job_id = j.job_id
            JOIN companies c ON j.company_id = c.company_id
        `;
        let dataQuery = `
            SELECT jr.*, j.job_title, c.company_name 
            FROM job_requirements jr
            JOIN jobs j ON jr.job_id = j.job_id
            JOIN companies c ON j.company_id = c.company_id
        `;
        let conditions = [];
        let queryParams = [];
        let paramIndex = 1;

        // Multi-field search across skills_required, allowed_branches, job_title, company_name
        if (search && search.trim()) {
            conditions.push(`(
                jr.skills_required ILIKE $${paramIndex}
                OR jr.additional_notes ILIKE $${paramIndex}
                OR j.job_title ILIKE $${paramIndex}
                OR c.company_name ILIKE $${paramIndex}
                OR array_to_string(jr.allowed_branches, ',') ILIKE $${paramIndex}
            )`);
            queryParams.push(`%${search.trim()}%`);
            paramIndex++;
        }

        // Apply conditions
        if (conditions.length > 0) {
            const whereClause = ` WHERE ${conditions.join(' AND ')}`;
            countQuery += whereClause;
            dataQuery += whereClause;
        }

        // Get total count
        const countResult = await pool.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].total);

        // Get paginated data
        dataQuery += ` ORDER BY jr.${safeSortBy} ${safeSortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const dataResult = await pool.query(dataQuery, queryParams);

        const totalPages = Math.ceil(total / limit);

        logger.info(`getAllJobRequirements: Retrieved ${dataResult.rows.length} job requirements`);

        return {
            success: true,
            data: {
                job_requirements: dataResult.rows,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: totalPages,
                    total_count: total,
                    limit: parseInt(limit),
                    has_next: page < totalPages,
                    has_prev: page > 1
                }
            },
            message: 'Job requirements retrieved successfully'
        };
    } catch (error) {
        logger.error(`getAllJobRequirements: ${error.message}`, {
            stack: error.stack,
            params
        });
        throw error;
    }
};

// Get job requirement by ID
export const getJobRequirementById = async (requirementId) => {
    try {
        logger.info(`getJobRequirementById: Fetching job requirement with ID ${requirementId}`);
        
        const selectQuery = `
            SELECT jr.*, j.job_title, j.job_type, j.location, c.company_name 
            FROM job_requirements jr
            JOIN jobs j ON jr.job_id = j.job_id
            JOIN companies c ON j.company_id = c.company_id
            WHERE jr.job_requirement_id = $1
        `;
        const result = await pool.query(selectQuery, [requirementId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Job requirement not found'
            };
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'Job requirement fetched successfully'
        };
    } catch (error) {
        logger.error(`getJobRequirementById: ${error.message}`, {
            stack: error.stack,
            requirementId
        });
        throw error;
    }
};

// Get job requirement by Job ID
export const getJobRequirementByJobId = async (jobId) => {
    try {
        logger.info(`getJobRequirementByJobId: Fetching job requirement for job ${jobId}`);
        
        const selectQuery = `
            SELECT jr.*, j.job_title, j.job_type, j.location, c.company_name 
            FROM job_requirements jr
            JOIN jobs j ON jr.job_id = j.job_id
            JOIN companies c ON j.company_id = c.company_id
            WHERE jr.job_id = $1
        `;
        const result = await pool.query(selectQuery, [jobId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Job requirement not found for this job'
            };
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'Job requirement fetched successfully'
        };
    } catch (error) {
        logger.error(`getJobRequirementByJobId: ${error.message}`, {
            stack: error.stack,
            jobId
        });
        throw error;
    }
};


// Delete job requirement by ID
export const deleteJobRequirement = async (requirementId) => {
    const client = await pool.connect();
    try {
        logger.info(`deleteJobRequirement: Deleting job requirement with ID ${requirementId}`);
        await client.query('BEGIN');

        // Check if job requirement exists
        const checkQuery = `SELECT job_requirement_id FROM job_requirements WHERE job_requirement_id = $1`;
        const checkResult = await client.query(checkQuery, [requirementId]);
        
        if (checkResult.rows.length === 0) {
            throw new AppError(404, 'Job requirement not found');
        }

        const deleteQuery = `DELETE FROM job_requirements WHERE job_requirement_id = $1 RETURNING *`;
        const result = await client.query(deleteQuery, [requirementId]);
        
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Job requirement deleted successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`deleteJobRequirement: ${error.message}`, {
            stack: error.stack,
            requirementId
        });
        throw error;
    } finally {
        client.release();
    }
};

