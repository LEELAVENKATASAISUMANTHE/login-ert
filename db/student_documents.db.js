import logger from '../utils/logger.js';
import pool from './connection.js';

// Create a new student document record
export const createStudentDocument = async (document) => {
    const client = await pool.connect();

    try {
        logger.info('createStudentDocument: Creating a new student document record');
        await client.query('BEGIN');

        const insertQuery = `
            INSERT INTO student_documents (
                student_id,
                document_type,
                file_path,
                uploaded_at
            ) VALUES ($1, $2, $3, NOW())
            RETURNING *
        `;

        const values = [
            document.student_id,
            document.document_type || null,
            document.file_path || null
        ];

        const result = await client.query(insertQuery, values);
        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student document created successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`createStudentDocument: ${error.message}`, {
            stack: error.stack,
            document
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get all student documents
export const getAllStudentDocuments = async () => {
    const client = await pool.connect();

    try {
        logger.info('getAllStudentDocuments: Fetching all student documents');

        const selectQuery = `
            SELECT 
                sd.*,
                s.full_name as student_name
            FROM student_documents sd
            LEFT JOIN students s ON sd.student_id = s.student_id
            ORDER BY sd.uploaded_at DESC
        `;

        const result = await client.query(selectQuery);

        return {
            success: true,
            data: result.rows,
            message: 'Student documents fetched successfully',
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getAllStudentDocuments: ${error.message}`, {
            stack: error.stack
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get student document by ID
export const getStudentDocumentById = async (docId) => {
    const client = await pool.connect();

    try {
        logger.info('getStudentDocumentById: Fetching student document by ID', { docId });

        const selectQuery = `
            SELECT 
                sd.*,
                s.full_name as student_name
            FROM student_documents sd
            LEFT JOIN students s ON sd.student_id = s.student_id
            WHERE sd.doc_id = $1
        `;

        const result = await client.query(selectQuery, [docId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                message: 'Student document not found'
            };
        }

        return {
            success: true,
            data: result.rows[0],
            message: 'Student document fetched successfully'
        };
    } catch (error) {
        logger.error(`getStudentDocumentById: ${error.message}`, {
            stack: error.stack,
            docId
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get all documents for a specific student
export const getDocumentsByStudentId = async (studentId) => {
    const client = await pool.connect();

    try {
        logger.info('getDocumentsByStudentId: Fetching documents for student', { studentId });

        const selectQuery = `
            SELECT 
                sd.*,
                s.full_name as student_name
            FROM student_documents sd
            LEFT JOIN students s ON sd.student_id = s.student_id
            WHERE sd.student_id = $1
            ORDER BY sd.uploaded_at DESC
        `;

        const result = await client.query(selectQuery, [studentId]);

        return {
            success: true,
            data: result.rows,
            message: 'Student documents fetched successfully',
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getDocumentsByStudentId: ${error.message}`, {
            stack: error.stack,
            studentId
        });
        throw error;
    } finally {
        client.release();
    }
};

// Update student document by ID
export const updateStudentDocumentById = async (docId, document) => {
    const client = await pool.connect();

    try {
        logger.info('updateStudentDocumentById: Updating student document', { docId });
        await client.query('BEGIN');

        const updateQuery = `
            UPDATE student_documents
            SET 
                student_id = $1,
                document_type = $2,
                file_path = $3
            WHERE doc_id = $4
            RETURNING *
        `;

        const values = [
            document.student_id,
            document.document_type || null,
            document.file_path || null,
            docId
        ];

        const result = await client.query(updateQuery, values);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return {
                success: false,
                message: 'Student document not found'
            };
        }

        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student document updated successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`updateStudentDocumentById: ${error.message}`, {
            stack: error.stack,
            docId,
            document
        });
        throw error;
    } finally {
        client.release();
    }
};

// Delete student document by ID
export const deleteStudentDocumentById = async (docId) => {
    const client = await pool.connect();

    try {
        logger.info('deleteStudentDocumentById: Deleting student document', { docId });
        await client.query('BEGIN');

        const deleteQuery = `
            DELETE FROM student_documents
            WHERE doc_id = $1
            RETURNING *
        `;

        const result = await client.query(deleteQuery, [docId]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return {
                success: false,
                message: 'Student document not found'
            };
        }

        await client.query('COMMIT');

        return {
            success: true,
            data: result.rows[0],
            message: 'Student document deleted successfully'
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`deleteStudentDocumentById: ${error.message}`, {
            stack: error.stack,
            docId
        });
        throw error;
    } finally {
        client.release();
    }
};

// Bulk insert student documents (for Excel import - metadata only)
export const bulkInsertStudentDocuments = async (documents) => {
    const client = await pool.connect();

    try {
        logger.info('bulkInsertStudentDocuments: Bulk inserting student documents', {
            count: documents.length
        });
        await client.query('BEGIN');

        const results = {
            successful: [],
            failed: []
        };

        for (let i = 0; i < documents.length; i++) {
            const document = documents[i];
            const rowNumber = i + 2; // +2 because Excel row 1 is header, data starts at row 2

            try {
                const insertQuery = `
                    INSERT INTO student_documents (
                        student_id,
                        document_type,
                        file_path,
                        uploaded_at
                    ) VALUES ($1, $2, $3, NOW())
                    RETURNING *
                `;

                const values = [
                    document.student_id,
                    document.document_type || null,
                    document.file_path || null
                ];

                const result = await client.query(insertQuery, values);
                results.successful.push({
                    row: rowNumber,
                    data: result.rows[0]
                });
            } catch (rowError) {
                results.failed.push({
                    row: rowNumber,
                    data: document,
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
        logger.error(`bulkInsertStudentDocuments: ${error.message}`, {
            stack: error.stack
        });
        throw error;
    } finally {
        client.release();
    }
};
