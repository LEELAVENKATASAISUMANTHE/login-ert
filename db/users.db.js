import pool from './connection.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcrypt';
import { AppError } from '../utils/errors.js';

// Get role_name by role_id (used for dynamic role checks)
export const getRoleNameById = async (roleId) => {
    const result = await pool.query('SELECT role_name FROM roles WHERE role_id = $1', [roleId]);
    return result.rows[0]?.role_name || null;
};

// Create a new user
export const createUser = async (data) => {
    const client = await pool.connect();

    try {
        logger.info(`createUser: Attempting to create user with username: ${data.username}`);

        await client.query('BEGIN');

        // Check if role exists (if role_id is provided) and fetch role_name
        let roleName = null;
        if (data.role_id) {
            const roleCheck = await client.query('SELECT role_id, role_name FROM roles WHERE role_id = $1', [data.role_id]);
            if (roleCheck.rows.length === 0) {
                throw new AppError(422, 'Role not found');
            }
            roleName = roleCheck.rows[0].role_name;
        }

        // // Check if username already exists
        // const usernameCheck = await client.query('SELECT username FROM users WHERE username = $1', [data.username]);
        // if (usernameCheck.rows.length > 0) {
        //     throw new Error('Username already exists');
        // }

        // Check if email already exists (if provided)
        if (data.email) {
            const emailCheck = await client.query('SELECT email FROM users WHERE email = $1', [data.email]);
            if (emailCheck.rows.length > 0) {
                throw new AppError(409, 'Email already exists');
            }
        }

        // Insert the user
        const insertQuery = `
            INSERT INTO users (username, password_hash, email, role_id, is_active)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING user_id, username, email, role_id, is_active, created_at
        `;
        const values = [
            data.username,
            data.password_hash,
            data.email || null,
            data.role_id || null,
            data.is_active !== undefined ? data.is_active : true
        ];

        const result = await client.query(insertQuery, values);
        const createdUser = result.rows[0];

        // If the role is STUDENT and student_id is provided,
        // create the student_users association in the same transaction.
        if (data.student_id && roleName === 'STUDENT') {
            // First, check if student exists in students table
            const studentExists = await client.query(
                'SELECT student_id FROM students WHERE student_id = $1',
                [data.student_id]
            );

            // If student doesn't exist, create a minimal student record
            if (studentExists.rows.length === 0) {
                await client.query(
                    'INSERT INTO students (student_id, created_at) VALUES ($1, NOW())',
                    [data.student_id]
                );
                logger.info(`createUser: Created minimal student record for student_id=${data.student_id}`);
            }

            // Ensure student_id is not already linked to another user
            const studentIdCheck = await client.query(
                'SELECT student_id FROM student_users WHERE student_id = $1',
                [data.student_id]
            );
            if (studentIdCheck.rows.length > 0) {
                throw new AppError(409, 'Student ID is already associated with another user');
            }

            await client.query(
                'INSERT INTO student_users (student_id, user_id) VALUES ($1, $2)',
                [data.student_id, createdUser.user_id]
            );

            createdUser.student_id = data.student_id;
            logger.info(`createUser: Linked student_id=${data.student_id} to user_id=${createdUser.user_id}`);
        }

        await client.query('COMMIT');

        logger.info(`createUser: Successfully created user with ID: ${createdUser.user_id}`);

        return {
            success: true,
            data: createdUser,
            message: 'User created successfully'
        };

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error({
            stack: error.stack,
            username: data.username,
            email: data.email
        }, `createUser: ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
};

// Get all users with pagination and filtering
export const getAllUsers = async (params) => {
    const { page = 1, limit = 10, sortBy = 'user_id', sortOrder = 'ASC', is_active, role_id, search } = params;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let values = [];
    let paramIndex = 1;

    if (is_active !== undefined) {
        whereConditions.push(`u.is_active = $${paramIndex}`);
        values.push(is_active);
        paramIndex++;
    }

    if (role_id) {
        whereConditions.push(`u.role_id = $${paramIndex}`);
        values.push(role_id);
        paramIndex++;
    }

    if (search) {
        whereConditions.push(`(u.username ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
        values.push(`%${search}%`);
        paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    try {
        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.role_id
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].total);

        // Get paginated data
        const dataQuery = `
            SELECT 
                u.user_id,
                u.username,
                u.email,
                u.role_id,
                r.role_name,
                u.is_active,
                u.created_at,
                u.updated_at
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.role_id
            ${whereClause}
            ORDER BY u.${sortBy} ${sortOrder}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...values, limit, offset]);

        const totalPages = Math.ceil(total / limit);

        return {
            success: true,
            data: {
                users: dataResult.rows,
                pagination: {
                    current_page: page,
                    total_pages: totalPages,
                    total_count: total,
                    limit: limit,
                    has_next: page < totalPages,
                    has_prev: page > 1
                }
            },
            message: 'Users retrieved successfully'
        };

    } catch (error) {
        logger.error({ stack: error.stack }, `getAllUsers: ${error.message}`);
        throw new Error('Failed to retrieve users');
    }
};

// Get a user by ID
export const getUserById = async (user_id) => {
    try {
        const query = `
            SELECT 
                u.user_id,
                u.username,
                u.email,
                u.role_id,
                r.role_name,
                r.role_description,
                u.is_active,
                u.created_at,
                u.updated_at
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.role_id
            WHERE u.user_id = $1
        `;
        const result = await pool.query(query, [user_id]);

        if (result.rows.length === 0) {
            throw new AppError(404, 'User not found');
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'User retrieved successfully'
        };

    } catch (error) {
        logger.error(`getUserById: ${error.message}`);
        throw error;
    }
};

// Update a user
export const updateUser = async (user_id, data) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if user exists
        const userCheck = await client.query('SELECT user_id FROM users WHERE user_id = $1', [user_id]);
        if (userCheck.rows.length === 0) {
            throw new AppError(404, 'User not found');
        }

        // Build dynamic update query
        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (data.username !== undefined) {
            const usernameCheck = await client.query('SELECT user_id FROM users WHERE username = $1 AND user_id != $2', [data.username, user_id]);
            if (usernameCheck.rows.length > 0) throw new AppError(409, 'Username already exists');
            fields.push(`username = $${paramIndex}`);
            values.push(data.username);
            paramIndex++;
        }

        if (data.email !== undefined) {
            const emailCheck = await client.query('SELECT user_id FROM users WHERE email = $1 AND user_id != $2', [data.email, user_id]);
            if (emailCheck.rows.length > 0) throw new AppError(409, 'Email already exists');
            fields.push(`email = $${paramIndex}`);
            values.push(data.email || null);
            paramIndex++;
        }

        if (data.role_id !== undefined) {
            const roleCheck = await client.query('SELECT role_id FROM roles WHERE role_id = $1', [data.role_id]);
            if (roleCheck.rows.length === 0) throw new AppError(422, 'Role not found');
            fields.push(`role_id = $${paramIndex}`);
            values.push(data.role_id);
            paramIndex++;
        }

        if (data.is_active !== undefined) {
            fields.push(`is_active = $${paramIndex}`);
            values.push(data.is_active);
            paramIndex++;
        }

        if (fields.length === 0) return { success: true, message: 'No fields to update' };

        values.push(user_id);

        const updateQuery = `
            UPDATE users 
            SET ${fields.join(', ')}
            WHERE user_id = $${paramIndex}
            RETURNING user_id, username, email, role_id, is_active, created_at, updated_at
        `;

        const result = await client.query(updateQuery, values);

        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'User updated successfully'
        };

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`updateUser: ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
};

// Delete a user (soft delete by setting is_active to false)
export const deleteUser = async (user_id) => {
    try {
        const deleteQuery = `
            UPDATE users 
            SET is_active = false
            WHERE user_id = $1
            RETURNING user_id, username, is_active
        `;
        const result = await pool.query(deleteQuery, [user_id]);
        if (result.rows.length === 0) throw new AppError(404, 'User not found');
        return { success: true, data: result.rows[0], message: 'User deleted successfully' };
    } catch (error) {
        logger.error(`deleteUser: ${error.message}`);
        throw error;
    }
};

// Change user password
export const changePassword = async (user_id, currentPassword, newPasswordHash) => {
    try {
        const userQuery = `SELECT password_hash FROM users WHERE user_id = $1 AND is_active = true`;
        const userResult = await pool.query(userQuery, [user_id]);
        if (userResult.rows.length === 0) throw new AppError(404, 'User not found or inactive');

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
        if (!isCurrentPasswordValid) throw new AppError(400, 'Current password is incorrect');

        const updateQuery = `UPDATE users SET password_hash = $1 WHERE user_id = $2 RETURNING user_id, username`;
        const result = await pool.query(updateQuery, [newPasswordHash, user_id]);
        return { success: true, data: result.rows[0], message: 'Password changed successfully' };
    } catch (error) {
        logger.error(`changePassword: ${error.message}`);
        throw error;
    }
};