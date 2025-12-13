import pool from './connection.js';
import logger from '../utils/logger.js';

// Assign a single permission to a role
export const assignPermissionToRole = async (data) => {
    const client = await pool.connect();
    
    try {
        logger.info(`assignPermissionToRole: Attempting to assign permission ${data.permission_id} to role ${data.role_id}`);
        
        await client.query('BEGIN');
        
        // Check if role exists
        const roleCheck = await client.query('SELECT role_id FROM roles WHERE role_id = $1', [data.role_id]);
        if (roleCheck.rows.length === 0) {
            throw new Error('Role not found');
        }
        
        // Check if permission exists
        const permissionCheck = await client.query('SELECT permission_id FROM permissions WHERE permission_id = $1', [data.permission_id]);
        if (permissionCheck.rows.length === 0) {
            throw new Error('Permission not found');
        }
        
        // Check if assignment already exists
        const existingAssignment = await client.query(
            'SELECT role_id, permission_id FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
            [data.role_id, data.permission_id]
        );
        
        if (existingAssignment.rows.length > 0) {
            throw new Error('Permission is already assigned to this role');
        }
        
        // Insert the assignment
        const insertQuery = `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) RETURNING *`;
        const result = await client.query(insertQuery, [data.role_id, data.permission_id]);
        
        await client.query('COMMIT');
        
        logger.info(`assignPermissionToRole: Successfully assigned permission ${data.permission_id} to role ${data.role_id}`);
        
        return {
            success: true,
            data: result.rows[0],
            message: 'Permission assigned to role successfully'
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`assignPermissionToRole: ${error.message}`, {
            stack: error.stack,
            role_id: data.role_id,
            permission_id: data.permission_id
        });
        throw error;
    } finally {
        client.release();
    }
};

// Assign multiple permissions to a role
export const assignPermissionsToRole = async (data) => {
    const client = await pool.connect();
    
    try {
        logger.info(`assignPermissionsToRole: Attempting to assign ${data.permission_ids.length} permissions to role ${data.role_id}`);
        
        await client.query('BEGIN');
        
        // Check if role exists
        const roleCheck = await client.query('SELECT role_id FROM roles WHERE role_id = $1', [data.role_id]);
        if (roleCheck.rows.length === 0) {
            throw new Error('Role not found');
        }
        
        const assignments = [];
        const duplicates = [];
        const invalidPermissions = [];
        
        for (const permission_id of data.permission_ids) {
            // Check if permission exists
            const permissionCheck = await client.query('SELECT permission_id FROM permissions WHERE permission_id = $1', [permission_id]);
            if (permissionCheck.rows.length === 0) {
                invalidPermissions.push(permission_id);
                continue;
            }
            
            // Check if assignment already exists
            const existingAssignment = await client.query(
                'SELECT role_id, permission_id FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
                [data.role_id, permission_id]
            );
            
            if (existingAssignment.rows.length > 0) {
                duplicates.push(permission_id);
                continue;
            }
            
            // Insert the assignment
            const insertQuery = `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) RETURNING *`;
            const result = await client.query(insertQuery, [data.role_id, permission_id]);
            assignments.push(result.rows[0]);
        }
        
        await client.query('COMMIT');
        
        logger.info(`assignPermissionsToRole: Successfully assigned ${assignments.length} permissions to role ${data.role_id}`);
        
        return {
            success: true,
            data: {
                assignments,
                duplicates,
                invalid_permissions: invalidPermissions,
                summary: {
                    total_requested: data.permission_ids.length,
                    successfully_assigned: assignments.length,
                    duplicates: duplicates.length,
                    invalid: invalidPermissions.length
                }
            },
            message: `Assigned ${assignments.length} permissions to role successfully`
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`assignPermissionsToRole: ${error.message}`, {
            stack: error.stack,
            role_id: data.role_id,
            permission_ids: data.permission_ids
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get permissions for a specific role with pagination
export const getRolePermissions = async (params) => {
    const { role_id, page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;
    
    try {
        logger.debug(`getRolePermissions: Fetching permissions for role ${role_id}, page ${page}, limit ${limit}`);
        
        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM role_permissions rp
            INNER JOIN permissions p ON rp.permission_id = p.permission_id
            INNER JOIN roles r ON rp.role_id = r.role_id
            WHERE rp.role_id = $1
        `;
        const countResult = await pool.query(countQuery, [role_id]);
        const total = parseInt(countResult.rows[0].total);
        
        // Get paginated data
        const dataQuery = `
            SELECT 
                rp.role_id,
                rp.permission_id,
                r.role_name,
                p.permission_name,
                p.module,
                p.description as permission_description
            FROM role_permissions rp
            INNER JOIN permissions p ON rp.permission_id = p.permission_id
            INNER JOIN roles r ON rp.role_id = r.role_id
            WHERE rp.role_id = $1
            ORDER BY p.permission_name
            LIMIT $2 OFFSET $3
        `;
        const dataResult = await pool.query(dataQuery, [role_id, limit, offset]);
        
        const totalPages = Math.ceil(total / limit);
        
        logger.debug(`getRolePermissions: Found ${dataResult.rows.length} permissions for role ${role_id}`);
        
        return {
            success: true,
            data: {
                role_permissions: dataResult.rows,
                pagination: {
                    current_page: page,
                    total_pages: totalPages,
                    total_count: total,
                    limit: limit,
                    has_next: page < totalPages,
                    has_prev: page > 1
                }
            },
            message: 'Role permissions retrieved successfully'
        };
        
    } catch (error) {
        logger.error(`getRolePermissions: ${error.message}`, {
            stack: error.stack,
            role_id,
            page,
            limit
        });
        throw new Error('Failed to retrieve role permissions');
    }
};

// Get all role-permission assignments with optional filtering
export const getAllRolePermissions = async (params) => {
    const { page = 1, limit = 10, role_id, permission_id } = params;
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    let values = [];
    let paramIndex = 1;
    
    if (role_id) {
        whereConditions.push(`rp.role_id = $${paramIndex}`);
        values.push(role_id);
        paramIndex++;
    }
    
    if (permission_id) {
        whereConditions.push(`rp.permission_id = $${paramIndex}`);
        values.push(permission_id);
        paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    try {
        logger.debug(`getAllRolePermissions: Fetching all role permissions, page ${page}, limit ${limit}`);
        
        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM role_permissions rp
            INNER JOIN permissions p ON rp.permission_id = p.permission_id
            INNER JOIN roles r ON rp.role_id = r.role_id
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].total);
        
        // Get paginated data
        const dataQuery = `
            SELECT 
                rp.role_id,
                rp.permission_id,
                r.role_name,
                r.description as role_description,
                p.permission_name,
                p.module,
                p.description as permission_description
            FROM role_permissions rp
            INNER JOIN permissions p ON rp.permission_id = p.permission_id
            INNER JOIN roles r ON rp.role_id = r.role_id
            ${whereClause}
            ORDER BY r.role_name, p.permission_name
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...values, limit, offset]);
        
        const totalPages = Math.ceil(total / limit);
        
        logger.debug(`getAllRolePermissions: Found ${dataResult.rows.length} role permission assignments`);
        
        return {
            success: true,
            data: {
                role_permissions: dataResult.rows,
                pagination: {
                    current_page: page,
                    total_pages: totalPages,
                    total_count: total,
                    limit: limit,
                    has_next: page < totalPages,
                    has_prev: page > 1
                }
            },
            message: 'Role permissions retrieved successfully'
        };
        
    } catch (error) {
        logger.error(`getAllRolePermissions: ${error.message}`, {
            stack: error.stack,
            params
        });
        throw new Error('Failed to retrieve role permissions');
    }
};

// Remove a specific permission from a role
export const removePermissionFromRole = async (data) => {
    const client = await pool.connect();
    
    try {
        logger.info(`removePermissionFromRole: Attempting to remove permission ${data.permission_id} from role ${data.role_id}`);
        
        await client.query('BEGIN');
        
        // Check if the assignment exists
        const checkQuery = `
            SELECT role_id, permission_id
            FROM role_permissions
            WHERE role_id = $1 AND permission_id = $2
        `;
        const checkResult = await client.query(checkQuery, [data.role_id, data.permission_id]);
        
        if (checkResult.rows.length === 0) {
            throw new Error('Permission assignment not found for this role');
        }
        
        // Remove the assignment
        const deleteQuery = `DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2 RETURNING *`;
        const result = await client.query(deleteQuery, [data.role_id, data.permission_id]);
        
        await client.query('COMMIT');
        
        logger.info(`removePermissionFromRole: Successfully removed permission ${data.permission_id} from role ${data.role_id}`);
        
        return {
            success: true,
            data: result.rows[0],
            message: 'Permission removed from role successfully'
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`removePermissionFromRole: ${error.message}`, {
            stack: error.stack,
            role_id: data.role_id,
            permission_id: data.permission_id
        });
        throw error;
    } finally {
        client.release();
    }
};

// Remove all permissions from a role
export const removeAllPermissionsFromRole = async (role_id) => {
    const client = await pool.connect();
    
    try {
        logger.info(`removeAllPermissionsFromRole: Attempting to remove all permissions from role ${role_id}`);
        
        await client.query('BEGIN');
        
        // Check if role exists
        const roleCheck = await client.query('SELECT role_id FROM roles WHERE role_id = $1', [role_id]);
        if (roleCheck.rows.length === 0) {
            throw new Error('Role not found');
        }
        
        // Get count of permissions before deletion
        const countQuery = `SELECT COUNT(*) as count FROM role_permissions WHERE role_id = $1`;
        const countResult = await client.query(countQuery, [role_id]);
        const permissionCount = parseInt(countResult.rows[0].count);
        
        // Remove all permissions for the role
        const deleteQuery = `DELETE FROM role_permissions WHERE role_id = $1 RETURNING *`;
        const result = await client.query(deleteQuery, [role_id]);
        
        await client.query('COMMIT');
        
        logger.info(`removeAllPermissionsFromRole: Successfully removed ${result.rows.length} permissions from role ${role_id}`);
        
        return {
            success: true,
            data: {
                removed_count: result.rows.length,
                removed_permissions: result.rows
            },
            message: `Successfully removed ${result.rows.length} permissions from role`
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`removeAllPermissionsFromRole: ${error.message}`, {
            stack: error.stack,
            role_id
        });
        throw error;
    } finally {
        client.release();
    }
};