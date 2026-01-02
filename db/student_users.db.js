import pool from './connection.js';
import logger from '../utils/logger.js';

// Create a new student user association
export const createStudentUser = async (data) => {
    const client = await pool.connect();
    
    try {
        logger.info(`createStudentUser: Attempting to create student association for student ID: ${data.student_id} and user ID: ${data.user_id}`);
        
        await client.query('BEGIN');
        
        // Check if user exists
        const userCheck = await client.query('SELECT user_id FROM users WHERE user_id = $1', [data.user_id]);
        if (userCheck.rows.length === 0) {
            throw new Error('User not found');
        }

        // Check if student ID already exists
        const studentIdCheck = await client.query('SELECT student_id FROM student_users WHERE student_id = $1', [data.student_id]);
        if (studentIdCheck.rows.length > 0) {
            throw new Error('Student ID is already associated with a user');
        }
        
        // Check if student user association already exists
        const existingStudent = await client.query('SELECT student_id FROM student_users WHERE user_id = $1', [data.user_id]);
        if (existingStudent.rows.length > 0) {
            throw new Error('User is already associated with a student record');
        }
        
        // Insert the student user association
        const insertQuery = `INSERT INTO student_users (student_id, user_id) VALUES ($1, $2) RETURNING *`;
        const result = await client.query(insertQuery, [data.student_id, data.user_id]);
        
        await client.query('COMMIT');
        
        logger.info(`createStudentUser: Successfully created student association with ID: ${result.rows[0].student_id}`);
        
        return {
            success: true,
            data: result.rows[0],
            message: 'Student user association created successfully'
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`createStudentUser: ${error.message}`, {
            stack: error.stack,
            user_id: data.user_id
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get all student users with pagination and filtering
export const getAllStudentUsers = async (params) => {
    const { page = 1, limit = 10, sortBy = 'student_id', sortOrder = 'ASC', user_id, search } = params;
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    let values = [];
    let paramIndex = 1;
    
    if (user_id) {
        whereConditions.push(`su.user_id = $${paramIndex}`);
        values.push(user_id);
        paramIndex++;
    }
    
    if (search) {
        whereConditions.push(`(u.username ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
        values.push(`%${search}%`);
        paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    try {
        logger.debug(`getAllStudentUsers: Fetching student users, page ${page}, limit ${limit}`);
        
        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM student_users su
            LEFT JOIN users u ON su.user_id = u.user_id
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].total);
        
        // Get paginated data
        const dataQuery = `
            SELECT 
                su.student_id,
                su.user_id,
                u.username,
                u.email,
                u.full_name,
                u.is_active,
                u.created_at as user_created_at
            FROM student_users su
            LEFT JOIN users u ON su.user_id = u.user_id
            ${whereClause}
            ORDER BY su.${sortBy} ${sortOrder}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...values, limit, offset]);
        
        const totalPages = Math.ceil(total / limit);
        
        logger.debug(`getAllStudentUsers: Found ${dataResult.rows.length} student users`);
        
        return {
            success: true,
            data: {
                student_users: dataResult.rows,
                pagination: {
                    current_page: page,
                    total_pages: totalPages,
                    total_count: total,
                    limit: limit,
                    has_next: page < totalPages,
                    has_prev: page > 1
                }
            },
            message: 'Student users retrieved successfully'
        };
        
    } catch (error) {
        logger.error(`getAllStudentUsers: ${error.message}`, {
            stack: error.stack,
            params
        });
        throw new Error('Failed to retrieve student users');
    }
};

// Get a student user by student ID
export const getStudentUserById = async (student_id) => {
    try {
        logger.debug(`getStudentUserById: Fetching student user with ID: ${student_id}`);
        
        const query = `
            SELECT 
                su.student_id,
                su.user_id,
                u.username,
                u.email,
                u.full_name,
                u.role_id,
                r.role_name,
                u.is_active,
                u.created_at as user_created_at,
                u.last_login
            FROM student_users su
            LEFT JOIN users u ON su.user_id = u.user_id
            LEFT JOIN roles r ON u.role_id = r.role_id
            WHERE su.student_id = $1
        `;
        const result = await pool.query(query, [student_id]);
        
        if (result.rows.length === 0) {
            throw new Error('Student user not found');
        }
        
        logger.debug(`getStudentUserById: Successfully retrieved student user with ID: ${student_id}`);
        
        return {
            success: true,
            data: result.rows[0],
            message: 'Student user retrieved successfully'
        };
        
    } catch (error) {
        logger.error(`getStudentUserById: ${error.message}`, {
            stack: error.stack,
            student_id
        });
        throw error;
    }
};

// Get student user by user ID
export const getStudentUserByUserId = async (user_id) => {
    try {
        logger.debug(`getStudentUserByUserId: Fetching student user with user ID: ${user_id}`);
        
        const query = `
            SELECT 
                su.student_id,
                su.user_id,
                u.username,
                u.email,
                u.full_name,
                u.role_id,
                r.role_name,
                u.is_active,
                u.created_at as user_created_at,
                u.last_login
            FROM student_users su
            LEFT JOIN users u ON su.user_id = u.user_id
            LEFT JOIN roles r ON u.role_id = r.role_id
            WHERE su.user_id = $1
        `;
        const result = await pool.query(query, [user_id]);
        
        if (result.rows.length === 0) {
            throw new Error('Student user not found');
        }
        
        logger.debug(`getStudentUserByUserId: Successfully retrieved student user with user ID: ${user_id}`);
        
        return {
            success: true,
            data: result.rows[0],
            message: 'Student user retrieved successfully'
        };
        
    } catch (error) {
        logger.error(`getStudentUserByUserId: ${error.message}`, {
            stack: error.stack,
            user_id
        });
        throw error;
    }
};

// Update a student user association
export const updateStudentUser = async (student_id, data) => {
    const client = await pool.connect();
    
    try {
        logger.info(`updateStudentUser: Attempting to update student user with ID: ${student_id}`);
        
        await client.query('BEGIN');
        
        // Check if student user exists
        const studentCheck = await client.query('SELECT student_id FROM student_users WHERE student_id = $1', [student_id]);
        if (studentCheck.rows.length === 0) {
            throw new Error('Student user not found');
        }
        
        // If updating user_id, check if user exists
        if (data.user_id) {
            const userCheck = await client.query('SELECT user_id FROM users WHERE user_id = $1', [data.user_id]);
            if (userCheck.rows.length === 0) {
                throw new Error('User not found');
            }
            
            // Check if user is already associated with another student record
            const existingStudent = await client.query('SELECT student_id FROM student_users WHERE user_id = $1 AND student_id != $2', [data.user_id, student_id]);
            if (existingStudent.rows.length > 0) {
                throw new Error('User is already associated with another student record');
            }
        }
        
        // Update the student user association
        const updateQuery = `
            UPDATE student_users 
            SET user_id = $1
            WHERE student_id = $2
            RETURNING *
        `;
        
        const result = await client.query(updateQuery, [data.user_id, student_id]);
        
        await client.query('COMMIT');
        
        logger.info(`updateStudentUser: Successfully updated student user with ID: ${student_id}`);
        
        return {
            success: true,
            data: result.rows[0],
            message: 'Student user association updated successfully'
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`updateStudentUser: ${error.message}`, {
            stack: error.stack,
            student_id,
            data
        });
        throw error;
    } finally {
        client.release();
    }
};

// Delete a student user association
export const deleteStudentUser = async (student_id) => {
    const client = await pool.connect();
    
    try {
        logger.info(`deleteStudentUser: Attempting to delete student user with ID: ${student_id}`);
        
        await client.query('BEGIN');
        
        // Check if student user exists
        const studentCheck = await client.query('SELECT student_id, user_id FROM student_users WHERE student_id = $1', [student_id]);
        if (studentCheck.rows.length === 0) {
            throw new Error('Student user not found');
        }
        
        // Delete the student user association
        const deleteQuery = `DELETE FROM student_users WHERE student_id = $1 RETURNING *`;
        const result = await client.query(deleteQuery, [student_id]);
        
        await client.query('COMMIT');
        
        logger.info(`deleteStudentUser: Successfully deleted student user with ID: ${student_id}`);
        
        return {
            success: true,
            data: result.rows[0],
            message: 'Student user association deleted successfully'
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`deleteStudentUser: ${error.message}`, {
            stack: error.stack,
            student_id
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get all students with full user information
export const getAllStudents = async (params) => {
    const { page = 1, limit = 10, sortBy = 'student_id', sortOrder = 'ASC', search } = params;
    const offset = (page - 1) * limit;
    
    let whereConditions = ['u.user_id IS NOT NULL']; // Only include students with user associations
    let values = [];
    let paramIndex = 1;
    
    if (search) {
        whereConditions.push(`(u.username ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
        values.push(`%${search}%`);
        paramIndex++;
    }
    
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    
    try {
        logger.debug(`getAllStudents: Fetching students, page ${page}, limit ${limit}`);
        
        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM student_users su
            INNER JOIN users u ON su.user_id = u.user_id
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].total);
        
        // Get paginated data with full user information
        const dataQuery = `
            SELECT 
                su.student_id,
                su.user_id,
                u.username,
                u.email,
                u.full_name,
                u.role_id,
                r.role_name,
                u.is_active,
                u.created_at as user_created_at,
                u.last_login
            FROM student_users su
            INNER JOIN users u ON su.user_id = u.user_id
            LEFT JOIN roles r ON u.role_id = r.role_id
            ${whereClause}
            ORDER BY su.${sortBy} ${sortOrder}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...values, limit, offset]);
        
        const totalPages = Math.ceil(total / limit);
        
        logger.debug(`getAllStudents: Found ${dataResult.rows.length} students`);
        
        return {
            success: true,
            data: {
                students: dataResult.rows,
                pagination: {
                    current_page: page,
                    total_pages: totalPages,
                    total_count: total,
                    limit: limit,
                    has_next: page < totalPages,
                    has_prev: page > 1
                }
            },
            message: 'Students retrieved successfully'
        };
        
    } catch (error) {
        logger.error(`getAllStudents: ${error.message}`, {
            stack: error.stack,
            params
        });
        throw new Error('Failed to retrieve students');
    }
};

// Bulk create student user associations
export const bulkCreateStudentUsers = async (user_ids) => {
    const client = await pool.connect();
    
    try {
        logger.info(`bulkCreateStudentUsers: Attempting to create ${user_ids.length} student associations`);
        
        await client.query('BEGIN');
        
        const created = [];
        const duplicates = [];
        const invalidUsers = [];
        
        for (const user_id of user_ids) {
            try {
                // Check if user exists
                const userCheck = await client.query('SELECT user_id FROM users WHERE user_id = $1', [user_id]);
                if (userCheck.rows.length === 0) {
                    invalidUsers.push(user_id);
                    continue;
                }
                
                // Check if student user association already exists
                const existingStudent = await client.query('SELECT student_id FROM student_users WHERE user_id = $1', [user_id]);
                if (existingStudent.rows.length > 0) {
                    duplicates.push(user_id);
                    continue;
                }
                
                // Insert the student user association
                const insertQuery = `INSERT INTO student_users (user_id) VALUES ($1) RETURNING *`;
                const result = await client.query(insertQuery, [user_id]);
                created.push(result.rows[0]);
                
            } catch (error) {
                logger.warn(`bulkCreateStudentUsers: Failed to create association for user ${user_id}: ${error.message}`);
                invalidUsers.push(user_id);
            }
        }
        
        await client.query('COMMIT');
        
        logger.info(`bulkCreateStudentUsers: Successfully created ${created.length} student associations`);
        
        return {
            success: true,
            data: {
                created,
                duplicates,
                invalid_users: invalidUsers,
                summary: {
                    total_requested: user_ids.length,
                    successfully_created: created.length,
                    duplicates: duplicates.length,
                    invalid: invalidUsers.length
                }
            },
            message: `Created ${created.length} student user associations successfully`
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`bulkCreateStudentUsers: ${error.message}`, {
            stack: error.stack,
            user_ids
        });
        throw error;
    } finally {
        client.release();
    }
};