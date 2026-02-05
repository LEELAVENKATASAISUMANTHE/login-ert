import logger from '../utils/logger.js';
import pool from './connection.js';

// Create a new student offer
export const createStudentOffer = async (offer) => {
    const client = await pool.connect();
    try {
        logger.info('createStudentOffer: Creating a new student offer record');
        await client.query('BEGIN');

        // Verify student exists
        const studentCheck = `SELECT student_id FROM students WHERE student_id = $1`;
        const studentResult = await client.query(studentCheck, [offer.student_id]);
        if (studentResult.rows.length === 0) {
            throw new Error('Student not found');
        }

        const isOffcampus = offer.is_offcampus || false;

        // For on-campus offers, verify job exists
        if (!isOffcampus && offer.job_id) {
            const jobCheck = `SELECT job_id FROM jobs WHERE job_id = $1`;
            const jobResult = await client.query(jobCheck, [offer.job_id]);
            if (jobResult.rows.length === 0) {
                throw new Error('Job not found');
            }

            // Check for duplicate offer (same student + job) - only for on-campus
            const duplicateCheck = `SELECT offer_id FROM student_offers WHERE student_id = $1 AND job_id = $2`;
            const duplicateResult = await client.query(duplicateCheck, [offer.student_id, offer.job_id]);
            if (duplicateResult.rows.length > 0) {
                throw new Error('Offer already exists for this student and job');
            }
        }

        const insertQuery = `
            INSERT INTO student_offers (
                student_id,
                job_id,
                offered_at,
                is_primary_offer,
                is_pbc,
                is_internship,
                is_offcampus,
                offcampus_company_name,
                offcampus_job_title,
                offcampus_location,
                offer_ctc,
                offer_stipend,
                remarks
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;

        const values = [
            offer.student_id,
            isOffcampus ? null : offer.job_id,
            offer.offered_at || new Date(),
            offer.is_primary_offer || false,
            offer.is_pbc || false,
            offer.is_internship || false,
            isOffcampus,
            offer.offcampus_company_name || null,
            offer.offcampus_job_title || null,
            offer.offcampus_location || null,
            offer.offer_ctc || null,
            offer.offer_stipend || null,
            offer.remarks || null
        ];

        const result = await client.query(insertQuery, values);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student offer created successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`createStudentOffer: ${error.message}`, {
            stack: error.stack,
            offer
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get all student offers with pagination and filters
export const getAllStudentOffers = async (params = {}) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            sortBy = 'offer_id', 
            sortOrder = 'DESC',
            student_id = null,
            job_id = null,
            is_primary_offer = null,
            is_pbc = null,
            is_internship = null,
            is_offcampus = null
        } = params;

        const offset = (page - 1) * limit;
        
        const allowedSortFields = ['offer_id', 'student_id', 'job_id', 'offered_at', 'offer_ctc', 'offer_stipend'];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'offer_id';
        const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        let countQuery = `
            SELECT COUNT(*) as total 
            FROM student_offers so
            JOIN students s ON so.student_id = s.student_id
            LEFT JOIN jobs j ON so.job_id = j.job_id
            LEFT JOIN companies c ON j.company_id = c.company_id
        `;
        let dataQuery = `
            SELECT so.*, 
                   s.full_name as student_name, 
                   s.email as student_email,
                   COALESCE(j.job_title, so.offcampus_job_title) as job_title, 
                   COALESCE(c.company_name, so.offcampus_company_name) as company_name
            FROM student_offers so
            JOIN students s ON so.student_id = s.student_id
            LEFT JOIN jobs j ON so.job_id = j.job_id
            LEFT JOIN companies c ON j.company_id = c.company_id
        `;
        let conditions = [];
        let queryParams = [];
        let paramIndex = 1;

        // Apply filters
        if (student_id) {
            conditions.push(`so.student_id = $${paramIndex}`);
            queryParams.push(student_id);
            paramIndex++;
        }
        if (job_id) {
            conditions.push(`so.job_id = $${paramIndex}`);
            queryParams.push(job_id);
            paramIndex++;
        }
        if (is_primary_offer !== null) {
            conditions.push(`so.is_primary_offer = $${paramIndex}`);
            queryParams.push(is_primary_offer);
            paramIndex++;
        }
        if (is_pbc !== null) {
            conditions.push(`so.is_pbc = $${paramIndex}`);
            queryParams.push(is_pbc);
            paramIndex++;
        }
        if (is_internship !== null) {
            conditions.push(`so.is_internship = $${paramIndex}`);
            queryParams.push(is_internship);
            paramIndex++;
        }
        if (is_offcampus !== null) {
            conditions.push(`so.is_offcampus = $${paramIndex}`);
            queryParams.push(is_offcampus);
            paramIndex++;
        }

        if (conditions.length > 0) {
            const whereClause = ` WHERE ${conditions.join(' AND ')}`;
            countQuery += whereClause;
            dataQuery += whereClause;
        }

        const countResult = await pool.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].total);

        dataQuery += ` ORDER BY so.${safeSortBy} ${safeSortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const dataResult = await pool.query(dataQuery, queryParams);
        const totalPages = Math.ceil(total / limit);

        logger.info(`getAllStudentOffers: Retrieved ${dataResult.rows.length} offers`);

        return {
            success: true,
            data: {
                offers: dataResult.rows,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: totalPages,
                    total_count: total,
                    limit: parseInt(limit),
                    has_next: page < totalPages,
                    has_prev: page > 1
                }
            },
            message: 'Student offers retrieved successfully'
        };
    } catch (error) {
        logger.error(`getAllStudentOffers: ${error.message}`, {
            stack: error.stack,
            params
        });
        throw error;
    }
};

// Get student offer by ID
export const getStudentOfferById = async (offerId) => {
    try {
        logger.info(`getStudentOfferById: Fetching offer with ID ${offerId}`);
        
        const selectQuery = `
            SELECT so.*, 
                   s.full_name as student_name, 
                   s.email as student_email,
                   COALESCE(j.job_title, so.offcampus_job_title) as job_title, 
                   COALESCE(c.company_name, so.offcampus_company_name) as company_name
            FROM student_offers so
            JOIN students s ON so.student_id = s.student_id
            LEFT JOIN jobs j ON so.job_id = j.job_id
            LEFT JOIN companies c ON j.company_id = c.company_id
            WHERE so.offer_id = $1
        `;
        const result = await pool.query(selectQuery, [offerId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Student offer not found'
            };
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'Student offer fetched successfully'
        };
    } catch (error) {
        logger.error(`getStudentOfferById: ${error.message}`, {
            stack: error.stack,
            offerId
        });
        throw error;
    }
};

// Get offers by student ID
export const getOffersByStudentId = async (studentId, params = {}) => {
    try {
        logger.info(`getOffersByStudentId: Fetching offers for student ${studentId}`);
        return await getAllStudentOffers({ ...params, student_id: studentId });
    } catch (error) {
        logger.error(`getOffersByStudentId: ${error.message}`, {
            stack: error.stack,
            studentId
        });
        throw error;
    }
};

// Get offers by job ID
export const getOffersByJobId = async (jobId, params = {}) => {
    try {
        logger.info(`getOffersByJobId: Fetching offers for job ${jobId}`);
        return await getAllStudentOffers({ ...params, job_id: jobId });
    } catch (error) {
        logger.error(`getOffersByJobId: ${error.message}`, {
            stack: error.stack,
            jobId
        });
        throw error;
    }
};

// Update student offer by ID
export const updateStudentOffer = async (offerId, offer) => {
    const client = await pool.connect();
    try {
        logger.info(`updateStudentOffer: Updating offer with ID ${offerId}`);
        await client.query('BEGIN');

        // Check if offer exists
        const checkExistQuery = `SELECT offer_id FROM student_offers WHERE offer_id = $1`;
        const existResult = await client.query(checkExistQuery, [offerId]);
        
        if (existResult.rows.length === 0) {
            throw new Error('Student offer not found');
        }

        const updateQuery = `
            UPDATE student_offers SET
                is_primary_offer = COALESCE($1, is_primary_offer),
                is_pbc = COALESCE($2, is_pbc),
                is_internship = COALESCE($3, is_internship),
                offcampus_company_name = COALESCE($4, offcampus_company_name),
                offcampus_job_title = COALESCE($5, offcampus_job_title),
                offcampus_location = COALESCE($6, offcampus_location),
                offer_ctc = COALESCE($7, offer_ctc),
                offer_stipend = COALESCE($8, offer_stipend),
                remarks = COALESCE($9, remarks)
            WHERE offer_id = $10
            RETURNING *
        `;

        const values = [
            offer.is_primary_offer,
            offer.is_pbc,
            offer.is_internship,
            offer.offcampus_company_name,
            offer.offcampus_job_title,
            offer.offcampus_location,
            offer.offer_ctc,
            offer.offer_stipend,
            offer.remarks,
            offerId
        ];

        const result = await client.query(updateQuery, values);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student offer updated successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`updateStudentOffer: ${error.message}`, {
            stack: error.stack,
            offerId,
            offer
        });
        throw error;
    } finally {
        client.release();
    }
};

// Delete student offer by ID
export const deleteStudentOffer = async (offerId) => {
    const client = await pool.connect();
    try {
        logger.info(`deleteStudentOffer: Deleting offer with ID ${offerId}`);
        await client.query('BEGIN');

        const checkQuery = `SELECT offer_id FROM student_offers WHERE offer_id = $1`;
        const checkResult = await client.query(checkQuery, [offerId]);
        
        if (checkResult.rows.length === 0) {
            throw new Error('Student offer not found');
        }

        const deleteQuery = `DELETE FROM student_offers WHERE offer_id = $1 RETURNING *`;
        const result = await client.query(deleteQuery, [offerId]);
        
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student offer deleted successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`deleteStudentOffer: ${error.message}`, {
            stack: error.stack,
            offerId
        });
        throw error;
    } finally {
        client.release();
    }
};
