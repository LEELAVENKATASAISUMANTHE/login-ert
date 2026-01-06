import logger from '../utils/logger.js';
import pool from './connection.js';

// Create a new student family record
export const createStudentFamily = async (family) => {
    const client = await pool.connect();

    try {
        logger.info('createStudentFamily: Creating a new student family record');
        await client.query('BEGIN');

        const insertQuery = `
            INSERT INTO student_family (
                student_id,
                father_name,
                father_occupation,
                father_phone,
                mother_name,
                mother_occupation,
                mother_phone,
                blood_group
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;

        const values = [
            family.student_id,
            family.father_name || null,
            family.father_occupation || null,
            family.father_phone || null,
            family.mother_name || null,
            family.mother_occupation || null,
            family.mother_phone || null,
            family.blood_group || null
        ];

        const result = await client.query(insertQuery, values);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student family record created successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`createStudentFamily: ${error.message}`, {
            stack: error.stack,
            family
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get all student family records
export const getAllStudentFamilies = async () => {
    const client = await pool.connect();

    try {
        logger.info('getAllStudentFamilies: Fetching all student family records');

        const selectQuery = `
            SELECT 
                sf.*,
                s.full_name as student_name
            FROM student_family sf
            LEFT JOIN students s ON sf.student_id = s.student_id
            ORDER BY sf.student_id
        `;

        const result = await client.query(selectQuery);

        return {
            success: true,
            data: result.rows,
            message: 'Student family records fetched successfully',
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getAllStudentFamilies: ${error.message}`, {
            stack: error.stack
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get student family by student ID
export const getStudentFamilyById = async (studentId) => {
    const client = await pool.connect();

    try {
        logger.info('getStudentFamilyById: Fetching student family by student ID', { studentId });

        const selectQuery = `
            SELECT 
                sf.*,
                s.full_name as student_name
            FROM student_family sf
            LEFT JOIN students s ON sf.student_id = s.student_id
            WHERE sf.student_id = $1
        `;

        const result = await client.query(selectQuery, [studentId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                message: 'Student family record not found'
            };
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'Student family record fetched successfully'
        };
    } catch (error) {
        logger.error(`getStudentFamilyById: ${error.message}`, {
            stack: error.stack,
            studentId
        });
        throw error;
    } finally {
        client.release();
    }
};

// Update student family by student ID
export const updateStudentFamilyById = async (studentId, family) => {
    const client = await pool.connect();

    try {
        logger.info('updateStudentFamilyById: Updating student family', { studentId });
        await client.query('BEGIN');

        const updateQuery = `
            UPDATE student_family
            SET 
                father_name = $1,
                father_occupation = $2,
                father_phone = $3,
                mother_name = $4,
                mother_occupation = $5,
                mother_phone = $6,
                blood_group = $7
            WHERE student_id = $8
            RETURNING *
        `;

        const values = [
            family.father_name || null,
            family.father_occupation || null,
            family.father_phone || null,
            family.mother_name || null,
            family.mother_occupation || null,
            family.mother_phone || null,
            family.blood_group || null,
            studentId
        ];

        const result = await client.query(updateQuery, values);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return {
                success: false,
                message: 'Student family record not found'
            };
        }

        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student family record updated successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`updateStudentFamilyById: ${error.message}`, {
            stack: error.stack,
            studentId,
            family
        });
        throw error;
    } finally {
        client.release();
    }
};

// Delete student family by student ID
export const deleteStudentFamilyById = async (studentId) => {
    const client = await pool.connect();

    try {
        logger.info('deleteStudentFamilyById: Deleting student family', { studentId });
        await client.query('BEGIN');

        const deleteQuery = `
            DELETE FROM student_family
            WHERE student_id = $1
            RETURNING *
        `;

        const result = await client.query(deleteQuery, [studentId]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return {
                success: false,
                message: 'Student family record not found'
            };
        }

        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student family record deleted successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`deleteStudentFamilyById: ${error.message}`, {
            stack: error.stack,
            studentId
        });
        throw error;
    } finally {
        client.release();
    }
};

// Bulk insert student family records (for Excel import)
export const bulkInsertStudentFamilies = async (families) => {
    const client = await pool.connect();

    try {
        logger.info('bulkInsertStudentFamilies: Bulk inserting student family records', {
            count: families.length
        });
        await client.query('BEGIN');

        const results = {
            successful: [],
            failed: []
        };

        for (let i = 0; i < families.length; i++) {
            const family = families[i];
            const rowNumber = i + 2;

            try {
                const insertQuery = `
                    INSERT INTO student_family (
                        student_id,
                        father_name,
                        father_occupation,
                        father_phone,
                        mother_name,
                        mother_occupation,
                        mother_phone,
                        blood_group
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING *
                `;

                const values = [
                    family.student_id,
                    family.father_name || null,
                    family.father_occupation || null,
                    family.father_phone || null,
                    family.mother_name || null,
                    family.mother_occupation || null,
                    family.mother_phone || null,
                    family.blood_group || null
                ];

                const result = await client.query(insertQuery, values);
                results.successful.push({
                    row: rowNumber,
                    data: result.rows[0]
                });
            } catch (rowError) {
                results.failed.push({
                    row: rowNumber,
                    data: family,
                    error: rowError.message,
                    code: rowError.code
                });
            }
        }

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
        logger.error(`bulkInsertStudentFamilies: ${error.message}`, {
            stack: error.stack
        });
        throw error;
    } finally {
        client.release();
    }
};
