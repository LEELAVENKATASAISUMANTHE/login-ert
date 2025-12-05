import pool from './connection.js';  // Fixed import path
import logger from '../utils/logger.js';

/**
 * create a new role in the database 
 * @param {Object} data - The role data
 * @param {string} data.role_name - The name of the role
 * @param {string} data.role_description - The description of the role
 * @returns {Object} The newly created role
 * @throws Will throw an error if the role creation fails or if the role already exists
 */

export const createRole = async (data) => {
    // Fixed: Use your actual table name and column names
    const Query = `INSERT INTO roles (role_name, role_description) VALUES ($1, $2) RETURNING *`;
    const values = [data.role_name, data.role_description || null]; // Handle optional description
    
    try {
        logger.info("createRole: Attempting to create a new role with name: " + data.role_name);
        const res = await pool.query(Query, values);
        
        if (res.rows.length === 0) { // Fixed: was res.row.length
            logger.error("createRole: Failed to create role with name: " + data.role_name);
            throw new Error('Role creation failed');
        }
        
        logger.info("createRole: Successfully created role with ID: " + res.rows[0].role_id);
        return {
            success: true,
            data: res.rows[0],
            message: 'Role created successfully'
        };
    } catch (error) {
        logger.error(`error in createRole: ${error.message}`, {
            stack: error.stack,
            role_name: data.role_name,
            error_message: error.message
        });
        
        if (error.code === '23505') { // Unique constraint violation
            throw new Error('Role name already exists');
        }
        
        throw new Error('Role creation failed due to an unexpected error');
    }
};


/**
 * Update role by ID
 * @param {String} role_id 
 * @param {object} data 
 * @param {string} data.role_name
 * @param {string} data.role_description
 * @returns {Object} The updated role details
 */
export const updateRole = async (role_id, data) => {
    // Fixed: Match your table structure - no updated_at column, use role_id
    const Query = `UPDATE roles SET role_name=$1, role_description=$2 WHERE role_id=$3 RETURNING *`;
    const values = [data.role_name, data.role_description || null, role_id];
    
    try {
        logger.debug("updateRole: Attempting to update role with ID: " + role_id);
        const res = await pool.query(Query, values);

        if (res.rows.length === 0) { // Fixed: was res.row.length
            logger.warn("updateRole: No role found with ID: " + role_id);
            return {
                success: false, // Fixed: was sucess
                data: null,
                message: 'Role not found'
            };
        }
        
        logger.info("updateRole: Successfully updated role with ID: " + role_id);
        return {
            success: true,
            data: res.rows[0],
            message: 'Role updated successfully'
        };
    } catch (error) {
        logger.error(`error in updateRole: ${error.message}`, {
            stack: error.stack,
            role_id: role_id,
            error_message: error.message
        });
        
        if (error.code === '23505') {
            throw new Error('Role with this name already exists');
        }

        throw new Error('Role update failed due to an unexpected error');
    }
};

/**
 * Get all roles with pagination
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {string} options.sortBy - Sort field (default: 'created_at')
 * @param {string} options.sortOrder - Sort order (default: 'DESC')
 * @returns {Object} Paginated roles data
 */
export const getAllRoles = async (options = {}) => {
    const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'DESC'
    } = options;
    
    const offset = (page - 1) * limit;
    
    // Updated allowed fields to match your table structure
    const allowedSortFields = ['role_id', 'role_name', 'role_description', 'created_at'];
    const allowedSortOrders = ['ASC', 'DESC'];
    
    if (!allowedSortFields.includes(sortBy) || !allowedSortOrders.includes(sortOrder.toUpperCase())) {
        throw new Error('Invalid sort parameters');
    }
    
    // Fixed: Match your table structure - no deleted_at column
    const queryText = `
        SELECT role_id, role_name, role_description, created_at,
               COUNT(*) OVER() as total_count
        FROM roles 
        ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $1 OFFSET $2`;
    
    const values = [limit, offset];
    
    try {
        logger.debug(`Fetching roles: page=${page}, limit=${limit}, sortBy=${sortBy}`);
        const result = await pool.query(queryText, values);
        
        const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
        const totalPages = Math.ceil(totalCount / limit);
        
        // Remove total_count from individual rows
        const roles = result.rows.map(row => {
            const { total_count, ...role } = row;
            return role;
        });
        
        logger.info(`Retrieved ${roles.length} roles (page ${page}/${totalPages})`);
        
        return {
            success: true,
            data: roles,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalCount,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            message: 'Roles retrieved successfully'
        };
    } catch (error) {
        logger.error(`Error fetching roles: ${error.message}`, {
            page,
            limit,
            sortBy,
            error: error.message,
            stack: error.stack
        });
        throw new Error(`Failed to retrieve roles: ${error.message}`);
    }
};


/**
 * Get role by ID
 * @param {number} roleId - Role ID
 * @returns {Object} Role data
 */
export const getRoleById = async (roleId) => {
    // Fixed: Use role_id and remove deleted_at check
    const queryText = `
        SELECT role_id, role_name, role_description, created_at 
        FROM roles 
        WHERE role_id = $1`;
    
    try {
        logger.debug(`Fetching role by ID: ${roleId}`);
        const result = await pool.query(queryText, [roleId]);
        
        if (result.rows.length === 0) {
            logger.warn(`Role not found: ID ${roleId}`);
            return {
                success: false,
                data: null,
                message: 'Role not found'
            };
        }
        
        logger.info(`Role retrieved: ${result.rows[0].role_name} (ID: ${roleId})`);
        return {
            success: true,
            data: result.rows[0],
            message: 'Role retrieved successfully'
        };
    } catch (error) {
        logger.error(`Error fetching role by ID: ${error.message}`, {
            roleId,
            error: error.message,
            stack: error.stack
        });
        throw new Error(`Failed to retrieve role: ${error.message}`);
    }
};

/**
 * Delete role (hard delete since no deleted_at column)
 * @param {number} roleId - Role ID
 * @returns {Object} Deletion result
 */
export const deleteRole = async (roleId) => {
    // Fixed: Hard delete since your table doesn't have deleted_at
    const queryText = `
        DELETE FROM roles 
        WHERE role_id = $1
        RETURNING role_id, role_name`;
    
    try {
        logger.debug(`Deleting role ID: ${roleId}`);
        const result = await pool.query(queryText, [roleId]);
        
        if (result.rows.length === 0) {
            logger.warn(`Role not found for deletion: ID ${roleId}`);
            return {
                success: false,
                data: null,
                message: 'Role not found'
            };
        }
        
        logger.info(`Role deleted: ${result.rows[0].role_name} (ID: ${roleId})`);
        return {
            success: true,
            data: { id: roleId },
            message: 'Role deleted successfully'
        };
    } catch (error) {
        logger.error(`Error deleting role: ${error.message}`, {
            roleId,
            error: error.message,
            stack: error.stack
        });
        throw new Error(`Failed to delete role: ${error.message}`);
    }
};


/**
 * Check if role exists by name
 * @param {string} roleName - Role name
 * @returns {boolean} Role exists
 */
export const roleExistsByName = async (roleName) => {
    // Fixed: Use role_id and remove deleted_at check
    const queryText = `
        SELECT role_id FROM roles 
        WHERE LOWER(role_name) = LOWER($1)`;
    
    try {
        const result = await pool.query(queryText, [roleName]);
        return result.rows.length > 0;
    } catch (error) {
        logger.error(`Error checking role existence: ${error.message}`, {
            roleName,
            error: error.message
        });
        throw new Error(`Failed to check role existence: ${error.message}`);
    }
};