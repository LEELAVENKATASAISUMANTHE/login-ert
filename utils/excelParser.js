// utils/excelParser.js
import * as XLSX from 'xlsx';
import logger from './logger.js';

/**
 * Parse Excel file buffer and convert to JSON array
 * @param {Buffer} buffer - File buffer from multer
 * @param {Object} options - Parsing options
 * @returns {Object} - Parsed data with success status
 */
export const parseExcelBuffer = (buffer, options = {}) => {
    try {
        const { sheetIndex = 0, headerRow = 1 } = options;

        // Read workbook from buffer
        const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

        // Get the first sheet or specified sheet
        const sheetName = workbook.SheetNames[sheetIndex];
        if (!sheetName) {
            return {
                success: false,
                message: `Sheet at index ${sheetIndex} not found`,
                data: []
            };
        }

        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON with headers from first row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
            dateNF: 'yyyy-mm-dd',
            defval: null
        });

        if (jsonData.length === 0) {
            return {
                success: false,
                message: 'Excel file is empty or has no data rows',
                data: []
            };
        }

        logger.info(`parseExcelBuffer: Parsed ${jsonData.length} rows from sheet "${sheetName}"`);

        return {
            success: true,
            message: `Successfully parsed ${jsonData.length} rows`,
            data: jsonData,
            sheetName,
            rowCount: jsonData.length
        };

    } catch (error) {
        logger.error(`parseExcelBuffer: ${error.message}`, { stack: error.stack });
        return {
            success: false,
            message: `Failed to parse Excel file: ${error.message}`,
            data: []
        };
    }
};

/**
 * Validate parsed data against required columns
 * @param {Array} data - Parsed JSON array
 * @param {Array} requiredColumns - Array of required column names
 * @returns {Object} - Validation result
 */
export const validateColumns = (data, requiredColumns) => {
    if (!data || data.length === 0) {
        return {
            success: false,
            message: 'No data to validate',
            missingColumns: requiredColumns
        };
    }

    const firstRow = data[0];
    const existingColumns = Object.keys(firstRow);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
        return {
            success: false,
            message: `Missing required columns: ${missingColumns.join(', ')}`,
            missingColumns,
            existingColumns
        };
    }

    return {
        success: true,
        message: 'All required columns present',
        existingColumns
    };
};

/**
 * Generate Excel template buffer for download
 * @param {Array} columns - Array of column headers
 * @param {Array} sampleData - Optional sample data rows
 * @param {String} sheetName - Name for the worksheet
 * @returns {Buffer} - Excel file buffer
 */
export const generateExcelTemplate = (columns, sampleData = [], sheetName = 'Template') => {
    try {
        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();

        // Create data array with headers
        const data = [columns, ...sampleData];

        // Create worksheet from array
        const worksheet = XLSX.utils.aoa_to_sheet(data);

        // Set column widths
        const colWidths = columns.map(col => ({ wch: Math.max(col.length + 5, 15) }));
        worksheet['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        logger.info(`generateExcelTemplate: Generated template with ${columns.length} columns`);

        return buffer;

    } catch (error) {
        logger.error(`generateExcelTemplate: ${error.message}`, { stack: error.stack });
        throw error;
    }
};

export default {
    parseExcelBuffer,
    validateColumns,
    generateExcelTemplate
};
