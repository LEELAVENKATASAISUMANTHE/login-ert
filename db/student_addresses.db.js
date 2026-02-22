import logger from '../utils/logger.js';
import pool from './connection.js';

const ALLOWED_ADDRESS_FIELDS = [
    'student_id', 'permanent_address', 'permanent_city', 'permanent_state',
    'permanent_pin', 'permanent_contact', 'current_address', 'current_city',
    'current_state', 'current_pin'
];

export const getStudentsMenu = async (searchParams = {}) => {
    const client = await pool.connect();
    try {
        logger.info('getStudentsMenu: Fetching students menu list', { searchParams });
        
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
            } else if (searchField === 'address_id') {
                whereClause = 'WHERE sa.address_id::text ILIKE $1';
                values.push(searchValue);
            } else {
                // Search across all fields if no specific field is selected
                whereClause = `WHERE s.student_id ILIKE $1 
                               OR s.full_name ILIKE $1 
                               OR sa.address_id::text ILIKE $1`;
                values.push(searchValue);
            }
        }
        
        const selectQuery = `
            SELECT 
                sa.address_id,
                s.student_id,
                s.full_name
            FROM students s
            LEFT JOIN student_addresses sa ON s.student_id = sa.student_id
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
        logger.error(`getStudentsMenu: ${error.message}`, {
            stack: error.stack
        });
        throw error;
    } finally {
        client.release();
    }
};

export const createStudentAddress = async (address) => {
    const client = await pool.connect();

    try {
        logger.info('createStudentAddress: Creating a new student address record');
        await client.query('BEGIN');

        const insertQuery = `
            INSERT INTO student_addresses (
                student_id,
                permanent_address,
                permanent_city,
                permanent_state,
                permanent_pin,
                permanent_contact,
                current_address,
                current_city,
                current_state,
                current_pin
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            )
            RETURNING *
        `;

        const values = [
            address.student_id,
            address.permanent_address || null,
            address.permanent_city || null,
            address.permanent_state || null,
            address.permanent_pin || null,
            address.permanent_contact || null,
            address.current_address || null,
            address.current_city || null,
            address.current_state || null,
            address.current_pin || null
        ];

        const result = await client.query(insertQuery, values);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student address created successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`createStudentAddress: ${error.message}`, {
            stack: error.stack,
            address
        });
        throw error;
    } finally {
        client.release();
    }
};

export const getStudentAddressById = async (addressId) => {
    try {
        logger.info(`getStudentAddressById: Fetching student address with ID ${addressId}`);
        const selectQuery = `SELECT * FROM student_addresses WHERE address_id = $1`;
        const result = await pool.query(selectQuery, [addressId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Student address not found'
            };
        }
        return {
            success: true,
            data: result.rows[0],
            message: 'Student address fetched successfully'
        };
    } catch (error) {
        logger.error(`getStudentAddressById: ${error.message}`, {
            stack: error.stack,
            addressId
        });
        throw error;
    }
};

export const getAddressByStudentId = async (studentId) => {
    try {
        logger.info(`getAddressByStudentId: Fetching address for student ID ${studentId}`);
        const selectQuery = `SELECT * FROM student_addresses WHERE student_id = $1`;
        const result = await pool.query(selectQuery, [studentId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'No address found for this student'
            };
        }
        return {
            success: true,
            data: result.rows[0],
            message: 'Student address fetched successfully'
        };
    } catch (error) {
        logger.error(`getAddressByStudentId: ${error.message}`, {
            stack: error.stack,
            studentId
        });
        throw error;
    }
};

export const getAllStudentAddresses = async () => {
    try {
        logger.info('getAllStudentAddresses: Fetching all student addresses');

        const selectQuery = `
            SELECT
                sa.address_id,
                sa.student_id,
                sa.permanent_address,
                sa.permanent_city,
                sa.permanent_state,
                sa.permanent_pin,
                sa.permanent_contact,
                sa.current_address,
                sa.current_city,
                sa.current_state,
                sa.current_pin,
                s.first_name,
                s.last_name,
                s.full_name
            FROM student_addresses sa
            LEFT JOIN students s ON sa.student_id = s.student_id
            ORDER BY sa.address_id DESC
        `;

        const result = await pool.query(selectQuery);

        return {
            success: true,
            data: result.rows,
            message: 'Student addresses fetched successfully',
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getAllStudentAddresses: ${error.message}`, {
            stack: error.stack
        });
        throw error;
    }
};

export const updateStudentAddressById = async (addressId, updateFields) => {
    const client = await pool.connect();
    try {
        logger.info(`updateStudentAddressById: Updating student address with ID ${addressId}`);
        await client.query('BEGIN');

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
            if (!ALLOWED_ADDRESS_FIELDS.includes(key)) {
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

        const updateQuery = `UPDATE student_addresses SET ${fields.join(', ')} WHERE address_id = $${index} RETURNING *`;
        values.push(addressId);
        const result = await client.query(updateQuery, values);
        await client.query('COMMIT');

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Student address not found'
            };
        }
        return {
            success: true,
            data: result.rows[0],
            message: 'Student address updated successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`updateStudentAddressById: ${error.message}`, {
            stack: error.stack,
            addressId,
            updateFields
        });
        throw error;
    } finally {
        client.release();
    }
};

export const patchStudentAddressById = async (addressId, updateFields) => {
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
            if (!ALLOWED_ADDRESS_FIELDS.includes(key)) {
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

        const updateQuery = `UPDATE student_addresses SET ${fields.join(', ')} WHERE address_id = $${index} RETURNING *`;
        values.push(addressId);
        const result = await client.query(updateQuery, values);

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Student address not found'
            };
        }
        return {
            success: true,
            data: result.rows[0],
            message: 'Student address updated successfully'
        };
    } catch (error) {
        logger.error(`patchStudentAddressById: ${error.message}`, {
            stack: error.stack,
            addressId,
            updateFields
        });
        throw error;
    } finally {
        client.release();
    }
};

export const deleteStudentAddressById = async (addressId) => {
    const client = await pool.connect();
    try {
        logger.info(`deleteStudentAddressById: Deleting student address with ID ${addressId}`);
        await client.query('BEGIN');
        const deleteQuery = `DELETE FROM student_addresses WHERE address_id = $1 RETURNING *`;
        const result = await client.query(deleteQuery, [addressId]);
        await client.query('COMMIT');

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Student address not found'
            };
        }
        return {
            success: true,
            data: result.rows[0],
            message: 'Student address deleted successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`deleteStudentAddressById: ${error.message}`, {
            stack: error.stack,
            addressId
        });
        throw error;
    } finally {
        client.release();
    }
};
