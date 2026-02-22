import logger from '../utils/logger.js';
import pool from './connection.js';

// Get students menu for dropdowns
export const getStudentsMenu = async (searchParams = {}) => {
    const client = await pool.connect();
    try {
        logger.info('getStudentsMenu (academics): Fetching students menu list', { searchParams });
        
        const { search, searchField } = searchParams;
        const values = [];
        let whereClause = '';
        
        if (search && search.trim() !== '') {
            const searchValue = `%${search.trim()}%`;
            
            if (searchField === 'student_id') {
                whereClause = 'WHERE s.student_id ILIKE $1';
                values.push(searchValue);
            } else if (searchField === 'full_name') {
                whereClause = 'WHERE s.full_name ILIKE $1';
                values.push(searchValue);
            } else {
                whereClause = `WHERE s.student_id ILIKE $1 OR s.full_name ILIKE $1`;
                values.push(searchValue);
            }
        }
        
        const selectQuery = `
            SELECT 
                sa.student_id,
                s.full_name
            FROM students s
            LEFT JOIN student_academics sa ON s.student_id = sa.student_id
            ${whereClause}
            ORDER BY s.full_name ASC
        `;
        
        const result = await client.query(selectQuery, values);

        return {
            success: true,
            data: result.rows,
            message: 'Students menu fetched successfully',
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getStudentsMenu (academics): ${error.message}`, {
            stack: error.stack
        });
        throw error;
    } finally {
        client.release();
    }
};

// Create a new student academic record
export const createStudentAcademic = async (academic) => {
    const client = await pool.connect();

    try {
        logger.info('createStudentAcademic: Creating a new student academic record');
        await client.query('BEGIN');

        const insertQuery = `
            INSERT INTO student_academics (
                student_id,
                tenth_percent,
                tenth_year,
                tenth_board,
                tenth_school,
                twelfth_percent,
                twelfth_year,
                twelfth_board,
                twelfth_college,
                diploma_percent,
                diploma_year,
                diploma_college,
                ug_cgpa,
                ug_year_of_passing,
                pg_cgpa,
                history_of_backs,
                updated_arrears,
                gap_years,
                cet_rank,
                comedk_rank,
                category
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
            )
            RETURNING *
        `;

        const values = [
            academic.student_id,
            academic.tenth_percent || null,
            academic.tenth_year || null,
            academic.tenth_board || null,
            academic.tenth_school || null,
            academic.twelfth_percent || null,
            academic.twelfth_year || null,
            academic.twelfth_board || null,
            academic.twelfth_college || null,
            academic.diploma_percent || null,
            academic.diploma_year || null,
            academic.diploma_college || null,
            academic.ug_cgpa || null,
            academic.ug_year_of_passing || null,
            academic.pg_cgpa || null,
            academic.history_of_backs || null,
            academic.updated_arrears || null,
            academic.gap_years || null,
            academic.cet_rank || null,
            academic.comedk_rank || null,
            academic.category || null
        ];

        const result = await client.query(insertQuery, values);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student academic record created successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`createStudentAcademic: ${error.message}`, {
            stack: error.stack,
            academic
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get student academic by student ID (primary key)
export const getStudentAcademicById = async (studentId) => {
    try {
        logger.info(`getStudentAcademicById: Fetching student academic with student_id ${studentId}`);
        const selectQuery = `SELECT * FROM student_academics WHERE student_id = $1`;
        const result = await pool.query(selectQuery, [studentId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Student academic record not found'
            };
        }
        return {
            success: true,
            data: result.rows[0],
            message: 'Student academic record fetched successfully'
        };
    } catch (error) {
        logger.error(`getStudentAcademicById: ${error.message}`, {
            stack: error.stack,
            studentId
        });
        throw error;
    }
};

// Get all student academics
export const getAllStudentAcademics = async () => {
    try {
        logger.info('getAllStudentAcademics: Fetching all student academic records');

        const selectQuery = `
            SELECT
                sa.student_id,
                sa.tenth_percent,
                sa.tenth_year,
                sa.tenth_board,
                sa.tenth_school,
                sa.twelfth_percent,
                sa.twelfth_year,
                sa.twelfth_board,
                sa.twelfth_college,
                sa.diploma_percent,
                sa.diploma_year,
                sa.diploma_college,
                sa.ug_cgpa,
                sa.ug_year_of_passing,
                sa.pg_cgpa,
                sa.history_of_backs,
                sa.updated_arrears,
                sa.gap_years,
                sa.cet_rank,
                sa.comedk_rank,
                sa.category,
                s.full_name
            FROM student_academics sa
            LEFT JOIN students s ON sa.student_id = s.student_id
            ORDER BY sa.student_id ASC
        `;

        const result = await pool.query(selectQuery);

        return {
            success: true,
            data: result.rows,
            message: 'All student academic records fetched successfully',
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getAllStudentAcademics: ${error.message}`, {
            stack: error.stack
        });
        throw error;
    }
};

// Update student academic (full update)
export const updateStudentAcademicById = async (studentId, academic) => {
    const client = await pool.connect();
    try {
        logger.info(`updateStudentAcademicById: Updating student academic with student_id ${studentId}`);
        await client.query('BEGIN');

        const updateQuery = `
            UPDATE student_academics SET
                tenth_percent = $2,
                tenth_year = $3,
                tenth_board = $4,
                tenth_school = $5,
                twelfth_percent = $6,
                twelfth_year = $7,
                twelfth_board = $8,
                twelfth_college = $9,
                diploma_percent = $10,
                diploma_year = $11,
                diploma_college = $12,
                ug_cgpa = $13,
                ug_year_of_passing = $14,
                pg_cgpa = $15,
                history_of_backs = $16,
                updated_arrears = $17,
                gap_years = $18,
                cet_rank = $19,
                comedk_rank = $20,
                category = $21
            WHERE student_id = $1
            RETURNING *
        `;

        const values = [
            studentId,
            academic.tenth_percent || null,
            academic.tenth_year || null,
            academic.tenth_board || null,
            academic.tenth_school || null,
            academic.twelfth_percent || null,
            academic.twelfth_year || null,
            academic.twelfth_board || null,
            academic.twelfth_college || null,
            academic.diploma_percent || null,
            academic.diploma_year || null,
            academic.diploma_college || null,
            academic.ug_cgpa || null,
            academic.ug_year_of_passing || null,
            academic.pg_cgpa || null,
            academic.history_of_backs || null,
            academic.updated_arrears || null,
            academic.gap_years || null,
            academic.cet_rank || null,
            academic.comedk_rank || null,
            academic.category || null
        ];

        const result = await client.query(updateQuery, values);
        await client.query('COMMIT');

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Student academic record not found'
            };
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'Student academic record updated successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`updateStudentAcademicById: ${error.message}`, {
            stack: error.stack,
            studentId,
            academic
        });
        throw error;
    } finally {
        client.release();
    }
};

// Patch student academic (partial update)
export const patchStudentAcademicById = async (studentId, updates) => {
    const client = await pool.connect();
    try {
        logger.info(`patchStudentAcademicById: Patching student academic with student_id ${studentId}`);
        await client.query('BEGIN');

        // Build dynamic update query based on provided fields
        const allowedFields = [
            'tenth_percent', 'tenth_year', 'tenth_board', 'tenth_school',
            'twelfth_percent', 'twelfth_year', 'twelfth_board', 'twelfth_college',
            'diploma_percent', 'diploma_year', 'diploma_college',
            'ug_cgpa', 'ug_year_of_passing', 'pg_cgpa',
            'history_of_backs', 'updated_arrears', 'gap_years',
            'cet_rank', 'comedk_rank', 'category'
        ];

        const updateFields = [];
        const values = [studentId];
        let paramCount = 1;

        for (const field of allowedFields) {
            if (updates.hasOwnProperty(field)) {
                paramCount++;
                updateFields.push(`${field} = $${paramCount}`);
                values.push(updates[field]);
            }
        }

        if (updateFields.length === 0) {
            return {
                success: false,
                data: null,
                message: 'No valid fields provided for update'
            };
        }

        const updateQuery = `
            UPDATE student_academics 
            SET ${updateFields.join(', ')}
            WHERE student_id = $1
            RETURNING *
        `;

        const result = await client.query(updateQuery, values);
        await client.query('COMMIT');

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Student academic record not found'
            };
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'Student academic record patched successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`patchStudentAcademicById: ${error.message}`, {
            stack: error.stack,
            studentId,
            updates
        });
        throw error;
    } finally {
        client.release();
    }
};

// Delete student academic
export const deleteStudentAcademicById = async (studentId) => {
    const client = await pool.connect();
    try {
        logger.info(`deleteStudentAcademicById: Deleting student academic with student_id ${studentId}`);
        await client.query('BEGIN');

        const deleteQuery = `DELETE FROM student_academics WHERE student_id = $1 RETURNING *`;
        const result = await client.query(deleteQuery, [studentId]);
        await client.query('COMMIT');

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Student academic record not found'
            };
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'Student academic record deleted successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`deleteStudentAcademicById: ${error.message}`, {
            stack: error.stack,
            studentId
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get academics by category
export const getAcademicsByCategory = async (category) => {
    try {
        logger.info(`getAcademicsByCategory: Fetching academics for category ${category}`);

        const selectQuery = `
            SELECT sa.*, s.full_name
            FROM student_academics sa
            LEFT JOIN students s ON sa.student_id = s.student_id
            WHERE sa.category = $1
            ORDER BY sa.student_id ASC
        `;

        const result = await pool.query(selectQuery, [category]);

        return {
            success: true,
            data: result.rows,
            message: `Academic records for category ${category} fetched successfully`,
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getAcademicsByCategory: ${error.message}`, {
            stack: error.stack,
            category
        });
        throw error;
    }
};

// Get academics with filters
export const getAcademicsWithFilters = async (filters = {}) => {
    try {
        logger.info('getAcademicsWithFilters: Fetching academics with filters', { filters });

        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (filters.minTenthPercent) {
            paramCount++;
            conditions.push(`sa.tenth_percent >= $${paramCount}`);
            values.push(filters.minTenthPercent);
        }

        if (filters.minTwelfthPercent) {
            paramCount++;
            conditions.push(`sa.twelfth_percent >= $${paramCount}`);
            values.push(filters.minTwelfthPercent);
        }

        if (filters.minUgCgpa) {
            paramCount++;
            conditions.push(`sa.ug_cgpa >= $${paramCount}`);
            values.push(filters.minUgCgpa);
        }

        if (filters.category) {
            paramCount++;
            conditions.push(`sa.category = $${paramCount}`);
            values.push(filters.category);
        }

        if (filters.maxHistoryOfBacks !== undefined) {
            paramCount++;
            conditions.push(`sa.history_of_backs <= $${paramCount}`);
            values.push(filters.maxHistoryOfBacks);
        }

        if (filters.ugYearOfPassing) {
            paramCount++;
            conditions.push(`sa.ug_year_of_passing = $${paramCount}`);
            values.push(filters.ugYearOfPassing);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const selectQuery = `
            SELECT sa.*, s.full_name
            FROM student_academics sa
            LEFT JOIN students s ON sa.student_id = s.student_id
            ${whereClause}
            ORDER BY sa.student_id ASC
        `;

        const result = await pool.query(selectQuery, values);

        return {
            success: true,
            data: result.rows,
            message: 'Filtered academic records fetched successfully',
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getAcademicsWithFilters: ${error.message}`, {
            stack: error.stack,
            filters
        });
        throw error;
    }
};
