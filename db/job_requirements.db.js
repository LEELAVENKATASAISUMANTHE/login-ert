import logger from '../utils/logger.js';
import pool from './connection.js';
const Branches = ["CSE","AI","ECE","MECH","EEE","CIVIL","CSBS","ETE","MCA","ALL"];

const normalizeBranches = (arr) => {
    if (arr === null || arr === undefined) return null;
    if (!Array.isArray(arr)) throw new Error('allowed_branches must be an array');
    const normalized = arr.map(b => String(b).trim().toUpperCase());
    for (const b of normalized) {
        if (!Branches.includes(b)) {
            throw new Error(`Invalid branch: ${b}`);
        }
    }
    return normalized;
}

// Create a new job requirement
export const createJobRequirement = async (requirement) => {
    const client = await pool.connect();
    try {
        logger.info('createJobRequirement: Creating a new job requirement record');
        await client.query('BEGIN');

        // Verify job exists
        const jobCheck = `SELECT job_id FROM jobs WHERE job_id = $1`;
        const jobResult = await client.query(jobCheck, [requirement.job_id]);
        
        if (jobResult.rows.length === 0) {
            throw new Error('Job not found');
        }

        // Check if requirement already exists for this job
        const existingCheck = `SELECT job_requirement_id FROM job_requirements WHERE job_id = $1`;
        const existingResult = await client.query(existingCheck, [requirement.job_id]);
        
        if (existingResult.rows.length > 0) {
            throw new Error('Job requirement already exists for this job');
        }

        const allowedBranches = normalizeBranches(requirement.allowed_branches);

        const insertQuery = `
            INSERT INTO job_requirements (
                job_id,
                tenth_percent,
                twelfth_percent,
                ug_cgpa,
                min_experience_yrs,
                allowed_branches,
                skills_required,
                additional_notes,
                backlogs_allowed
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;

        const values = [
            requirement.job_id,
            requirement.tenth_percent || null,
            requirement.twelfth_percent || null,
            requirement.ug_cgpa || null,
            requirement.min_experience_yrs || null,
            allowedBranches,
            requirement.skills_required || null,
            requirement.additional_notes || null,
            requirement.backlogs_allowed != null ? requirement.backlogs_allowed : null
        ];

        const result = await client.query(insertQuery, values);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Job requirement created successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`createJobRequirement: ${error.message}`, {
            stack: error.stack,
            requirement
        });
        throw error;
    } finally {
        client.release();
    }
};

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

// Update job requirement by ID
export const updateJobRequirement = async (requirementId, requirement) => {
    const client = await pool.connect();
    try {
        logger.info(`updateJobRequirement: Updating job requirement with ID ${requirementId}`);
        await client.query('BEGIN');

        // Check if job requirement exists
        const checkExistQuery = `SELECT job_requirement_id FROM job_requirements WHERE job_requirement_id = $1`;
        const existResult = await client.query(checkExistQuery, [requirementId]);
        
        if (existResult.rows.length === 0) {
            throw new Error('Job requirement not found');
        }

        // If job_id is being updated, verify new job exists
        if (requirement.job_id) {
            const jobCheck = `SELECT job_id FROM jobs WHERE job_id = $1`;
            const jobResult = await client.query(jobCheck, [requirement.job_id]);
            
            if (jobResult.rows.length === 0) {
                throw new Error('Job not found');
            }

            // Check if another requirement exists for the new job
            const duplicateCheck = `SELECT job_requirement_id FROM job_requirements WHERE job_id = $1 AND job_requirement_id != $2`;
            const duplicateResult = await client.query(duplicateCheck, [requirement.job_id, requirementId]);
            
            if (duplicateResult.rows.length > 0) {
                throw new Error('Job requirement already exists for this job');
            }
        }

        const allowedBranchesUpdate = requirement.allowed_branches !== undefined ? normalizeBranches(requirement.allowed_branches) : null;

        const updateQuery = `
            UPDATE job_requirements SET
                job_id = COALESCE($1, job_id),
                tenth_percent = COALESCE($2, tenth_percent),
                twelfth_percent = COALESCE($3, twelfth_percent),
                ug_cgpa = COALESCE($4, ug_cgpa),
                min_experience_yrs = COALESCE($5, min_experience_yrs),
                allowed_branches = COALESCE($6, allowed_branches),
                skills_required = COALESCE($7, skills_required),
                additional_notes = COALESCE($8, additional_notes),
                backlogs_allowed = COALESCE($9, backlogs_allowed)
            WHERE job_requirement_id = $10
            RETURNING *
        `;

        const values = [
            requirement.job_id || null,
            requirement.tenth_percent !== undefined ? requirement.tenth_percent : null,
            requirement.twelfth_percent !== undefined ? requirement.twelfth_percent : null,
            requirement.ug_cgpa !== undefined ? requirement.ug_cgpa : null,
            requirement.min_experience_yrs !== undefined ? requirement.min_experience_yrs : null,
            allowedBranchesUpdate,
            requirement.skills_required || null,
            requirement.additional_notes || null,
            requirement.backlogs_allowed != null ? requirement.backlogs_allowed : null,
            requirementId
        ];

        const result = await client.query(updateQuery, values);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Job requirement updated successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`updateJobRequirement: ${error.message}`, {
            stack: error.stack,
            requirementId,
            requirement
        });
        throw error;
    } finally {
        client.release();
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
            throw new Error('Job requirement not found');
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

// Delete job requirement by Job ID
export const deleteJobRequirementByJobId = async (jobId) => {
    const client = await pool.connect();
    try {
        logger.info(`deleteJobRequirementByJobId: Deleting job requirement for job ${jobId}`);
        await client.query('BEGIN');

        // Check if job requirement exists
        const checkQuery = `SELECT job_requirement_id FROM job_requirements WHERE job_id = $1`;
        const checkResult = await client.query(checkQuery, [jobId]);
        
        if (checkResult.rows.length === 0) {
            throw new Error('Job requirement not found for this job');
        }

        const deleteQuery = `DELETE FROM job_requirements WHERE job_id = $1 RETURNING *`;
        const result = await client.query(deleteQuery, [jobId]);
        
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Job requirement deleted successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`deleteJobRequirementByJobId: ${error.message}`, {
            stack: error.stack,
            jobId
        });
        throw error;
    } finally {
        client.release();
    }
};
