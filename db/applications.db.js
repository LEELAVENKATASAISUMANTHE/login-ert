import logger from '../utils/logger.js';
import pool from './connection.js';

// Helper function to check student eligibility against job requirements
export const checkEligibility = async (studentId, jobId) => {
    const client = await pool.connect();
    try {
        logger.info(`checkEligibility: Checking eligibility for student ${studentId} and job ${jobId}`);
        
        // Get student academic details and job requirements in one query
        const checkQuery = `
            SELECT 
                s.student_id,
                s.branch,
                sa.tenth_percent,
                sa.twelfth_percent,
                sa.ug_cgpa,
                sa.pg_cgpa,
                COALESCE(si.total_experience_years, 0) as experience_years,
                jr.tenth_percent as req_tenth,
                jr.twelfth_percent as req_twelfth,
                jr.ug_cgpa as req_ug_cgpa,
                jr.pg_cgpa as req_pg_cgpa,
                jr.min_experience_yrs,
                jr.allowed_branches,
                jr.skills_required,
                j.job_title,
                j.application_deadline
            FROM students s
            LEFT JOIN student_academics sa ON s.student_id = sa.student_id
            LEFT JOIN (
                SELECT student_id, 
                       COUNT(*) as internship_count,
                       COALESCE(SUM(
                           CASE 
                               WHEN duration ~ '^[0-9]+$' THEN CAST(duration AS INTEGER)
                               ELSE 0
                           END
                       ), 0)/12.0 as total_experience_years
                FROM student_internships 
                GROUP BY student_id
            ) si ON s.student_id = si.student_id
            LEFT JOIN jobs j ON j.job_id = $2
            LEFT JOIN job_requirements jr ON j.job_id = jr.job_id
            WHERE s.student_id = $1 AND j.job_id = $2
        `;
        
        const result = await client.query(checkQuery, [studentId, jobId]);
        
        if (result.rows.length === 0) {
            return {
                success: false,
                message: 'Student or job not found'
            };
        }
        
        const data = result.rows[0];
        
        // Check if application deadline has passed
        if (data.application_deadline && new Date() > new Date(data.application_deadline)) {
            return {
                success: false,
                eligible: false,
                message: 'Application deadline has passed',
                checks: {}
            };
        }
        
        // Perform eligibility checks - convert strings to numbers for proper comparison
        // Handle null values: if student data is null, the check fails; if requirement is null, the check passes
        const studentTenth = data.tenth_percent !== null ? parseFloat(data.tenth_percent) : null;
        const studentTwelfth = data.twelfth_percent !== null ? parseFloat(data.twelfth_percent) : null;
        const studentUgCgpa = data.ug_cgpa !== null ? parseFloat(data.ug_cgpa) : null;
        const studentPgCgpa = data.pg_cgpa !== null ? parseFloat(data.pg_cgpa) : null;
        const studentExperience = parseFloat(data.experience_years) || 0;
        
        const reqTenth = data.req_tenth !== null ? parseFloat(data.req_tenth) : null;
        const reqTwelfth = data.req_twelfth !== null ? parseFloat(data.req_twelfth) : null;
        const reqUgCgpa = data.req_ug_cgpa !== null ? parseFloat(data.req_ug_cgpa) : null;
        const reqPgCgpa = data.req_pg_cgpa !== null ? parseFloat(data.req_pg_cgpa) : null;
        const reqExperience = data.min_experience_yrs !== null ? parseFloat(data.min_experience_yrs) : null;

        const checks = {
            tenth_percent_meets: reqTenth !== null ? (studentTenth !== null && studentTenth >= reqTenth) : true,
            twelfth_percent_meets: reqTwelfth !== null ? (studentTwelfth !== null && studentTwelfth >= reqTwelfth) : true,
            ug_cgpa_meets: reqUgCgpa !== null ? (studentUgCgpa !== null && studentUgCgpa >= reqUgCgpa) : true,
            pg_cgpa_meets: reqPgCgpa !== null ? (studentPgCgpa !== null && studentPgCgpa >= reqPgCgpa) : true,
            experience_meets: reqExperience !== null ? (studentExperience >= reqExperience) : true,
            branch_meets: data.allowed_branches && data.allowed_branches.length > 0 
                ? data.allowed_branches.some(branch => branch.toLowerCase() === (data.branch || '').toLowerCase()) 
                : true
        };
        
        // Determine overall eligibility
        const allChecksPassed = Object.values(checks).every(check => check === true);
        
        // Calculate eligibility status
        let eligibilityStatus = 'eligible';
        let eligibilityComments = [];
        
        if (!allChecksPassed) {
            eligibilityStatus = 'not_eligible';
            
            if (!checks.tenth_percent_meets) {
                if (studentTenth === null) {
                    eligibilityComments.push(`10th percentage data missing (required: ${reqTenth}%)`);
                } else {
                    eligibilityComments.push(`10th percentage below requirement (${studentTenth}% < ${reqTenth}%)`);
                }
            }
            if (!checks.twelfth_percent_meets) {
                if (studentTwelfth === null) {
                    eligibilityComments.push(`12th percentage data missing (required: ${reqTwelfth}%)`);
                } else {
                    eligibilityComments.push(`12th percentage below requirement (${studentTwelfth}% < ${reqTwelfth}%)`);
                }
            }
            if (!checks.ug_cgpa_meets) {
                if (studentUgCgpa === null) {
                    eligibilityComments.push(`UG CGPA data missing (required: ${reqUgCgpa})`);
                } else {
                    eligibilityComments.push(`UG CGPA below requirement (${studentUgCgpa} < ${reqUgCgpa})`);
                }
            }
            if (!checks.pg_cgpa_meets) {
                if (studentPgCgpa === null) {
                    eligibilityComments.push(`PG CGPA data missing (required: ${reqPgCgpa})`);
                } else {
                    eligibilityComments.push(`PG CGPA below requirement (${studentPgCgpa} < ${reqPgCgpa})`);
                }
            }
            if (!checks.experience_meets) {
                eligibilityComments.push(`Experience below requirement (${studentExperience} years < ${reqExperience} years)`);
            }
            if (!checks.branch_meets) {
                eligibilityComments.push(`Branch not allowed (${data.branch || 'unknown'} not in [${data.allowed_branches?.join(', ')}])`);
            }
        }
        
        return {
            success: true,
            eligible: allChecksPassed,
            eligibilityStatus,
            eligibilityComments: eligibilityComments.join('; '),
            checks,
            studentData: data
        };
        
    } catch (error) {
        logger.error(`checkEligibility: ${error.message}`, {
            stack: error.stack,
            studentId,
            jobId
        });
        throw error;
    } finally {
        client.release();
    }
};

// Create a new application with eligibility check
export const createApplication = async (application) => {
    const client = await pool.connect();
    try {
        logger.info('createApplication: Creating new student application', { application });
        await client.query('BEGIN');

        // First check if application already exists
        const existingCheck = `
            SELECT application_id FROM applications 
            WHERE student_id = $1 AND job_id = $2
        `;
        const existing = await client.query(existingCheck, [application.student_id, application.job_id]);
        
        if (existing.rows.length > 0) {
            throw new Error('Application already exists for this student and job');
        }

        // Check eligibility
        const eligibilityResult = await checkEligibility(application.student_id, application.job_id);
        
        if (!eligibilityResult.success) {
            throw new Error(eligibilityResult.message);
        }

        // Insert application with eligibility results
        const insertQuery = `
            INSERT INTO applications (
                student_id,
                job_id,
                status,
                eligibility_status,
                eligibility_checked_at,
                eligibility_comments,
                tenth_percent_meets,
                twelfth_percent_meets,
                ug_cgpa_meets,
                pg_cgpa_meets,
                experience_meets,
                branch_meets,
                skills_match_score
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
            )
            RETURNING *
        `;

        const values = [
            application.student_id,
            application.job_id,
            'submitted', // Always use 'submitted' for the status column
            eligibilityResult.eligibilityStatus,
            new Date(),
            eligibilityResult.eligibilityComments,
            eligibilityResult.checks.tenth_percent_meets,
            eligibilityResult.checks.twelfth_percent_meets,
            eligibilityResult.checks.ug_cgpa_meets,
            eligibilityResult.checks.pg_cgpa_meets,
            eligibilityResult.checks.experience_meets,
            eligibilityResult.checks.branch_meets,
            application.skills_match_score || 0.00
        ];

        const result = await client.query(insertQuery, values);
        await client.query('COMMIT');

        return {
            success: true,
            data: {
                ...result.rows[0],
                eligibility_details: eligibilityResult
            },
            message: eligibilityResult.eligible 
                ? 'Application submitted successfully' 
                : 'Application created but marked as not eligible'
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

// Get all applications with filtering and pagination
export const getAllApplications = async (params = {}) => {
    const client = await pool.connect();
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'applied_at',
            sortOrder = 'DESC',
            search = '',
            studentId = null,
            jobId = null,
            status = null,
            eligibilityStatus = null
        } = params;

        const offset = (page - 1) * limit;
        
        // Base queries
        let countQuery = `SELECT COUNT(*) as total FROM application_details_view`;
        let dataQuery = `SELECT * FROM application_details_view`;
        
        const conditions = [];
        const queryParams = [];
        let paramIndex = 1;
        
        // Add search condition
        if (search && search.trim() !== '') {
            conditions.push(`(
                full_name ILIKE $${paramIndex} OR 
                email ILIKE $${paramIndex} OR 
                job_title ILIKE $${paramIndex} OR 
                company_name ILIKE $${paramIndex}
            )`);
            queryParams.push(`%${search.trim()}%`);
            paramIndex++;
        }
        
        // Add filter conditions
        if (studentId) {
            conditions.push(`student_id = $${paramIndex}`);
            queryParams.push(studentId);
            paramIndex++;
        }
        
        if (jobId) {
            conditions.push(`job_id = $${paramIndex}`);
            queryParams.push(jobId);
            paramIndex++;
        }
        
        if (status) {
            conditions.push(`status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }
        
        if (eligibilityStatus) {
            conditions.push(`eligibility_status = $${paramIndex}`);
            queryParams.push(eligibilityStatus);
            paramIndex++;
        }
        
        // Add WHERE clause if conditions exist
        if (conditions.length > 0) {
            const whereClause = ` WHERE ${conditions.join(' AND ')}`;
            countQuery += whereClause;
            dataQuery += whereClause;
        }
        
        // Add sorting and pagination
        const allowedSortFields = [
            'application_id', 'applied_at', 'updated_at', 'student_id', 
            'job_id', 'status', 'eligibility_status', 'full_name', 'job_title'
        ];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'applied_at';
        const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        
        dataQuery += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;
        dataQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);
        
        // Execute queries
        const [countResult, dataResult] = await Promise.all([
            client.query(countQuery, queryParams.slice(0, -2)), // Remove limit/offset params for count
            client.query(dataQuery, queryParams)
        ]);
        
        const totalRecords = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalRecords / limit);
        
        return {
            success: true,
            data: dataResult.rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalRecords,
                recordsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            message: 'Applications fetched successfully'
        };

    } catch (error) {
        logger.error(`getAllApplications: ${error.message}`, { stack: error.stack, params });
        throw error;
    } finally {
        client.release();
    }
};

// Get application by ID
export const getApplicationById = async (applicationId) => {
    const client = await pool.connect();
    try {
        logger.info(`getApplicationById: Fetching application ${applicationId}`);
        
        const query = `SELECT * FROM application_details_view WHERE application_id = $1`;
        const result = await client.query(query, [applicationId]);
        
        if (result.rows.length === 0) {
            return {
                success: false,
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
    } finally {
        client.release();
    }
};

// Update application status
export const updateApplicationStatus = async (applicationId, updates) => {
    const client = await pool.connect();
    try {
        logger.info(`updateApplicationStatus: Updating application ${applicationId}`, { updates });
        await client.query('BEGIN');
        
        // First check if application exists
        const existingQuery = `SELECT * FROM applications WHERE application_id = $1`;
        const existing = await client.query(existingQuery, [applicationId]);
        
        if (existing.rows.length === 0) {
            throw new Error('Application not found');
        }
        
        // Build dynamic update query
        const updateFields = [];
        const queryParams = [];
        let paramIndex = 1;
        
        const allowedUpdates = [
            'application_status', 'eligibility_status', 'eligibility_comments',
            'skills_match_score', 'offer_type', 'offer_ctc', 'offer_stipend', 
            'placement_date', 'remarks'
        ];
        
        Object.entries(updates).forEach(([key, value]) => {
            if (allowedUpdates.includes(key) && value !== undefined) {
                updateFields.push(`${key} = $${paramIndex}`);
                queryParams.push(value);
                paramIndex++;
            }
        });
        
        if (updateFields.length === 0) {
            throw new Error('No valid fields provided for update');
        }
        
        queryParams.push(applicationId); // For WHERE clause
        
        const updateQuery = `
            UPDATE applications 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE application_id = $${paramIndex}
            RETURNING *
        `;
        
        const result = await client.query(updateQuery, queryParams);
        await client.query('COMMIT');
        
        return {
            success: true,
            data: result.rows[0],
            message: 'Application updated successfully'
        };

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`updateApplicationStatus: ${error.message}`, {
            stack: error.stack,
            applicationId,
            updates
        });
        throw error;
    } finally {
        client.release();
    }
};

// Delete application
export const deleteApplication = async (applicationId) => {
    const client = await pool.connect();
    try {
        logger.info(`deleteApplication: Deleting application ${applicationId}`);
        await client.query('BEGIN');
        
        const deleteQuery = `
            DELETE FROM applications 
            WHERE application_id = $1 
            RETURNING *
        `;
        
        const result = await client.query(deleteQuery, [applicationId]);
        
        if (result.rows.length === 0) {
            throw new Error('Application not found');
        }
        
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

// Get applications by student ID
export const getApplicationsByStudentId = async (studentId, params = {}) => {
    return getAllApplications({ ...params, studentId });
};

// Get applications by job ID
export const getApplicationsByJobId = async (jobId, params = {}) => {
    return getAllApplications({ ...params, jobId });
};

// Bulk eligibility check for multiple applications
export const bulkEligibilityCheck = async (filters = {}) => {
    const client = await pool.connect();
    try {
        logger.info('bulkEligibilityCheck: Running bulk eligibility check', { filters });
        
        // Get applications that need eligibility recheck
        const applicationsQuery = `
            SELECT application_id, student_id, job_id 
            FROM applications 
            WHERE eligibility_status = 'pending' OR eligibility_checked_at IS NULL
        `;
        
        const applications = await client.query(applicationsQuery);
        const results = [];
        
        for (const app of applications.rows) {
            try {
                const eligibilityResult = await checkEligibility(app.student_id, app.job_id);
                
                if (eligibilityResult.success) {
                    await updateApplicationStatus(app.application_id, {
                        eligibility_status: eligibilityResult.eligibilityStatus,
                        eligibility_comments: eligibilityResult.eligibilityComments
                    });
                    
                    results.push({
                        application_id: app.application_id,
                        eligible: eligibilityResult.eligible,
                        status: 'updated'
                    });
                } else {
                    results.push({
                        application_id: app.application_id,
                        status: 'error',
                        error: eligibilityResult.message
                    });
                }
            } catch (error) {
                results.push({
                    application_id: app.application_id,
                    status: 'error',
                    error: error.message
                });
            }
        }
        
        return {
            success: true,
            data: results,
            message: `Processed ${results.length} applications`
        };

    } catch (error) {
        logger.error(`bulkEligibilityCheck: ${error.message}`, { stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
};
