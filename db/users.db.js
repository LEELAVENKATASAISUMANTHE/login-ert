import pool from './connection.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcrypt';

// Create a new user
export const createUser = async (data) => {
    const client = await pool.connect();
    
    try {
        logger.info(`createUser: Attempting to create user with username: ${data.username}`);
        
        await client.query('BEGIN');
        
        // Check if role exists (if role_id is provided)
        if (data.role_id) {
            const roleCheck = await client.query('SELECT role_id FROM roles WHERE role_id = $1', [data.role_id]);
            if (roleCheck.rows.length === 0) {
                throw new Error('Role not found');
            }
        }
        
        // Check if username already exists
        const usernameCheck = await client.query('SELECT username FROM users WHERE username = $1', [data.username]);
        if (usernameCheck.rows.length > 0) {
            throw new Error('Username already exists');
        }
        
        // Check if email already exists (if provided)
        if (data.email) {
            const emailCheck = await client.query('SELECT email FROM users WHERE email = $1', [data.email]);
            if (emailCheck.rows.length > 0) {
                throw new Error('Email already exists');
            }
        }
        
        // Insert the user
        const insertQuery = `
            INSERT INTO users (username, password_hash, email, full_name, role_id, is_active)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING user_id, username, email, full_name, role_id, is_active, created_at
        `;
        const values = [
            data.username,
            data.password_hash,
            data.email || null,
            data.full_name || null,
            data.role_id || null,
            data.is_active !== undefined ? data.is_active : true
        ];
        
        const result = await client.query(insertQuery, values);
        
        await client.query('COMMIT');
        
        logger.info(`createUser: Successfully created user with ID: ${result.rows[0].user_id}`);
        
        return {
            success: true,
            data: result.rows[0],
            message: 'User created successfully'
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`createUser: ${error.message}`, {
            stack: error.stack,
            username: data.username,
            email: data.email
        });
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
        whereConditions.push(`(u.username ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
        values.push(`%${search}%`);
        paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    try {
        logger.debug(`getAllUsers: Fetching users, page ${page}, limit ${limit}`);
        
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
                u.full_name,
                u.role_id,
                r.role_name,
                u.is_active,
                u.created_at,
                u.last_login
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.role_id
            ${whereClause}
            ORDER BY u.${sortBy} ${sortOrder}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...values, limit, offset]);
        
        const totalPages = Math.ceil(total / limit);
        
        logger.debug(`getAllUsers: Found ${dataResult.rows.length} users`);
        
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
        logger.error(`getAllUsers: ${error.message}`, {
            stack: error.stack,
            params
        });
        throw new Error('Failed to retrieve users');
    }
};

// Get a user by ID
export const getUserById = async (user_id) => {
    try {
        logger.debug(`getUserById: Fetching user with ID: ${user_id}`);
        
        const query = `
            SELECT 
                u.user_id,
                u.username,
                u.email,
                u.full_name,
                u.role_id,
                r.role_name,
                r.description as role_description,
                u.is_active,
                u.created_at,
                u.last_login
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.role_id
            WHERE u.user_id = $1
        `;
        const result = await pool.query(query, [user_id]);
        
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }
        
        logger.debug(`getUserById: Successfully retrieved user with ID: ${user_id}`);
        
        return {
            success: true,
            data: result.rows[0],
            message: 'User retrieved successfully'
        };
        
    } catch (error) {
        logger.error(`getUserById: ${error.message}`, {
            stack: error.stack,
            user_id
        });
        throw error;
    }
};

// Update a user
export const updateUser = async (user_id, data) => {
    const client = await pool.connect();
    
    try {
        logger.info(`updateUser: Attempting to update user with ID: ${user_id}`);
        
        await client.query('BEGIN');
        
        // Check if user exists
        const userCheck = await client.query('SELECT user_id FROM users WHERE user_id = $1', [user_id]);
        if (userCheck.rows.length === 0) {
            throw new Error('User not found');
        }
        
        // Check if role exists (if role_id is provided)
        if (data.role_id) {
            const roleCheck = await client.query('SELECT role_id FROM roles WHERE role_id = $1', [data.role_id]);
            if (roleCheck.rows.length === 0) {
                throw new Error('Role not found');
            }
        }
        
        // Check if username already exists (if updating username)
        if (data.username) {
            const usernameCheck = await client.query('SELECT user_id FROM users WHERE username = $1 AND user_id != $2', [data.username, user_id]);
            if (usernameCheck.rows.length > 0) {
                throw new Error('Username already exists');
            }
        }
        
        // Check if email already exists (if updating email)
        if (data.email) {
            const emailCheck = await client.query('SELECT user_id FROM users WHERE email = $1 AND user_id != $2', [data.email, user_id]);
            if (emailCheck.rows.length > 0) {
                throw new Error('Email already exists');
            }
        }
        
        // Build dynamic update query
        const fields = [];
        const values = [];
        let paramIndex = 1;
        
        if (data.username !== undefined) {
            fields.push(`username = $${paramIndex}`);
            values.push(data.username);
            paramIndex++;
        }
        
        if (data.email !== undefined) {
            fields.push(`email = $${paramIndex}`);
            values.push(data.email || null);
            paramIndex++;
        }
        
        if (data.full_name !== undefined) {
            fields.push(`full_name = $${paramIndex}`);
            values.push(data.full_name || null);
            paramIndex++;
        }
        
        if (data.role_id !== undefined) {
            fields.push(`role_id = $${paramIndex}`);
            values.push(data.role_id);
            paramIndex++;
        }
        
        if (data.is_active !== undefined) {
            fields.push(`is_active = $${paramIndex}`);
            values.push(data.is_active);
            paramIndex++;
        }
        
        values.push(user_id);
        
        const updateQuery = `
            UPDATE users 
            SET ${fields.join(', ')}
            WHERE user_id = $${paramIndex}
            RETURNING user_id, username, email, full_name, role_id, is_active, created_at, last_login
        `;
        
        const result = await client.query(updateQuery, values);
        
        await client.query('COMMIT');
        
        logger.info(`updateUser: Successfully updated user with ID: ${user_id}`);
        
        return {
            success: true,
            data: result.rows[0],
            message: 'User updated successfully'
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`updateUser: ${error.message}`, {
            stack: error.stack,
            user_id,
            data
        });
        throw error;
    } finally {
        client.release();
    }
};

// Delete a user (soft delete by setting is_active to false)
export const deleteUser = async (user_id) => {
    const client = await pool.connect();
    
    try {
        logger.info(`deleteUser: Attempting to delete user with ID: ${user_id}`);
        
        await client.query('BEGIN');
        
        // Check if user exists
        const userCheck = await client.query('SELECT user_id, username FROM users WHERE user_id = $1', [user_id]);
        if (userCheck.rows.length === 0) {
            throw new Error('User not found');
        }
        
        // Soft delete by setting is_active to false
        const deleteQuery = `
            UPDATE users 
            SET is_active = false
            WHERE user_id = $1
            RETURNING user_id, username, is_active
        `;
        const result = await client.query(deleteQuery, [user_id]);
        
        await client.query('COMMIT');
        
        logger.info(`deleteUser: Successfully deleted user with ID: ${user_id}`);
        
        return {
            success: true,
            data: result.rows[0],
            message: 'User deleted successfully'
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`deleteUser: ${error.message}`, {
            stack: error.stack,
            user_id
        });
        throw error;
    } finally {
        client.release();
    }
};

// Change user password
export const changePassword = async (user_id, currentPassword, newPasswordHash) => {
    const client = await pool.connect();
    
    try {
        logger.info(`changePassword: Attempting to change password for user ID: ${user_id}`);
        
        await client.query('BEGIN');
        
        // Get current password hash
        const userQuery = `SELECT password_hash FROM users WHERE user_id = $1 AND is_active = true`;
        const userResult = await client.query(userQuery, [user_id]);
        
        if (userResult.rows.length === 0) {
            throw new Error('User not found or inactive');
        }
        
        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
        if (!isCurrentPasswordValid) {
            throw new Error('Current password is incorrect');
        }
        
        // Update password
        const updateQuery = `
            UPDATE users 
            SET password_hash = $1
            WHERE user_id = $2
            RETURNING user_id, username
        `;
        const result = await client.query(updateQuery, [newPasswordHash, user_id]);
        
        await client.query('COMMIT');
        
        logger.info(`changePassword: Successfully changed password for user ID: ${user_id}`);
        
        return {
            success: true,
            data: result.rows[0],
            message: 'Password changed successfully'
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`changePassword: ${error.message}`, {
            stack: error.stack,
            user_id
        });
        throw error;
    } finally {
        client.release();
    }
};

// Authenticate user (login)
export const authenticateUser = async (username, password) => {
    try {
        logger.info(`authenticateUser: Attempting to authenticate user: ${username}`);
        
        // Get user with role information
        const query = `
            SELECT 
                u.user_id,
                u.username,
                u.password_hash,
                u.email,
                u.full_name,
                u.role_id,
                r.role_name,
                u.is_active,
                u.created_at,
                u.last_login
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.role_id
            WHERE u.username = $1
        `;
        const result = await pool.query(query, [username]);
        
        if (result.rows.length === 0) {
            throw new Error('Invalid credentials');
        }
        
        const user = result.rows[0];
        
        if (!user.is_active) {
            throw new Error('Account is inactive or disabled');
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }
        
        // Remove password hash from response
        const { password_hash, ...userWithoutPassword } = user;
        
        logger.info(`authenticateUser: Successfully authenticated user: ${username}`);
        
        return {
            success: true,
            data: userWithoutPassword,
            message: 'User authenticated successfully'
        };
        
    } catch (error) {
        logger.error(`authenticateUser: ${error.message}`, {
            stack: error.stack,
            username
        });
        throw error;
    }
};

// Update last login timestamp
export const updateLastLogin = async (user_id) => {
    try {
        logger.debug(`updateLastLogin: Updating last login for user ID: ${user_id}`);
        
        const query = `
            UPDATE users 
            SET last_login = NOW()
            WHERE user_id = $1 AND is_active = true
            RETURNING user_id, username, last_login
        `;
        const result = await pool.query(query, [user_id]);
        
        if (result.rows.length === 0) {
            throw new Error('User not found or inactive');
        }
        
        logger.debug(`updateLastLogin: Successfully updated last login for user ID: ${user_id}`);
        
        return {
            success: true,
            data: result.rows[0],
            message: 'Last login updated successfully'
        };
        
    } catch (error) {
        logger.error(`updateLastLogin: ${error.message}`, {
            stack: error.stack,
            user_id
        });
        throw error;
    }
};

// Get user permissions (through role)
export const getUserPermissions = async (user_id) => {
    try {
        logger.debug(`getUserPermissions: Fetching permissions for user ID: ${user_id}`);
        
        const query = `
            SELECT DISTINCT
                p.permission_id,
                p.permission_name,
                p.module,
                p.description
            FROM users u
            INNER JOIN roles r ON u.role_id = r.role_id
            INNER JOIN role_permissions rp ON r.role_id = rp.role_id
            INNER JOIN permissions p ON rp.permission_id = p.permission_id
            WHERE u.user_id = $1 AND u.is_active = true
            ORDER BY p.permission_name
        `;
        const result = await pool.query(query, [user_id]);
        
        logger.debug(`getUserPermissions: Found ${result.rows.length} permissions for user ID: ${user_id}`);
        
        return {
            success: true,
            data: result.rows,
            message: 'User permissions retrieved successfully'
        };
        
    } catch (error) {
        logger.error(`getUserPermissions: ${error.message}`, {
            stack: error.stack,
            user_id
        });
        throw new Error('Failed to retrieve user permissions');
    }
};