import logger from '../utils/logger.js';
import pool from './connection.js';

// Create a new student project record
export const createStudentProject = async (project) => {
    const client = await pool.connect();

    try {
        logger.info('createStudentProject: Creating a new student project record');
        await client.query('BEGIN');

        const insertQuery = `
            INSERT INTO student_projects (
                student_id,
                title,
                description,
                tools_used,
                repo_link
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

        const values = [
            project.student_id,
            project.title || null,
            project.description || null,
            project.tools_used || null,
            project.repo_link || null
        ];

        const result = await client.query(insertQuery, values);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student project created successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`createStudentProject: ${error.message}`, {
            stack: error.stack,
            project
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get all student projects
export const getAllStudentProjects = async () => {
    const client = await pool.connect();

    try {
        logger.info('getAllStudentProjects: Fetching all student projects');

        const selectQuery = `
            SELECT 
                sp.*,
                s.full_name as student_name
            FROM student_projects sp
            LEFT JOIN students s ON sp.student_id = s.student_id
            ORDER BY sp.project_id DESC
        `;

        const result = await client.query(selectQuery);

        return {
            success: true,
            data: result.rows,
            message: 'Student projects fetched successfully',
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getAllStudentProjects: ${error.message}`, {
            stack: error.stack
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get student project by ID
export const getStudentProjectById = async (projectId) => {
    const client = await pool.connect();

    try {
        logger.info('getStudentProjectById: Fetching student project by ID', { projectId });

        const selectQuery = `
            SELECT 
                sp.*,
                s.full_name as student_name
            FROM student_projects sp
            LEFT JOIN students s ON sp.student_id = s.student_id
            WHERE sp.project_id = $1
        `;

        const result = await client.query(selectQuery, [projectId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                message: 'Student project not found'
            };
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'Student project fetched successfully'
        };
    } catch (error) {
        logger.error(`getStudentProjectById: ${error.message}`, {
            stack: error.stack,
            projectId
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get all projects for a specific student
export const getProjectsByStudentId = async (studentId) => {
    const client = await pool.connect();

    try {
        logger.info('getProjectsByStudentId: Fetching projects for student', { studentId });

        const selectQuery = `
            SELECT 
                sp.*,
                s.full_name as student_name
            FROM student_projects sp
            LEFT JOIN students s ON sp.student_id = s.student_id
            WHERE sp.student_id = $1
            ORDER BY sp.project_id DESC
        `;

        const result = await client.query(selectQuery, [studentId]);

        return {
            success: true,
            data: result.rows,
            message: 'Student projects fetched successfully',
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getProjectsByStudentId: ${error.message}`, {
            stack: error.stack,
            studentId
        });
        throw error;
    } finally {
        client.release();
    }
};

// Search projects by tools used
export const searchProjectsByTools = async (tools) => {
    const client = await pool.connect();

    try {
        logger.info('searchProjectsByTools: Searching projects by tools', { tools });

        // Split tools by comma and create ILIKE conditions for each
        const toolsArray = tools.split(',').map(t => t.trim().toLowerCase());
        
        // Build dynamic WHERE clause for multiple tools (OR condition)
        const conditions = toolsArray.map((_, index) => `LOWER(sp.tools_used) LIKE $${index + 1}`);
        const values = toolsArray.map(tool => `%${tool}%`);

        const selectQuery = `
            SELECT 
                sp.*,
                s.full_name as student_name
            FROM student_projects sp
            LEFT JOIN students s ON sp.student_id = s.student_id
            WHERE ${conditions.join(' OR ')}
            ORDER BY sp.project_id DESC
        `;

        const result = await client.query(selectQuery, values);

        return {
            success: true,
            data: result.rows,
            message: `Found ${result.rows.length} projects using specified tools`,
            count: result.rows.length,
            searchedTools: toolsArray
        };
    } catch (error) {
        logger.error(`searchProjectsByTools: ${error.message}`, {
            stack: error.stack,
            tools
        });
        throw error;
    } finally {
        client.release();
    }
};

// Update student project by ID
export const updateStudentProjectById = async (projectId, project) => {
    const client = await pool.connect();

    try {
        logger.info('updateStudentProjectById: Updating student project', { projectId });
        await client.query('BEGIN');

        const updateQuery = `
            UPDATE student_projects
            SET 
                student_id = $1,
                title = $2,
                description = $3,
                tools_used = $4,
                repo_link = $5
            WHERE project_id = $6
            RETURNING *
        `;

        const values = [
            project.student_id,
            project.title || null,
            project.description || null,
            project.tools_used || null,
            project.repo_link || null,
            projectId
        ];

        const result = await client.query(updateQuery, values);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return {
                success: false,
                message: 'Student project not found'
            };
        }

        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student project updated successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`updateStudentProjectById: ${error.message}`, {
            stack: error.stack,
            projectId,
            project
        });
        throw error;
    } finally {
        client.release();
    }
};

// Delete student project by ID
export const deleteStudentProjectById = async (projectId) => {
    const client = await pool.connect();

    try {
        logger.info('deleteStudentProjectById: Deleting student project', { projectId });
        await client.query('BEGIN');

        const deleteQuery = `
            DELETE FROM student_projects
            WHERE project_id = $1
            RETURNING *
        `;

        const result = await client.query(deleteQuery, [projectId]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return {
                success: false,
                message: 'Student project not found'
            };
        }

        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student project deleted successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`deleteStudentProjectById: ${error.message}`, {
            stack: error.stack,
            projectId
        });
        throw error;
    } finally {
        client.release();
    }
};

// Bulk insert student projects (for Excel import)
export const bulkInsertStudentProjects = async (projects) => {
    const client = await pool.connect();

    try {
        logger.info('bulkInsertStudentProjects: Bulk inserting student projects', {
            count: projects.length
        });
        await client.query('BEGIN');

        const results = {
            successful: [],
            failed: []
        };

        for (let i = 0; i < projects.length; i++) {
            const project = projects[i];
            const rowNumber = i + 2; // +2 because Excel row 1 is header, data starts at row 2

            try {
                const insertQuery = `
                    INSERT INTO student_projects (
                        student_id,
                        title,
                        description,
                        tools_used,
                        repo_link
                    ) VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                `;

                const values = [
                    project.student_id,
                    project.title || null,
                    project.description || null,
                    project.tools_used || null,
                    project.repo_link || null
                ];

                const result = await client.query(insertQuery, values);
                results.successful.push({
                    row: rowNumber,
                    data: result.rows[0]
                });
            } catch (rowError) {
                results.failed.push({
                    row: rowNumber,
                    data: project,
                    error: rowError.message,
                    code: rowError.code
                });
            }
        }

        // If all failed, rollback
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
        logger.error(`bulkInsertStudentProjects: ${error.message}`, {
            stack: error.stack
        });
        throw error;
    } finally {
        client.release();
    }
};
