import logger from '../utils/logger.js';
import pool from './connection.js';

// Create a new application
export const createApplication = async (application) => {
    const client = await pool.connect();
    try {
        logger.info('createApplication: Creating a new application record');
        await client.query('BEGIN');

        // Verify student exists
        const studentCheck = `SELECT student_id FROM students WHERE student_id = $1`;
        const studentResult = await client.query(studentCheck, [application.student_id]);
        if (studentResult.rows.length === 0) {
            throw new Error('Student not found');
        }

        // Verify job exists
        const jobCheck = `SELECT job_id FROM jobs WHERE job_id = $1`;
        const jobResult = await client.query(jobCheck, [application.job_id]);
        if (jobResult.rows.length === 0) {
            throw new Error('Job not found');
        }

        // Check for duplicate application (same student + job)
        const duplicateCheck = `SELECT application_id FROM applications WHERE student_id = $1 AND job_id = $2`;
        const duplicateResult = await client.query(duplicateCheck, [application.student_id, application.job_id]);
        if (duplicateResult.rows.length > 0) {
            throw new Error('Application already exists for this student and job');
        }

        const insertQuery = `
            INSERT INTO applications (
                student_id,
                job_id,
                applied_at,
                status,
                offer_type,
                offer_ctc,
                offer_stipend,
                placement_date,
                remarks
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;

        const values = [
            application.student_id,
            application.job_id,
            application.applied_at || new Date(),
            application.status || 'Applied',
            application.offer_type || null,
            application.offer_ctc || null,
            application.offer_stipend || null,
            application.placement_date || null,
            application.remarks || null
        ];

        const result = await client.query(insertQuery, values);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Application created successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`createApplication: ${error.message}`, {
            stack: error.stack,
            application
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get all applications with pagination, search and filters
export const getAllApplications = async (params = {}) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            sortBy = 'application_id', 
            sortOrder = 'DESC',
            search = '',
            student_id = null,
            job_id = null,
            status = null,
            offer_type = null
        } = params;

        const offset = (page - 1) * limit;
        
        const allowedSortFields = ['application_id', 'student_id', 'job_id', 'applied_at', 'status', 'offer_ctc', 'placement_date'];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'application_id';
        const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        let countQuery = `
            SELECT COUNT(*) as total 
            FROM applications a
            JOIN students s ON a.student_id = s.student_id
            JOIN jobs j ON a.job_id = j.job_id
            JOIN companies c ON j.company_id = c.company_id
        `;
        let dataQuery = `
            SELECT a.*, 
                   s.full_name as student_name, 
                   s.email as student_email,
                   j.job_title, 
                   c.company_name
            FROM applications a
            JOIN students s ON a.student_id = s.student_id
            JOIN jobs j ON a.job_id = j.job_id
            JOIN companies c ON j.company_id = c.company_id
        `;
        let conditions = [];
        let queryParams = [];
        let paramIndex = 1;

        // Apply filters
        if (student_id) {
            conditions.push(`a.student_id = $${paramIndex}`);
            queryParams.push(student_id);
            paramIndex++;
        }
        if (job_id) {
            conditions.push(`a.job_id = $${paramIndex}`);
            queryParams.push(job_id);
            paramIndex++;
        }
        if (status) {
            conditions.push(`a.status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }
        if (offer_type) {
            conditions.push(`a.offer_type = $${paramIndex}`);
            queryParams.push(offer_type);
            paramIndex++;
        }

        // Multi-field search
        if (search && search.trim()) {
            conditions.push(`(
                a.status ILIKE $${paramIndex}
                OR a.offer_type ILIKE $${paramIndex}
                OR a.remarks ILIKE $${paramIndex}
                OR s.full_name ILIKE $${paramIndex}
                OR j.job_title ILIKE $${paramIndex}
                OR c.company_name ILIKE $${paramIndex}
            )`);
            queryParams.push(`%${search.trim()}%`);
            paramIndex++;
        }

        if (conditions.length > 0) {
            const whereClause = ` WHERE ${conditions.join(' AND ')}`;
            countQuery += whereClause;
            dataQuery += whereClause;
        }

        const countResult = await pool.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].total);

        dataQuery += ` ORDER BY a.${safeSortBy} ${safeSortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const dataResult = await pool.query(dataQuery, queryParams);
        const totalPages = Math.ceil(total / limit);

        logger.info(`getAllApplications: Retrieved ${dataResult.rows.length} applications`);

        return {
            success: true,
            data: {
                applications: dataResult.rows,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: totalPages,
                    total_count: total,
                    limit: parseInt(limit),
                    has_next: page < totalPages,
                    has_prev: page > 1
                }
            },
            message: 'Applications retrieved successfully'
        };
    } catch (error) {
        logger.error(`getAllApplications: ${error.message}`, {
            stack: error.stack,
            params
        });
        throw error;
    }
};

// Get application by ID
export const getApplicationById = async (applicationId) => {
    try {
        logger.info(`getApplicationById: Fetching application with ID ${applicationId}`);
        
        const selectQuery = `
            SELECT a.*, 
                   s.full_name as student_name, 
                   s.email as student_email,
                   j.job_title, 
                   c.company_name
            FROM applications a
            JOIN students s ON a.student_id = s.student_id
            JOIN jobs j ON a.job_id = j.job_id
            JOIN companies c ON j.company_id = c.company_id
            WHERE a.application_id = $1
        `;
        const result = await pool.query(selectQuery, [applicationId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Application not found'
            };
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'Application fetched successfully'
        };
    } catch (error) {
        logger.error(`getApplicationById: ${error.message}`, {
            stack: error.stack,
            applicationId
        });
        throw error;
    }
};

// Get applications by student ID
export const getApplicationsByStudentId = async (studentId, params = {}) => {
    try {
        logger.info(`getApplicationsByStudentId: Fetching applications for student ${studentId}`);
        return await getAllApplications({ ...params, student_id: studentId });
    } catch (error) {
        logger.error(`getApplicationsByStudentId: ${error.message}`, {
            stack: error.stack,
            studentId
        });
        throw error;
    }
};

// Get applications by job ID
export const getApplicationsByJobId = async (jobId, params = {}) => {
    try {
        logger.info(`getApplicationsByJobId: Fetching applications for job ${jobId}`);
        return await getAllApplications({ ...params, job_id: jobId });
    } catch (error) {
        logger.error(`getApplicationsByJobId: ${error.message}`, {
            stack: error.stack,
            jobId
        });
        throw error;
    }
};

// Update application by ID
export const updateApplication = async (applicationId, application) => {
    const client = await pool.connect();
    try {
        logger.info(`updateApplication: Updating application with ID ${applicationId}`);
        await client.query('BEGIN');

        const checkExistQuery = `SELECT application_id FROM applications WHERE application_id = $1`;
        const existResult = await client.query(checkExistQuery, [applicationId]);
        
        if (existResult.rows.length === 0) {
            throw new Error('Application not found');
        }

        const updateQuery = `
            UPDATE applications SET
                status = COALESCE($1, status),
                offer_type = COALESCE($2, offer_type),
                offer_ctc = COALESCE($3, offer_ctc),
                offer_stipend = COALESCE($4, offer_stipend),
                placement_date = COALESCE($5, placement_date),
                remarks = COALESCE($6, remarks)
            WHERE application_id = $7
            RETURNING *
        `;

        const values = [
            application.status,
            application.offer_type,
            application.offer_ctc,
            application.offer_stipend,
            application.placement_date,
            application.remarks,
            applicationId
        ];

        const result = await client.query(updateQuery, values);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Application updated successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`updateApplication: ${error.message}`, {
            stack: error.stack,
            applicationId,
            application
        });
        throw error;
    } finally {
        client.release();
    }
};

// Update application status only
export const updateApplicationStatus = async (applicationId, status) => {
    const client = await pool.connect();
    try {
        logger.info(`updateApplicationStatus: Updating status for application ${applicationId}`);
        await client.query('BEGIN');

        const checkExistQuery = `SELECT application_id FROM applications WHERE application_id = $1`;
        const existResult = await client.query(checkExistQuery, [applicationId]);
        
        if (existResult.rows.length === 0) {
            throw new Error('Application not found');
        }

        const updateQuery = `
            UPDATE applications SET status = $1
            WHERE application_id = $2
            RETURNING *
        `;

        const result = await client.query(updateQuery, [status, applicationId]);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Application status updated successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`updateApplicationStatus: ${error.message}`, {
            stack: error.stack,
            applicationId,
            status
        });
        throw error;
    } finally {
        client.release();
    }
};

// Delete application by ID
export const deleteApplication = async (applicationId) => {
    const client = await pool.connect();
    try {
        logger.info(`deleteApplication: Deleting application with ID ${applicationId}`);
        await client.query('BEGIN');

        const checkQuery = `SELECT application_id FROM applications WHERE application_id = $1`;
        const checkResult = await client.query(checkQuery, [applicationId]);
        
        if (checkResult.rows.length === 0) {
            throw new Error('Application not found');
        }

        const deleteQuery = `DELETE FROM applications WHERE application_id = $1 RETURNING *`;
        const result = await client.query(deleteQuery, [applicationId]);
        
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Application deleted successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`deleteApplication: ${error.message}`, {
            stack: error.stack,
            applicationId
        });
        throw error;
    } finally {
        client.release();
    }
};
