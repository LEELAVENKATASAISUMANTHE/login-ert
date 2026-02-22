import logger from '../utils/logger.js';
import pool from './connection.js';

// Get complete student report data (all tables)
export const getStudentFullReport = async (studentId) => {
    const client = await pool.connect();

    try {
        logger.info('getStudentFullReport: Fetching complete student data', { studentId });

        // Fetch student basic info
        const studentQuery = `
            SELECT * FROM students WHERE student_id = $1
        `;
        const studentResult = await client.query(studentQuery, [studentId]);

        if (studentResult.rows.length === 0) {
            return {
                success: false,
                message: 'Student not found'
            };
        }

        const student = studentResult.rows[0];

        // Initialize empty results
        let addressResult = { rows: [] };
        let academicsResult = { rows: [] };
        let familyResult = { rows: [] };
        let languagesResult = { rows: [] };
        let internshipsResult = { rows: [] };
        let projectsResult = { rows: [] };
        let certificationsResult = { rows: [] };
        let documentsResult = { rows: [] };

        // Fetch student address (with try-catch for each table)
        try {
            const addressQuery = `SELECT * FROM student_addresses WHERE student_id = $1`;
            addressResult = await client.query(addressQuery, [studentId]);
        } catch (e) {
            logger.warn('student_addresses table not found or error', { error: e.message });
        }

        // Fetch student academics
        try {
            const academicsQuery = `SELECT * FROM student_academics WHERE student_id = $1`;
            academicsResult = await client.query(academicsQuery, [studentId]);
        } catch (e) {
            logger.warn('student_academics table not found or error', { error: e.message });
        }

        // Fetch student family
        try {
            const familyQuery = `SELECT * FROM student_family WHERE student_id = $1`;
            familyResult = await client.query(familyQuery, [studentId]);
        } catch (e) {
            logger.warn('student_family table not found or error', { error: e.message });
        }

        // Fetch student languages
        try {
            const languagesQuery = `SELECT * FROM student_languages WHERE student_id = $1`;
            languagesResult = await client.query(languagesQuery, [studentId]);
        } catch (e) {
            logger.warn('student_languages table not found or error', { error: e.message });
        }

        // Fetch student internships
        try {
            const internshipsQuery = `SELECT * FROM student_internships WHERE student_id = $1 ORDER BY start_date DESC`;
            internshipsResult = await client.query(internshipsQuery, [studentId]);
        } catch (e) {
            logger.warn('student_internships table not found or error', { error: e.message });
        }

        // Fetch student projects
        try {
            const projectsQuery = `SELECT * FROM student_projects WHERE student_id = $1 ORDER BY project_id DESC`;
            projectsResult = await client.query(projectsQuery, [studentId]);
        } catch (e) {
            logger.warn('student_projects table not found or error', { error: e.message });
        }

        // Fetch student certifications
        try {
            const certificationsQuery = `SELECT * FROM student_certifications WHERE student_id = $1 ORDER BY cert_id DESC`;
            certificationsResult = await client.query(certificationsQuery, [studentId]);
        } catch (e) {
            logger.warn('student_certifications table not found or error', { error: e.message });
        }

        // Fetch student documents
        try {
            const documentsQuery = `SELECT * FROM student_documents WHERE student_id = $1 ORDER BY uploaded_at DESC`;
            documentsResult = await client.query(documentsQuery, [studentId]);
        } catch (e) {
            logger.warn('student_documents table not found or error', { error: e.message });
        }

        return {
            success: true,
            data: {
                student: student,
                address: addressResult.rows[0] || null,
                academics: academicsResult.rows[0] || null,
                family: familyResult.rows[0] || null,
                languages: languagesResult.rows,
                internships: internshipsResult.rows,
                projects: projectsResult.rows,
                certifications: certificationsResult.rows,
                documents: documentsResult.rows
            },
            message: 'Student report data fetched successfully'
        };
    } catch (error) {
        logger.error(`getStudentFullReport: ${error.message}`, {
            stack: error.stack,
            studentId
        });
        throw error;
    } finally {
        client.release();
    }
};

// Get all students summary for batch report
export const getAllStudentsSummary = async () => {
    const client = await pool.connect();

    try {
        logger.info('getAllStudentsSummary: Fetching all students summary');

        const query = `
            SELECT 
                s.student_id,
                s.full_name,
                s.email,
                s.mobile,
                s.gender,
                s.branch,
                s.graduation_year,
                s.semester,
                s.placement_fee_status,
                sa.ug_cgpa,
                sa.tenth_percent,
                sa.twelfth_percent,
                sa.diploma_percent,
                sa.history_of_backs,
                (SELECT COUNT(*) FROM student_internships si WHERE si.student_id = s.student_id) as internship_count,
                (SELECT COUNT(*) FROM student_projects sp WHERE sp.student_id = s.student_id) as project_count,
                (SELECT COUNT(*) FROM student_certifications sc WHERE sc.student_id = s.student_id) as certification_count
            FROM students s
            LEFT JOIN student_academics sa ON s.student_id = sa.student_id
            ORDER BY s.full_name
        `;

        const result = await client.query(query);

        return {
            success: true,
            data: result.rows,
            message: 'Students summary fetched successfully',
            count: result.rows.length
        };
    } catch (error) {
        logger.error(`getAllStudentsSummary: ${error.message}`, {
            stack: error.stack
        });
        throw error;
    } finally {
        client.release();
    }
};
