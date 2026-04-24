import pool from "./connection.js";
import logger from "../utils/logger.js";
import { AppError } from '../utils/errors.js';

// Create a new job
export const createJob = async (job) => {
    try {
        // Verify company exists
        const companyCheck = await pool.query('SELECT company_id FROM companies WHERE company_id = $1', [job.company_id]);
        if (companyCheck.rows.length === 0) throw new AppError(422, 'Company not found');

        const insertQuery = `
            INSERT INTO jobs (
                company_id, job_title, job_description, job_type,
                ctc_lpa, stipend_per_month, location, interview_mode,
                application_deadline, drive_date, year_of_graduation
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;
        const values = [
            job.company_id,
            job.job_title,
            job.job_description || null,
            job.job_type || null,
            job.ctc_lpa !== undefined ? job.ctc_lpa : null,
            job.stipend_per_month !== undefined ? job.stipend_per_month : null,
            job.location || null,
            job.interview_mode || null,
            job.application_deadline || null,
            job.drive_date || null,
            job.year_of_graduation !== undefined ? job.year_of_graduation : null
        ];

        const res = await pool.query(insertQuery, values);
        return { success: true, data: res.rows[0], message: 'Job created successfully' };
    } catch (err) {
        logger.error({ error: err.message, job }, 'createJob failed');
        throw err;
    }
};

// Get all jobs with pagination and search
export const getAllJobs = async (params = {}) => {
    try {
        const { page = 1, limit = 10, sortBy = 'job_id', sortOrder = 'DESC', search = '' } = params;
        const offset = (page - 1) * limit;

        const allowedSortFields = ['job_id', 'job_title', 'job_type', 'ctc_lpa', 'location', 'application_deadline', 'drive_date', 'year_of_graduation', 'created_at'];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'job_id';
        const safeSortOrder = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        let countQuery = `SELECT COUNT(*) as total FROM jobs j JOIN companies c ON j.company_id = c.company_id`;
        let dataQuery = `SELECT j.*, c.company_name FROM jobs j JOIN companies c ON j.company_id = c.company_id`;
        const conditions = [];
        const paramsArr = [];
        let idx = 1;

        if (search && String(search).trim()) {
            conditions.push(`(j.job_title ILIKE $${idx} OR j.location ILIKE $${idx} OR c.company_name ILIKE $${idx})`);
            paramsArr.push(`%${String(search).trim()}%`);
            idx++;
        }

        if (conditions.length) {
            const where = ` WHERE ${conditions.join(' AND ')}`;
            countQuery += where;
            dataQuery += where;
        }

        const countRes = await pool.query(countQuery, paramsArr);
        const total = parseInt(countRes.rows[0].total, 10);

        dataQuery += ` ORDER BY j.${safeSortBy} ${safeSortOrder} LIMIT $${idx} OFFSET $${idx + 1}`;
        paramsArr.push(limit, offset);

        const dataRes = await pool.query(dataQuery, paramsArr);

        return {
            success: true,
            data: {
                jobs: dataRes.rows,
                pagination: {
                    current_page: parseInt(page, 10),
                    total_pages: Math.ceil(total / limit),
                    total_count: total,
                    limit: parseInt(limit, 10),
                    has_next: page < Math.ceil(total / limit),
                    has_prev: page > 1
                }
            }
        };
    } catch (err) {
        logger.error({ error: err.message, params }, 'getAllJobs failed');
        throw err;
    }
};

// Get job by ID (including requirements)
export const getJobById = async (jobId) => {
    try {
        const q = `
            SELECT j.*, c.company_name, jr.*
            FROM jobs j
            JOIN companies c ON j.company_id = c.company_id
            LEFT JOIN job_requirements jr ON jr.job_id = j.job_id
            WHERE j.job_id = $1
        `;
        const res = await pool.query(q, [jobId]);
        if (res.rows.length === 0) return { success: false, data: null, message: 'Job not found' };

        // If job and requirements are returned in same row, separate requirement fields
        const row = res.rows[0];
        const requirementFields = ['job_requirement_id','tenth_percent','twelfth_percent','ug_cgpa','min_experience_yrs','allowed_branches','skills_required','additional_notes','backlogs_allowed'];
        const requirements = {};
        for (const f of requirementFields) {
            if (row.hasOwnProperty(f)) {
                requirements[f] = row[f];
                delete row[f];
            }
        }

        return { success: true, data: { job: row, requirements }, message: 'Job fetched successfully' };
    } catch (err) {
        logger.error({ error: err.message, jobId }, 'getJobById failed');
        throw err;
    }
};

// Get jobs by company ID
export const getJobsByCompanyId = async (companyId, params = {}) => {
    try {
        const { page = 1, limit = 10, sortBy = 'job_id', sortOrder = 'DESC', search = '' } = params;
        const offset = (page - 1) * limit;

        const allowedSortFields = ['job_id', 'job_title', 'job_type', 'ctc_lpa', 'location', 'application_deadline', 'drive_date', 'year_of_graduation', 'created_at'];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'job_id';
        const safeSortOrder = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        let countQuery = `SELECT COUNT(*) as total FROM jobs j WHERE j.company_id = $1`;
        let dataQuery = `SELECT j.* FROM jobs j WHERE j.company_id = $1`;
        const paramsArr = [companyId];
        let idx = 2;

        if (search && String(search).trim()) {
            dataQuery += ` AND (j.job_title ILIKE $${idx} OR j.location ILIKE $${idx})`;
            countQuery += ` AND (j.job_title ILIKE $${idx} OR j.location ILIKE $${idx})`;
            paramsArr.push(`%${String(search).trim()}%`);
            idx++;
        }

        const countRes = await pool.query(countQuery, paramsArr);
        const total = parseInt(countRes.rows[0].total, 10);

        dataQuery += ` ORDER BY j.${safeSortBy} ${safeSortOrder} LIMIT $${idx} OFFSET $${idx + 1}`;
        paramsArr.push(limit, offset);

        const dataRes = await pool.query(dataQuery, paramsArr);

        return {
            success: true,
            data: {
                jobs: dataRes.rows,
                pagination: {
                    current_page: parseInt(page, 10),
                    total_pages: Math.ceil(total / limit),
                    total_count: total,
                    limit: parseInt(limit, 10),
                    has_next: page < Math.ceil(total / limit),
                    has_prev: page > 1
                }
            }
        };
    } catch (err) {
        logger.error({ error: err.message, companyId, params }, 'getJobsByCompanyId failed');
        throw err;
    }
};

// Update a job
export const updateJob = async (jobId, job) => {
    try {
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
                drive_date = COALESCE($10, drive_date),
                year_of_graduation = COALESCE($11, year_of_graduation)
            WHERE job_id = $12 RETURNING *
        `;

        const values = [
            job.company_id || null,
            job.job_title || null,
            job.job_description ?? null,
            job.job_type ?? null,
            job.ctc_lpa !== undefined ? job.ctc_lpa : null,
            job.stipend_per_month !== undefined ? job.stipend_per_month : null,
            job.location ?? null,
            job.interview_mode ?? null,
            job.application_deadline ?? null,
            job.drive_date ?? null,
            job.year_of_graduation !== undefined ? job.year_of_graduation : null,
            jobId
        ];

        const res = await pool.query(updateQuery, values);
        if (res.rowCount === 0) throw new AppError(404, 'Job not found');
        return { success: true, data: res.rows[0], message: 'Job updated successfully' };
    } catch (err) {
        logger.error({ error: err.message, jobId, job }, 'updateJob failed');
        throw err;
    }
};

// Delete a job
export const deleteJob = async (jobId) => {
    try {
        const res = await pool.query('DELETE FROM jobs WHERE job_id = $1 RETURNING *', [jobId]);
        if (res.rowCount === 0) throw new AppError(404, 'Job not found');
        return { success: true, data: res.rows[0], message: 'Job deleted successfully' };
    } catch (err) {
        logger.error({ error: err.message, jobId }, 'deleteJob failed');
        throw err;
    }
};