import logger from '../utils/logger.js';
import pool from './connection.js';

// Create a new student internship record
export const createStudentInternship = async (internship) => {
    const client = await pool.connect();

    try {
        logger.info('createStudentInternship: Creating a new student internship record');
        await client.query('BEGIN');

        const insertQuery = `
            INSERT INTO student_internships (
                student_id,
                organization,
                skills_acquired,
                duration,
                start_date,
                end_date,
                description,
                stipend
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;

        const values = [
            internship.student_id,
            internship.organization || null,
            internship.skills_acquired || null,
            internship.duration || null,
            internship.start_date || null,
            internship.end_date || null,
            internship.description || null,
            internship.stipend || null
        ];

        const result = await client.query(insertQuery, values);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student internship created successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`createStudentInternship: ${error.message}`, {
            stack: error.stack,
            internship
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get all student internships
export const getAllStudentInternships = async () => {
    const client = await pool.connect();

    try {
        logger.info('getAllStudentInternships: Fetching all student internships');

        const selectQuery = `
            SELECT 
                si.*,
                s.full_name as student_name
            FROM student_internships si
            LEFT JOIN students s ON si.student_id = s.student_id
            ORDER BY si.internship_id DESC
        `;

        const result = await client.query(selectQuery);

        return {
            success: true,
            data: result.rows,
            message: 'Student internships fetched successfully',
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getAllStudentInternships: ${error.message}`, {
            stack: error.stack
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get student internship by ID
export const getStudentInternshipById = async (internshipId) => {
    const client = await pool.connect();

    try {
        logger.info('getStudentInternshipById: Fetching student internship by ID', { internshipId });

        const selectQuery = `
            SELECT 
                si.*,
                s.full_name as student_name
            FROM student_internships si
            LEFT JOIN students s ON si.student_id = s.student_id
            WHERE si.internship_id = $1
        `;

        const result = await client.query(selectQuery, [internshipId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                message: 'Student internship not found'
            };
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'Student internship fetched successfully'
        };
    } catch (error) {
        logger.error(`getStudentInternshipById: ${error.message}`, {
            stack: error.stack,
            internshipId
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get all internships for a specific student
export const getInternshipsByStudentId = async (studentId) => {
    const client = await pool.connect();

    try {
        logger.info('getInternshipsByStudentId: Fetching internships for student', { studentId });

        const selectQuery = `
            SELECT 
                si.*,
                s.full_name as student_name
            FROM student_internships si
            LEFT JOIN students s ON si.student_id = s.student_id
            WHERE si.student_id = $1
            ORDER BY si.start_date DESC
        `;

        const result = await client.query(selectQuery, [studentId]);

        return {
            success: true,
            data: result.rows,
            message: 'Student internships fetched successfully',
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getInternshipsByStudentId: ${error.message}`, {
            stack: error.stack,
            studentId
        });
        throw error;
    } finally {
        client.release();
    }
};

// Update student internship by ID
export const updateStudentInternshipById = async (internshipId, internship) => {
    const client = await pool.connect();

    try {
        logger.info('updateStudentInternshipById: Updating student internship', { internshipId });
        await client.query('BEGIN');

        const updateQuery = `
            UPDATE student_internships
            SET 
                student_id = $1,
                organization = $2,
                skills_acquired = $3,
                duration = $4,
                start_date = $5,
                end_date = $6,
                description = $7,
                stipend = $8
            WHERE internship_id = $9
            RETURNING *
        `;

        const values = [
            internship.student_id,
            internship.organization || null,
            internship.skills_acquired || null,
            internship.duration || null,
            internship.start_date || null,
            internship.end_date || null,
            internship.description || null,
            internship.stipend || null,
            internshipId
        ];

        const result = await client.query(updateQuery, values);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return {
                success: false,
                message: 'Student internship not found'
            };
        }

        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student internship updated successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`updateStudentInternshipById: ${error.message}`, {
            stack: error.stack,
            internshipId,
            internship
        });
        throw error;
    } finally {
        client.release();
    }
};

// Delete student internship by ID
export const deleteStudentInternshipById = async (internshipId) => {
    const client = await pool.connect();

    try {
        logger.info('deleteStudentInternshipById: Deleting student internship', { internshipId });
        await client.query('BEGIN');

        const deleteQuery = `
            DELETE FROM student_internships
            WHERE internship_id = $1
            RETURNING *
        `;

        const result = await client.query(deleteQuery, [internshipId]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return {
                success: false,
                message: 'Student internship not found'
            };
        }

        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student internship deleted successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`deleteStudentInternshipById: ${error.message}`, {
            stack: error.stack,
            internshipId
        });
        throw error;
    } finally {
        client.release();
    }
};

// Bulk insert student internships (for Excel import)
export const bulkInsertStudentInternships = async (internships) => {
    const client = await pool.connect();

    try {
        logger.info('bulkInsertStudentInternships: Bulk inserting student internships', {
            count: internships.length
        });
        await client.query('BEGIN');

        const results = {
            successful: [],
            failed: []
        };

        for (let i = 0; i < internships.length; i++) {
            const internship = internships[i];
            const rowNumber = i + 2; // +2 because Excel row 1 is header, data starts at row 2

            try {
                const insertQuery = `
                    INSERT INTO student_internships (
                        student_id,
                        organization,
                        skills_acquired,
                        duration,
                        start_date,
                        end_date,
                        description,
                        stipend
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING *
                `;

                const values = [
                    internship.student_id,
                    internship.organization || null,
                    internship.skills_acquired || null,
                    internship.duration || null,
                    internship.start_date || null,
                    internship.end_date || null,
                    internship.description || null,
                    internship.stipend || null
                ];

                const result = await client.query(insertQuery, values);
                results.successful.push({
                    row: rowNumber,
                    data: result.rows[0]
                });
            } catch (rowError) {
                results.failed.push({
                    row: rowNumber,
                    data: internship,
                    error: rowError.message,
                    code: rowError.code
                });
            }
        }

        // If all failed, rollback
        if (results.successful.length === 0 && results.failed.length > 0) {
            await client.query('ROLLBACK');
            return {
                success: false,
                message: 'All records failed to insert',
                results
            };
        }

        await client.query('COMMIT');

        return {
            success: true,
            message: `Imported ${results.successful.length} records, ${results.failed.length} failed`,
            results
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`bulkInsertStudentInternships: ${error.message}`, {
            stack: error.stack
        });
        throw error;
    } finally {
        client.release();
    }
};
