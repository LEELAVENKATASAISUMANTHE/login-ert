import logger from '../utils/logger.js';
import pool from './connection.js';

const ALLOWED_STUDENT_FIELDS = [
    'first_name', 'middle_name', 'last_name', 'full_name',
    'gender', 'dob', 'email', 'alt_email', 'college_email',
    'mobile', 'emergency_contact', 'nationality',
    'placement_fee_status', 'student_photo_path', 'branch',
    'graduation_year', 'semester'
];

export const createStudent = async (student) => {
    const client = await pool.connect();

    try {
        logger.info('createStudent: Creating a new student record');
        await client.query('BEGIN');

        const insertQuery = `
            INSERT INTO students (
                student_id,
                first_name,
                middle_name,
                last_name,
                full_name,
                gender,
                dob,
                email,
                alt_email,
                college_email,
                mobile,
                emergency_contact,
                nationality,
                placement_fee_status,
                student_photo_path,
                created_at,
                branch,
                graduation_year,
                semester
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19
            )
            RETURNING *
        `;

        const values = [
            student.student_id,
            student.first_name || null,
            student.middle_name || null,
            student.last_name || null,
            student.full_name || null,
            student.gender || null,
            student.dob || null,
            student.email || null,
            student.alt_email || null,
            student.college_email || null,
            student.mobile || null,
            student.emergency_contact || null,
            student.nationality || null,
            student.placement_fee_status || null,
            student.student_photo_path || null,
            student.created_at || new Date(),
            student.branch || 'Unknown',
            student.graduation_year ?? null,
            student.semester ?? null
        ];

        const result = await client.query(insertQuery, values);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student created successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`createStudent: ${error.message}`, {
            stack: error.stack,
            student
        });
        throw error;
    } finally {
        client.release();
    }
};

export const getStudentById = async (studentId) => {
    try {
        logger.info(`getStudentById: Fetching student with ID ${studentId}`);
        const selectQuery = `SELECT * FROM students WHERE student_id = $1`;
        const result = await pool.query(selectQuery, [studentId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Student not found'
            };
        }
        return {
            success: true,
            data: result.rows[0],
            message: 'Student fetched successfully'
        };
    } catch (error) {
        logger.error(`getStudentById: ${error.message}`, {
            stack: error.stack,
            studentId
        });
        throw error;
    }
};

export const deleteStudentById = async (studentId) => {
    const client = await pool.connect();
    try {
        logger.info(`deleteStudentById: Deleting student with ID ${studentId}`);
        await client.query('BEGIN');
        const deleteQuery = `DELETE FROM students WHERE student_id = $1 RETURNING *`;
        const result = await client.query(deleteQuery, [studentId]);
        await client.query('COMMIT');
        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Student not found'
            };
        }
        return {
            success: true,
            data: result.rows[0],
            message: 'Student deleted successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`deleteStudentById: ${error.message}`, {
            stack: error.stack,
            studentId
        });
        throw error;
    } finally {
        client.release();
    }
};

export const patchStudentById = async (studentId, updateFields) => {
    const client = await pool.connect();
    try {
        if (Object.keys(updateFields).length === 0) {
            return {
                success: false,
                data: null,
                message: 'No fields to update'
            };
        }

        const fields = [];
        const values = [];
        let index = 1;

        for (const [key, value] of Object.entries(updateFields)) {
            if (!ALLOWED_STUDENT_FIELDS.includes(key)) {
                continue;
            }
            fields.push(`${key} = $${index}`);
            values.push(value);
            index++;
        }

        if (fields.length === 0) {
            return {
                success: false,
                data: null,
                message: 'No valid fields provided for update'
            };
        }

        const updateQuery = `UPDATE students SET ${fields.join(', ')} WHERE student_id = $${index} RETURNING *`;
        values.push(studentId);
        const result = await client.query(updateQuery, values);

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Student not found'
            };
        }
        return {
            success: true,
            data: result.rows[0],
            message: 'Student updated successfully'
        };
    } catch (error) {
        logger.error(`patchStudentById: ${error.message}`, {
            stack: error.stack,
            studentId,
            updateFields
        });
        throw error;
    } finally {
        client.release();
    }
};

export const getAllStudents = async () => {
    try {
        logger.info('getAllStudents: Fetching all students');

        const selectQuery = `
            SELECT
                student_id,
                first_name,
                middle_name,
                last_name,
                full_name,
                gender,
                dob,
                email,
                alt_email,
                college_email,
                mobile,
                emergency_contact,
                nationality,
                placement_fee_status,
                student_photo_path,
                created_at,
                branch,
                graduation_year,
                semester
            FROM students
            ORDER BY student_id
        `;

        const result = await pool.query(selectQuery);

        return {
            success: true,
            data: result.rows,
            message: 'Students fetched successfully'
        };
    } catch (error) {
        logger.error(`getAllStudents: ${error.message}`, {
            stack: error.stack
        });
        throw error;
    }
};

export const updateStudentById = async (studentId, student) => {
    const client = await pool.connect();
    try {
        logger.info(`updateStudentById: Updating student with ID ${studentId}`);
        await client.query('BEGIN');

        const updateQuery = `
            UPDATE students
            SET
                first_name = $1,
                middle_name = $2,
                last_name = $3,
                full_name = $4,
                gender = $5,
                dob = $6,
                email = $7,
                alt_email = $8,
                college_email = $9,
                mobile = $10,
                emergency_contact = $11,
                nationality = $12,
                placement_fee_status = $13,
                student_photo_path = $14,
                branch = $15,
                graduation_year = $16,
                semester = $17
            WHERE student_id = $18
            RETURNING *
        `;

        const values = [
            student.first_name || null,
            student.middle_name || null,
            student.last_name || null,
            student.full_name || null,
            student.gender || null,
            student.dob || null,
            student.email || null,
            student.alt_email || null,
            student.college_email || null,
            student.mobile || null,
            student.emergency_contact || null,
            student.nationality || null,
            student.placement_fee_status || null,
            student.student_photo_path || null,
            student.branch || 'Unknown',
            student.graduation_year ?? null,
            student.semester ?? null,
            studentId
        ];

        const result = await client.query(updateQuery, values);
        await client.query('COMMIT');

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Student not found'
            };
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'Student updated successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`updateStudentById: ${error.message}`, {
            stack: error.stack,
            studentId,
            student
        });
        throw error;
    } finally {
        client.release();
    }
};
