import logger from '../utils/logger.js';
import pool from './connection.js';

// Create a new company
export const createCompany = async (company) => {
    const client = await pool.connect();
    try {
        logger.info('createCompany: Creating a new company record');
        await client.query('BEGIN');

        // Check if company name already exists
        const checkQuery = `SELECT company_id FROM companies WHERE company_name = $1`;
        const checkResult = await client.query(checkQuery, [company.company_name]);
        
        if (checkResult.rows.length > 0) {
            throw new Error('Company with this name already exists');
        }

        const insertQuery = `
            INSERT INTO companies (
                company_name,
                company_type,
                website,
                contact_person,
                contact_email,
                contact_phone,
                created_at,
                company_logo
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;

        const values = [
            company.company_name,
            company.company_type || null,
            company.website || null,
            company.contact_person || null,
            company.contact_email || null,
            company.contact_phone || null,
            new Date(),
            company.company_logo || null
        ];

        const result = await client.query(insertQuery, values);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Company created successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`createCompany: ${error.message}`, {
            stack: error.stack,
            company
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get all companies with pagination and multi-field search
export const getAllCompanies = async (params = {}) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            sortBy = 'company_id', 
            sortOrder = 'ASC',
            search = ''
        } = params;

        const offset = (page - 1) * limit;
        
        // Validate sortBy to prevent SQL injection
        const allowedSortFields = ['company_id', 'company_name', 'company_type', 'contact_person', 'created_at'];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'company_id';
        const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        let countQuery = 'SELECT COUNT(*) as total FROM companies';
        let dataQuery = `SELECT * FROM companies`;
        let queryParams = [];
        let paramIndex = 1;

        // Multi-field search across company_name, company_type, contact_person, contact_email
        if (search && search.trim()) {
            const searchCondition = `
                WHERE company_name ILIKE $${paramIndex}
                   OR company_type ILIKE $${paramIndex}
                   OR contact_person ILIKE $${paramIndex}
                   OR contact_email ILIKE $${paramIndex}
            `;
            countQuery += searchCondition;
            dataQuery += searchCondition;
            queryParams.push(`%${search.trim()}%`);
            paramIndex++;
        }

        // Get total count
        const countResult = await pool.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].total);

        // Get paginated data
        dataQuery += ` ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const dataResult = await pool.query(dataQuery, queryParams);

        const totalPages = Math.ceil(total / limit);

        logger.info(`getAllCompanies: Retrieved ${dataResult.rows.length} companies`);

        return {
            success: true,
            data: {
                companies: dataResult.rows,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: totalPages,
                    total_count: total,
                    limit: parseInt(limit),
                    has_next: page < totalPages,
                    has_prev: page > 1
                }
            },
            message: 'Companies retrieved successfully'
        };
    } catch (error) {
        logger.error(`getAllCompanies: ${error.message}`, {
            stack: error.stack,
            params
        });
        throw error;
    }
};

// Get company by ID
export const getCompanyById = async (companyId) => {
    try {
        logger.info(`getCompanyById: Fetching company with ID ${companyId}`);
        
        const selectQuery = `SELECT * FROM companies WHERE company_id = $1`;
        const result = await pool.query(selectQuery, [companyId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                data: null,
                message: 'Company not found'
            };
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'Company fetched successfully'
        };
    } catch (error) {
        logger.error(`getCompanyById: ${error.message}`, {
            stack: error.stack,
            companyId
        });
        throw error;
    }
};

// Update company by ID
export const updateCompany = async (companyId, company) => {
    const client = await pool.connect();
    try {
        logger.info(`updateCompany: Updating company with ID ${companyId}`);
        await client.query('BEGIN');

        // Check if company exists
        const checkExistQuery = `SELECT company_id FROM companies WHERE company_id = $1`;
        const existResult = await client.query(checkExistQuery, [companyId]);
        
        if (existResult.rows.length === 0) {
            throw new Error('Company not found');
        }

        // Check if new company name conflicts with another company
        if (company.company_name) {
            const checkNameQuery = `SELECT company_id FROM companies WHERE company_name = $1 AND company_id != $2`;
            const nameResult = await client.query(checkNameQuery, [company.company_name, companyId]);
            
            if (nameResult.rows.length > 0) {
                throw new Error('Company with this name already exists');
            }
        }

        const updateQuery = `
            UPDATE companies SET
                company_name = COALESCE($1, company_name),
                company_type = COALESCE($2, company_type),
                website = COALESCE($3, website),
                contact_person = COALESCE($4, contact_person),
                contact_email = COALESCE($5, contact_email),
                contact_phone = COALESCE($6, contact_phone),
                company_logo = COALESCE($7, company_logo)
            WHERE company_id = $8
            RETURNING *
        `;

        const values = [
            company.company_name || null,
            company.company_type || null,
            company.website || null,
            company.contact_person || null,
            company.contact_email || null,
            company.contact_phone || null,
            company.company_logo || null,
            companyId
        ];

        const result = await client.query(updateQuery, values);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Company updated successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`updateCompany: ${error.message}`, {
            stack: error.stack,
            companyId,
            company
        });
        throw error;
    } finally {
        client.release();
    }
};

// Delete company by ID
export const deleteCompany = async (companyId) => {
    const client = await pool.connect();
    try {
        logger.info(`deleteCompany: Deleting company with ID ${companyId}`);
        await client.query('BEGIN');

        // Check if company exists
        const checkQuery = `SELECT company_id FROM companies WHERE company_id = $1`;
        const checkResult = await client.query(checkQuery, [companyId]);
        
        if (checkResult.rows.length === 0) {
            throw new Error('Company not found');
        }

        const deleteQuery = `DELETE FROM companies WHERE company_id = $1 RETURNING *`;
        const result = await client.query(deleteQuery, [companyId]);
        
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Company deleted successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`deleteCompany: ${error.message}`, {
            stack: error.stack,
            companyId
        });
        throw error;
    } finally {
        client.release();
    }
};
