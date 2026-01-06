import logger from '../utils/logger.js';
import pool from './connection.js';

// Create a new job
export const createJob = async (job) => {
    const client = await pool.connect();
    try {
        logger.info('createJob: Creating a new job record');
        await client.query('BEGIN');

        // Verify company exists
        const companyCheck = `SELECT company_id FROM companies WHERE company_id = $1`;
        const companyResult = await client.query(companyCheck, [job.company_id]);
        
        if (companyResult.rows.length === 0) {
            throw new Error('Company not found');
        }

        const insertQuery = `
            INSERT INTO jobs (
                company_id,
                job_title,
                job_description,
                job_type,
                ctc_lpa,
                stipend_per_month,
                location,
                interview_mode,
                application_deadline,
                drive_date,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;

        const values = [
            job.company_id,
            job.job_title,
            job.job_description || null,
            job.job_type || null,
            job.ctc_lpa || null,
            job.stipend_per_month || null,
            job.location || null,
            job.interview_mode || null,
            job.application_deadline || null,
            job.drive_date || null,
            new Date()
        ];

        const result = await client.query(insertQuery, values);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Job created successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`createJob: ${error.message}`, {
            stack: error.stack,
            job
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get all jobs with pagination and multi-field search
export const getAllJobs = async (params = {}) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            sortBy = 'job_id', 
            sortOrder = 'DESC',
            search = '',
            company_id = null
        } = params;

        const offset = (page - 1) * limit;
        
        // Validate sortBy to prevent SQL injection
        const allowedSortFields = ['job_id', 'job_title', 'job_type', 'ctc_lpa', 'location', 'application_deadline', 'drive_date', 'created_at'];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'job_id';
        const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        let countQuery = `
            SELECT COUNT(*) as total 
            FROM jobs j
            JOIN companies c ON j.company_id = c.company_id
        `;
        let dataQuery = `
            SELECT j.*, c.company_name 
            FROM jobs j
            JOIN companies c ON j.company_id = c.company_id
        `;
        let conditions = [];
        let queryParams = [];
        let paramIndex = 1;

        // Filter by company_id if provided
        if (company_id) {
            conditions.push(`j.company_id = $${paramIndex}`);
            queryParams.push(company_id);
            paramIndex++;
        }

        // Multi-field search across job_title, job_type, location, interview_mode
        if (search && search.trim()) {
            conditions.push(`(
                j.job_title ILIKE $${paramIndex}
                OR j.job_type ILIKE $${paramIndex}
                OR j.location ILIKE $${paramIndex}
                OR j.interview_mode ILIKE $${paramIndex}
                OR c.company_name ILIKE $${paramIndex}
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
        dataQuery += ` ORDER BY j.${safeSortBy} ${safeSortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const dataResult = await pool.query(dataQuery, queryParams);

        const totalPages = Math.ceil(total / limit);

        logger.info(`getAllJobs: Retrieved ${dataResult.rows.length} jobs`);

        return {
            success: true,
            data: {
                jobs: dataResult.rows,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: totalPages,
                    total_count: total,
                    limit: parseInt(limit),
                    has_next: page < totalPages,
                    has_prev: page > 1
                }
            },
            message: 'Jobs retrieved successfully'
        };
    } catch (error) {
        logger.error(`getAllJobs: ${error.message}`, {
            stack: error.stack,
            params
        });
        throw error;
    }
};

// Get job by ID
export const getJobById = async (jobId) => {
    try {
        logger.info(`getJobById: Fetching job with ID ${jobId}`);
        
        const selectQuery = `
            SELECT j.*, c.company_name 
            FROM jobs j
            JOIN companies c ON j.company_id = c.company_id
            WHERE j.job_id = $1
        `;
        const result = await pool.query(selectQuery, [jobId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Job not found'
            };
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'Job fetched successfully'
        };
    } catch (error) {
        logger.error(`getJobById: ${error.message}`, {
            stack: error.stack,
            jobId
        });
        throw error;
    }
};

// Get jobs by company ID
export const getJobsByCompanyId = async (companyId, params = {}) => {
    try {
        logger.info(`getJobsByCompanyId: Fetching jobs for company ${companyId}`);
        
        // Use getAllJobs with company_id filter
        return await getAllJobs({ ...params, company_id: companyId });
    } catch (error) {
        logger.error(`getJobsByCompanyId: ${error.message}`, {
            stack: error.stack,
            companyId
        });
        throw error;
    }
};

// Update job by ID
export const updateJob = async (jobId, job) => {
    const client = await pool.connect();
    try {
        logger.info(`updateJob: Updating job with ID ${jobId}`);
        await client.query('BEGIN');

        // Check if job exists
        const checkExistQuery = `SELECT job_id FROM jobs WHERE job_id = $1`;
        const existResult = await client.query(checkExistQuery, [jobId]);
        
        if (existResult.rows.length === 0) {
            throw new Error('Job not found');
        }

        // If company_id is being updated, verify new company exists
        if (job.company_id) {
            const companyCheck = `SELECT company_id FROM companies WHERE company_id = $1`;
            const companyResult = await client.query(companyCheck, [job.company_id]);
            
            if (companyResult.rows.length === 0) {
                throw new Error('Company not found');
            }
        }

        const updateQuery = `
            UPDATE jobs SET
                company_id = COALESCE($1, company_id),
                job_title = COALESCE($2, job_title),
                job_description = COALESCE($3, job_description),
                job_type = COALESCE($4, job_type),
                ctc_lpa = COALESCE($5, ctc_lpa),
                stipend_per_month = COALESCE($6, stipend_per_month),
                location = COALESCE($7, location),
                interview_mode = COALESCE($8, interview_mode),
                application_deadline = COALESCE($9, application_deadline),
                drive_date = COALESCE($10, drive_date)
            WHERE job_id = $11
            RETURNING *
        `;

        const values = [
            job.company_id || null,
            job.job_title || null,
            job.job_description || null,
            job.job_type || null,
            job.ctc_lpa || null,
            job.stipend_per_month || null,
            job.location || null,
            job.interview_mode || null,
            job.application_deadline || null,
            job.drive_date || null,
            jobId
        ];

        const result = await client.query(updateQuery, values);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Job updated successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`updateJob: ${error.message}`, {
            stack: error.stack,
            jobId,
            job
        });
        throw error;
    } finally {
        client.release();
    }
};

// Delete job by ID
export const deleteJob = async (jobId) => {
    const client = await pool.connect();
    try {
        logger.info(`deleteJob: Deleting job with ID ${jobId}`);
        await client.query('BEGIN');

        // Check if job exists
        const checkQuery = `SELECT job_id FROM jobs WHERE job_id = $1`;
        const checkResult = await client.query(checkQuery, [jobId]);
        
        if (checkResult.rows.length === 0) {
            throw new Error('Job not found');
        }

        const deleteQuery = `DELETE FROM jobs WHERE job_id = $1 RETURNING *`;
        const result = await client.query(deleteQuery, [jobId]);
        
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Job deleted successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`deleteJob: ${error.message}`, {
            stack: error.stack,
            jobId
        });
        throw error;
    } finally {
        client.release();
    }
};
