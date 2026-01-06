import logger from "../utils/logger.js";
import * as studentReportService from "../db/student_report.db.js";
import PDFDocument from "pdfkit";

// Helper function to format date
const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Generate PDF report for a single student
export const generateStudentReport = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch all student data
        const result = await studentReportService.getStudentFullReport(id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        const { student, address, academics, family, languages, internships, projects, certifications } = result.data;

        // Create PDF document
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 40, bottom: 40, left: 50, right: 50 },
            bufferPages: true,
            info: {
                Title: `Student Report - ${student.full_name}`,
                Author: 'Placement Management System',
                Subject: 'Student Profile Report'
            }
        });

        // Buffer chunks
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Length', pdfBuffer.length);
            res.setHeader('Content-Disposition', `attachment; filename=student_report_${student.student_id}.pdf`);
            res.end(pdfBuffer);
        });

        // ===== HEADER =====
        doc.fillColor('#1e40af')
           .fontSize(20)
           .font('Helvetica-Bold')
           .text('STUDENT PROFILE REPORT', { align: 'center' });
        
        doc.moveDown(0.3);
        doc.fillColor('#6b7280')
           .fontSize(9)
           .font('Helvetica')
           .text(`Generated: ${formatDate(new Date())} | Student ID: ${student.student_id}`, { align: 'center' });
        
        doc.moveDown(1);

        // ===== PERSONAL INFORMATION =====
        addSectionHeader(doc, 'PERSONAL INFORMATION');
        
        const personalData = [
            ['Full Name', student.full_name, 'Gender', student.gender],
            ['Date of Birth', formatDate(student.dob), 'Nationality', student.nationality],
            ['Email', student.email, 'Mobile', student.mobile],
            ['College Email', student.college_email, 'Emergency Contact', student.emergency_contact],
            ['Placement Fee', student.placement_fee_status, '', '']
        ];
        addTable(doc, personalData);

        // ===== FAMILY INFORMATION =====
        if (family) {
            checkPageBreak(doc);
            addSectionHeader(doc, 'FAMILY INFORMATION');
            
            const familyData = [
                ["Father's Name", family.father_name, "Mother's Name", family.mother_name],
                ["Father's Occupation", family.father_occupation, "Mother's Occupation", family.mother_occupation],
                ["Father's Phone", family.father_phone, "Mother's Phone", family.mother_phone],
                ['Blood Group', family.blood_group, '', '']
            ];
            addTable(doc, familyData);
        }

        // ===== ADDRESS =====
        if (address) {
            checkPageBreak(doc);
            addSectionHeader(doc, 'ADDRESS');
            
            const permAddr = [address.permanent_address_line1, address.permanent_address_line2, 
                             address.permanent_city, address.permanent_state, address.permanent_pincode]
                             .filter(Boolean).join(', ') || 'N/A';
            const currAddr = [address.current_address_line1, address.current_address_line2,
                             address.current_city, address.current_state, address.current_pincode]
                             .filter(Boolean).join(', ') || 'N/A';
            
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151').text('Permanent: ', { continued: true });
            doc.font('Helvetica').fillColor('#1f2937').text(permAddr);
            doc.moveDown(0.3);
            doc.font('Helvetica-Bold').fillColor('#374151').text('Current: ', { continued: true });
            doc.font('Helvetica').fillColor('#1f2937').text(currAddr);
            doc.moveDown(0.8);
        }

        // ===== ACADEMIC INFORMATION =====
        if (academics) {
            checkPageBreak(doc);
            addSectionHeader(doc, 'ACADEMIC INFORMATION');
            
            // 10th
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#059669').text('10th Standard');
            doc.fontSize(9).font('Helvetica').fillColor('#1f2937')
               .text(`${academics.tenth_percent || 'N/A'}% | ${academics.tenth_year || 'N/A'} | ${academics.tenth_board || 'N/A'} | ${academics.tenth_school || 'N/A'}`);
            doc.moveDown(0.4);

            // 12th or Diploma
            if (academics.twelfth_percent) {
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#059669').text('12th Standard');
                doc.fontSize(9).font('Helvetica').fillColor('#1f2937')
                   .text(`${academics.twelfth_percent}% | ${academics.twelfth_year || 'N/A'} | ${academics.twelfth_board || 'N/A'} | ${academics.twelfth_college || 'N/A'}`);
                doc.moveDown(0.4);
            } else if (academics.diploma_percent) {
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#059669').text('Diploma');
                doc.fontSize(9).font('Helvetica').fillColor('#1f2937')
                   .text(`${academics.diploma_percent}% | ${academics.diploma_year || 'N/A'} | ${academics.diploma_college || 'N/A'}`);
                doc.moveDown(0.4);
            }

            // UG
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#059669').text('Undergraduate');
            doc.fontSize(9).font('Helvetica').fillColor('#1f2937')
               .text(`CGPA: ${academics.ug_cgpa || 'N/A'} | Year: ${academics.ug_year_of_passing || 'N/A'} | Backlogs: ${academics.history_of_backs || 0} | Arrears: ${academics.updated_arrears || 0} | Gap: ${academics.gap_years || 0} years`);
            doc.moveDown(0.8);
        }

        // ===== INTERNSHIPS =====
        if (internships && internships.length > 0) {
            checkPageBreak(doc);
            addSectionHeader(doc, `INTERNSHIPS (${internships.length})`);
            
            internships.forEach((intern, i) => {
                checkPageBreak(doc, 80);
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#7c3aed')
                   .text(`${i + 1}. ${intern.organization || 'Organization'}`);
                doc.fontSize(9).font('Helvetica').fillColor('#1f2937')
                   .text(`Duration: ${intern.duration || 'N/A'} | Period: ${formatDate(intern.start_date)} - ${formatDate(intern.end_date)} | Stipend: Rs. ${intern.stipend || 'N/A'}`);
                if (intern.skills_acquired) {
                    doc.text(`Skills: ${intern.skills_acquired}`);
                }
                if (intern.description) {
                    doc.fontSize(8).fillColor('#6b7280').text(`${intern.description}`);
                }
                doc.moveDown(0.5);
            });
            doc.moveDown(0.3);
        }

        // ===== PROJECTS =====
        if (projects && projects.length > 0) {
            checkPageBreak(doc);
            addSectionHeader(doc, `PROJECTS (${projects.length})`);
            
            projects.forEach((project, i) => {
                checkPageBreak(doc, 60);
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#dc2626')
                   .text(`${i + 1}. ${project.title || 'Project'}`);
                doc.fontSize(9).font('Helvetica').fillColor('#1f2937')
                   .text(`Tools: ${project.tools_used || 'N/A'}`);
                if (project.repo_link) {
                    doc.text(`Repo: ${project.repo_link}`);
                }
                if (project.description) {
                    doc.fontSize(8).fillColor('#6b7280').text(`${project.description}`);
                }
                doc.moveDown(0.5);
            });
            doc.moveDown(0.3);
        }

        // ===== CERTIFICATIONS =====
        if (certifications && certifications.length > 0) {
            checkPageBreak(doc);
            addSectionHeader(doc, `CERTIFICATIONS (${certifications.length})`);
            
            certifications.forEach((cert, i) => {
                checkPageBreak(doc, 40);
                doc.fontSize(9).font('Helvetica-Bold').fillColor('#ea580c')
                   .text(`${i + 1}. ${cert.skill_name || 'Certification'}`, { continued: true });
                doc.font('Helvetica').fillColor('#1f2937')
                   .text(` - ${cert.vendor || 'N/A'} (${cert.duration || 'N/A'})`);
            });
            doc.moveDown(0.8);
        }

        // ===== LANGUAGES =====
        checkPageBreak(doc);
        addSectionHeader(doc, 'LANGUAGES');
        
        if (languages && languages.length > 0) {
            languages.forEach((lang) => {
                doc.fontSize(9).font('Helvetica-Bold').fillColor('#0891b2')
                   .text(`${lang.language || 'Language'}`, { continued: true });
                doc.font('Helvetica').fillColor('#1f2937')
                   .text(` - Level: ${lang.level || 'N/A'}`);
            });
        } else {
            doc.fontSize(9).font('Helvetica').fillColor('#6b7280').text('No languages recorded');
        }
        doc.moveDown(0.8);

        doc.end();
        logger.info('generateStudentReport: PDF generated', { studentId: id });

    } catch (err) {
        logger.error("Error generating student report:", err);
        if (!res.headersSent) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
};

// Helper: Add section header
function addSectionHeader(doc, title) {
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#2563eb')
       .text(title);
    doc.moveTo(50, doc.y)
       .lineTo(545, doc.y)
       .strokeColor('#2563eb')
       .lineWidth(1)
       .stroke();
    doc.moveDown(0.5);
}

// Helper: Add simple table (2 columns of key-value pairs)
function addTable(doc, rows) {
    rows.forEach(row => {
        if (row[0]) {
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151')
               .text(row[0] + ': ', 50, doc.y, { continued: true, width: 120 });
            doc.font('Helvetica').fillColor('#1f2937')
               .text(row[1] || 'N/A', { continued: false });
        }
        if (row[2]) {
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151')
               .text(row[2] + ': ', 300, doc.y - 12, { continued: true, width: 120 });
            doc.font('Helvetica').fillColor('#1f2937')
               .text(row[3] || 'N/A', { continued: false });
        }
        doc.moveDown(0.1);
    });
    doc.moveDown(0.5);
}

// Helper: Check if we need a page break
function checkPageBreak(doc, minSpace = 100) {
    if (doc.y > doc.page.height - doc.page.margins.bottom - minSpace) {
        doc.addPage();
    }
}

// Get student report data as JSON (for preview)
export const getStudentReportData = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await studentReportService.getStudentFullReport(id);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching student report data:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all students summary
export const getAllStudentsSummary = async (req, res) => {
    try {
        const result = await studentReportService.getAllStudentsSummary();
        res.status(200).json(result);
    } catch (err) {
        logger.error("Error fetching students summary:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
