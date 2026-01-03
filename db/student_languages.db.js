import logger from '../utils/logger.js';
import pool from './connection.js';

// Allowed programming languages
export const ALLOWED_LANGUAGES = [
    "Python", "JavaScript", "Java", "C#", "SQL",
    "C++", "C", "TypeScript", "Rust", "Go",
    "Swift", "Kotlin", "PHP", "Ruby", "Dart",
    "R", "MATLAB", "Scala", "Julia", "COBOL"
];

// Create single language entry
export const createStudentLanguage = async (data) => {
    const client = await pool.connect();
    try {
        logger.info('createStudentLanguage: Creating new language record');
        await client.query('BEGIN');

        const insertQuery = `
            INSERT INTO student_languages (student_id, language, level)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const values = [data.student_id, data.language, data.level.toString()];
        const result = await client.query(insertQuery, values);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Language added successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`createStudentLanguage: ${error.message}`, { stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
};

// Bulk insert languages for a student
export const bulkCreateStudentLanguages = async (studentId, languages) => {
    const client = await pool.connect();
    try {
        logger.info('bulkCreateStudentLanguages: Bulk inserting languages', { studentId, count: Object.keys(languages).length });
        await client.query('BEGIN');

        const insertedRecords = [];
        
        for (const [language, level] of Object.entries(languages)) {
            const insertQuery = `
                INSERT INTO student_languages (student_id, language, level)
                VALUES ($1, $2, $3)
                ON CONFLICT (student_id, language) DO UPDATE SET level = $3
                RETURNING *
            `;
            const result = await client.query(insertQuery, [studentId, language, level.toString()]);
            insertedRecords.push(result.rows[0]);
        }

        await client.query('COMMIT');

        return {
            success: true,
            data: insertedRecords,
            message: `${insertedRecords.length} languages added successfully`,
            count: insertedRecords.length
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`bulkCreateStudentLanguages: ${error.message}`, { stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
};

// Get all student languages
export const getAllStudentLanguages = async () => {
    const client = await pool.connect();
    try {
        logger.info('getAllStudentLanguages: Fetching all records');

        const selectQuery = `
            SELECT sl.*, s.full_name, s.first_name, s.last_name
            FROM student_languages sl
            LEFT JOIN students s ON sl.student_id = s.student_id
            ORDER BY sl.lang_id DESC
        `;

        const result = await client.query(selectQuery);

        return {
            success: true,
            data: result.rows,
            message: 'Languages fetched successfully',
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getAllStudentLanguages: ${error.message}`, { stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
};

// Get by lang_id
export const getStudentLanguageById = async (langId) => {
    const client = await pool.connect();
    try {
        logger.info(`getStudentLanguageById: Fetching lang_id ${langId}`);

        const selectQuery = `
            SELECT sl.*, s.full_name
            FROM student_languages sl
            LEFT JOIN students s ON sl.student_id = s.student_id
            WHERE sl.lang_id = $1
        `;

        const result = await client.query(selectQuery, [langId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Language record not found'
            };
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'Language record fetched successfully'
        };
    } catch (error) {
        logger.error(`getStudentLanguageById: ${error.message}`, { stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
};

// Get all languages for a student
export const getLanguagesByStudentId = async (studentId) => {
    const client = await pool.connect();
    try {
        logger.info(`getLanguagesByStudentId: Fetching languages for student ${studentId}`);

        const selectQuery = `
            SELECT sl.*, s.full_name
            FROM student_languages sl
            LEFT JOIN students s ON sl.student_id = s.student_id
            WHERE sl.student_id = $1
            ORDER BY CAST(sl.level AS INTEGER) DESC
        `;

        const result = await client.query(selectQuery, [studentId]);

        return {
            success: true,
            data: result.rows,
            message: 'Student languages fetched successfully',
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getLanguagesByStudentId: ${error.message}`, { stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
};

// Get student's top languages (level >= 7)
export const getStudentTopLanguages = async (studentId, minLevel = 7) => {
    const client = await pool.connect();
    try {
        logger.info(`getStudentTopLanguages: Fetching top languages for student ${studentId}`);

        const selectQuery = `
            SELECT sl.*, s.full_name
            FROM student_languages sl
            LEFT JOIN students s ON sl.student_id = s.student_id
            WHERE sl.student_id = $1 AND CAST(sl.level AS INTEGER) >= $2
            ORDER BY CAST(sl.level AS INTEGER) DESC
        `;

        const result = await client.query(selectQuery, [studentId, minLevel]);

        return {
            success: true,
            data: result.rows,
            message: 'Top languages fetched successfully',
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getStudentTopLanguages: ${error.message}`, { stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
};

// Get all students who know a specific language
export const getStudentsByLanguage = async (language) => {
    const client = await pool.connect();
    try {
        logger.info(`getStudentsByLanguage: Fetching students who know ${language}`);

        const selectQuery = `
            SELECT sl.*, s.full_name, s.email
            FROM student_languages sl
            LEFT JOIN students s ON sl.student_id = s.student_id
            WHERE LOWER(sl.language) = LOWER($1)
            ORDER BY CAST(sl.level AS INTEGER) DESC
        `;

        const result = await client.query(selectQuery, [language]);

        return {
            success: true,
            data: result.rows,
            message: `Students with ${language} fetched successfully`,
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getStudentsByLanguage: ${error.message}`, { stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
};

// Get experts in a language (level >= 7)
export const getLanguageExperts = async (language, minLevel = 7) => {
    const client = await pool.connect();
    try {
        logger.info(`getLanguageExperts: Fetching experts in ${language} with level >= ${minLevel}`);

        const selectQuery = `
            SELECT sl.*, s.full_name, s.email
            FROM student_languages sl
            LEFT JOIN students s ON sl.student_id = s.student_id
            WHERE LOWER(sl.language) = LOWER($1) AND CAST(sl.level AS INTEGER) >= $2
            ORDER BY CAST(sl.level AS INTEGER) DESC
        `;

        const result = await client.query(selectQuery, [language, minLevel]);

        return {
            success: true,
            data: result.rows,
            message: `Experts in ${language} fetched successfully`,
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getLanguageExperts: ${error.message}`, { stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
};

// Get proficient students (above threshold)
export const getProficientStudents = async (minLevel = 7) => {
    const client = await pool.connect();
    try {
        logger.info(`getProficientStudents: Fetching students with level >= ${minLevel}`);

        const selectQuery = `
            SELECT sl.*, s.full_name, s.email
            FROM student_languages sl
            LEFT JOIN students s ON sl.student_id = s.student_id
            WHERE CAST(sl.level AS INTEGER) >= $1
            ORDER BY CAST(sl.level AS INTEGER) DESC, sl.language ASC
        `;

        const result = await client.query(selectQuery, [minLevel]);

        return {
            success: true,
            data: result.rows,
            message: 'Proficient students fetched successfully',
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getProficientStudents: ${error.message}`, { stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
};

// Advanced search
export const searchStudentLanguages = async (searchParams) => {
    const client = await pool.connect();
    try {
        logger.info('searchStudentLanguages: Performing advanced search', { searchParams });

        const { language, minLevel, maxLevel, studentId, search } = searchParams;
        const conditions = [];
        const values = [];
        let paramIndex = 1;

        if (language) {
            conditions.push(`LOWER(sl.language) = LOWER($${paramIndex})`);
            values.push(language);
            paramIndex++;
        }

        if (minLevel) {
            conditions.push(`CAST(sl.level AS INTEGER) >= $${paramIndex}`);
            values.push(parseInt(minLevel));
            paramIndex++;
        }

        if (maxLevel) {
            conditions.push(`CAST(sl.level AS INTEGER) <= $${paramIndex}`);
            values.push(parseInt(maxLevel));
            paramIndex++;
        }

        if (studentId) {
            conditions.push(`sl.student_id = $${paramIndex}`);
            values.push(studentId);
            paramIndex++;
        }

        if (search) {
            conditions.push(`(s.full_name ILIKE $${paramIndex} OR sl.language ILIKE $${paramIndex} OR sl.student_id ILIKE $${paramIndex})`);
            values.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const selectQuery = `
            SELECT sl.*, s.full_name, s.email
            FROM student_languages sl
            LEFT JOIN students s ON sl.student_id = s.student_id
            ${whereClause}
            ORDER BY CAST(sl.level AS INTEGER) DESC, sl.language ASC
        `;

        const result = await client.query(selectQuery, values);

        return {
            success: true,
            data: result.rows,
            message: 'Search results fetched successfully',
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`searchStudentLanguages: ${error.message}`, { stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
};

// Menu for search bar
export const getStudentLanguagesMenu = async (searchParams = {}) => {
    const client = await pool.connect();
    try {
        logger.info('getStudentLanguagesMenu: Fetching menu', { searchParams });

        const { search, searchField } = searchParams;
        const values = [];
        let whereClause = '';

        if (search && search.trim() !== '') {
            const searchValue = `%${search.trim()}%`;

            if (searchField === 'student_id') {
                whereClause = 'WHERE sl.student_id ILIKE $1';
                values.push(searchValue);
            } else if (searchField === 'full_name') {
                whereClause = 'WHERE s.full_name ILIKE $1';
                values.push(searchValue);
            } else if (searchField === 'language') {
                whereClause = 'WHERE sl.language ILIKE $1';
                values.push(searchValue);
            } else {
                whereClause = `WHERE sl.student_id ILIKE $1 OR s.full_name ILIKE $1 OR sl.language ILIKE $1`;
                values.push(searchValue);
            }
        }

        const selectQuery = `
            SELECT sl.lang_id, sl.student_id, s.full_name, sl.language, sl.level
            FROM student_languages sl
            LEFT JOIN students s ON sl.student_id = s.student_id
            ${whereClause}
            ORDER BY s.full_name ASC, sl.language ASC
        `;

        const result = await client.query(selectQuery, values);

        return {
            success: true,
            data: result.rows,
            message: 'Menu fetched successfully',
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getStudentLanguagesMenu: ${error.message}`, { stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
};

// Update by lang_id
export const updateStudentLanguageById = async (langId, updateData) => {
    const client = await pool.connect();
    try {
        logger.info(`updateStudentLanguageById: Updating lang_id ${langId}`);
        await client.query('BEGIN');

        if (Object.keys(updateData).length === 0) {
            return {
                success: false,
                data: null,
                message: 'No fields to update'
            };
        }

        const fields = [];
        const values = [];
        let index = 1;

        for (const [key, value] of Object.entries(updateData)) {
            fields.push(`${key} = $${index}`);
            values.push(key === 'level' ? value.toString() : value);
            index++;
        }

        const updateQuery = `UPDATE student_languages SET ${fields.join(', ')} WHERE lang_id = $${index} RETURNING *`;
        values.push(langId);

        const result = await client.query(updateQuery, values);
        await client.query('COMMIT');

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Language record not found'
            };
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'Language updated successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`updateStudentLanguageById: ${error.message}`, { stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
};

// Bulk update student's languages
export const bulkUpdateStudentLanguages = async (studentId, languages) => {
    const client = await pool.connect();
    try {
        logger.info('bulkUpdateStudentLanguages: Bulk updating languages', { studentId });
        await client.query('BEGIN');

        const updatedRecords = [];

        for (const [language, level] of Object.entries(languages)) {
            const upsertQuery = `
                INSERT INTO student_languages (student_id, language, level)
                VALUES ($1, $2, $3)
                ON CONFLICT (student_id, language) DO UPDATE SET level = $3
                RETURNING *
            `;
            const result = await client.query(upsertQuery, [studentId, language, level.toString()]);
            updatedRecords.push(result.rows[0]);
        }

        await client.query('COMMIT');

        return {
            success: true,
            data: updatedRecords,
            message: `${updatedRecords.length} languages updated successfully`,
            count: updatedRecords.length
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`bulkUpdateStudentLanguages: ${error.message}`, { stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
};

// Delete by lang_id
export const deleteStudentLanguageById = async (langId) => {
    const client = await pool.connect();
    try {
        logger.info(`deleteStudentLanguageById: Deleting lang_id ${langId}`);
        await client.query('BEGIN');

        const deleteQuery = `DELETE FROM student_languages WHERE lang_id = $1 RETURNING *`;
        const result = await client.query(deleteQuery, [langId]);
        await client.query('COMMIT');

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Language record not found'
            };
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'Language deleted successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`deleteStudentLanguageById: ${error.message}`, { stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
};

// Delete all languages for a student
export const deleteAllStudentLanguages = async (studentId) => {
    const client = await pool.connect();
    try {
        logger.info(`deleteAllStudentLanguages: Deleting all languages for student ${studentId}`);
        await client.query('BEGIN');

        const deleteQuery = `DELETE FROM student_languages WHERE student_id = $1 RETURNING *`;
        const result = await client.query(deleteQuery, [studentId]);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows,
            message: `${result.rows.length} languages deleted successfully`,
            count: result.rows.length
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`deleteAllStudentLanguages: ${error.message}`, { stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
};

// Delete specific language for a student
export const deleteStudentSpecificLanguage = async (studentId, language) => {
    const client = await pool.connect();
    try {
        logger.info(`deleteStudentSpecificLanguage: Deleting ${language} for student ${studentId}`);
        await client.query('BEGIN');

        const deleteQuery = `DELETE FROM student_languages WHERE student_id = $1 AND LOWER(language) = LOWER($2) RETURNING *`;
        const result = await client.query(deleteQuery, [studentId, language]);
        await client.query('COMMIT');

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Language record not found for this student'
            };
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'Language deleted successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`deleteStudentSpecificLanguage: ${error.message}`, { stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
};
