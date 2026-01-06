import logger from '../utils/logger.js';
import pool from './connection.js';

// Create a new student certification record
export const createStudentCertification = async (certification) => {
    const client = await pool.connect();

    try {
        logger.info('createStudentCertification: Creating a new student certification record');
        await client.query('BEGIN');

        const insertQuery = `
            INSERT INTO student_certifications (
                student_id,
                skill_name,
                duration,
                vendor,
                certificate_file
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

        const values = [
            certification.student_id,
            certification.skill_name || null,
            certification.duration || null,
            certification.vendor || null,
            certification.certificate_file || null
        ];

        const result = await client.query(insertQuery, values);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student certification created successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`createStudentCertification: ${error.message}`, {
            stack: error.stack,
            certification
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get all student certifications
export const getAllStudentCertifications = async () => {
    const client = await pool.connect();

    try {
        logger.info('getAllStudentCertifications: Fetching all student certifications');

        const selectQuery = `
            SELECT 
                sc.*,
                s.full_name as student_name
            FROM student_certifications sc
            LEFT JOIN students s ON sc.student_id = s.student_id
            ORDER BY sc.cert_id DESC
        `;

        const result = await client.query(selectQuery);

        return {
            success: true,
            data: result.rows,
            message: 'Student certifications fetched successfully',
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getAllStudentCertifications: ${error.message}`, {
            stack: error.stack
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get student certification by ID
export const getStudentCertificationById = async (certId) => {
    const client = await pool.connect();

    try {
        logger.info('getStudentCertificationById: Fetching student certification by ID', { certId });

        const selectQuery = `
            SELECT 
                sc.*,
                s.full_name as student_name
            FROM student_certifications sc
            LEFT JOIN students s ON sc.student_id = s.student_id
            WHERE sc.cert_id = $1
        `;

        const result = await client.query(selectQuery, [certId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                message: 'Student certification not found'
            };
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'Student certification fetched successfully'
        };
    } catch (error) {
        logger.error(`getStudentCertificationById: ${error.message}`, {
            stack: error.stack,
            certId
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get all certifications for a specific student
export const getCertificationsByStudentId = async (studentId) => {
    const client = await pool.connect();

    try {
        logger.info('getCertificationsByStudentId: Fetching certifications for student', { studentId });

        const selectQuery = `
            SELECT 
                sc.*,
                s.full_name as student_name
            FROM student_certifications sc
            LEFT JOIN students s ON sc.student_id = s.student_id
            WHERE sc.student_id = $1
            ORDER BY sc.cert_id DESC
        `;

        const result = await client.query(selectQuery, [studentId]);

        return {
            success: true,
            data: result.rows,
            message: 'Student certifications fetched successfully',
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getCertificationsByStudentId: ${error.message}`, {
            stack: error.stack,
            studentId
        });
        throw error;
    } finally {
        client.release();
    }
};

// Search certifications by skill name
export const searchCertificationsBySkill = async (skill) => {
    const client = await pool.connect();

    try {
        logger.info('searchCertificationsBySkill: Searching certifications by skill', { skill });

        const selectQuery = `
            SELECT 
                sc.*,
                s.full_name as student_name
            FROM student_certifications sc
            LEFT JOIN students s ON sc.student_id = s.student_id
            WHERE LOWER(sc.skill_name) LIKE $1
            ORDER BY sc.cert_id DESC
        `;

        const result = await client.query(selectQuery, [`%${skill.toLowerCase()}%`]);

        return {
            success: true,
            data: result.rows,
            message: `Found ${result.rows.length} certifications for skill: ${skill}`,
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`searchCertificationsBySkill: ${error.message}`, {
            stack: error.stack,
            skill
        });
        throw error;
    } finally {
        client.release();
    }
};

// Update student certification by ID
export const updateStudentCertificationById = async (certId, certification) => {
    const client = await pool.connect();

    try {
        logger.info('updateStudentCertificationById: Updating student certification', { certId });
        await client.query('BEGIN');

        const updateQuery = `
            UPDATE student_certifications
            SET 
                student_id = $1,
                skill_name = $2,
                duration = $3,
                vendor = $4,
                certificate_file = $5
            WHERE cert_id = $6
            RETURNING *
        `;

        const values = [
            certification.student_id,
            certification.skill_name || null,
            certification.duration || null,
            certification.vendor || null,
            certification.certificate_file || null,
            certId
        ];

        const result = await client.query(updateQuery, values);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return {
                success: false,
                message: 'Student certification not found'
            };
        }

        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student certification updated successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`updateStudentCertificationById: ${error.message}`, {
            stack: error.stack,
            certId,
            certification
        });
        throw error;
    } finally {
        client.release();
    }
};

// Delete student certification by ID
export const deleteStudentCertificationById = async (certId) => {
    const client = await pool.connect();

    try {
        logger.info('deleteStudentCertificationById: Deleting student certification', { certId });
        await client.query('BEGIN');

        const deleteQuery = `
            DELETE FROM student_certifications
            WHERE cert_id = $1
            RETURNING *
        `;

        const result = await client.query(deleteQuery, [certId]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return {
                success: false,
                message: 'Student certification not found'
            };
        }

        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student certification deleted successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`deleteStudentCertificationById: ${error.message}`, {
            stack: error.stack,
            certId
        });
        throw error;
    } finally {
        client.release();
    }
};

// Bulk insert student certifications (for Excel import)
export const bulkInsertStudentCertifications = async (certifications) => {
    const client = await pool.connect();

    try {
        logger.info('bulkInsertStudentCertifications: Bulk inserting student certifications', {
            count: certifications.length
        });
        await client.query('BEGIN');

        const results = {
            successful: [],
            failed: []
        };

        for (let i = 0; i < certifications.length; i++) {
            const certification = certifications[i];
            const rowNumber = i + 2;

            try {
                const insertQuery = `
                    INSERT INTO student_certifications (
                        student_id,
                        skill_name,
                        duration,
                        vendor,
                        certificate_file
                    ) VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                `;

                const values = [
                    certification.student_id,
                    certification.skill_name || null,
                    certification.duration || null,
                    certification.vendor || null,
                    certification.certificate_file || null
                ];

                const result = await client.query(insertQuery, values);
                results.successful.push({
                    row: rowNumber,
                    data: result.rows[0]
                });
            } catch (rowError) {
                results.failed.push({
                    row: rowNumber,
                    data: certification,
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
        logger.error(`bulkInsertStudentCertifications: ${error.message}`, {
            stack: error.stack
        });
        throw error;
    } finally {
        client.release();
    }
};
