import logger from "../utils/logger.js";
import * as studentReportService from "../db/student_report.db.js";
import PDFDocument from "pdfkit";

// Helper function to format date
const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Helper function to draw a section header
const drawSectionHeader = (doc, title, y) => {
    doc.fillColor('#2563eb')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text(title, 50, y);
    doc.moveTo(50, y + 18)
       .lineTo(545, y + 18)
       .strokeColor('#2563eb')
       .lineWidth(1)
       .stroke();
    return y + 30;
};

// Helper function to draw key-value pair
const drawKeyValue = (doc, key, value, x, y, keyWidth = 150) => {
    doc.fillColor('#374151')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(key + ':', x, y, { width: keyWidth });
    doc.fillColor('#1f2937')
       .font('Helvetica')
       .text(value || 'N/A', x + keyWidth, y, { width: 300 });
    return y + 18;
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

        const { student, address, academics, family, languages, internships, projects, certifications, documents } = result.data;

        // Create PDF document
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 50, right: 50 },
            info: {
                Title: `Student Report - ${student.full_name}`,
                Author: 'Placement Management System',
                Subject: 'Student Profile Report',
                CreationDate: new Date()
            }
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=student_report_${student.student_id}.pdf`);

        // Pipe the PDF to response
        doc.pipe(res);

        let y = 50;

        // ===== HEADER =====
        doc.fillColor('#1e40af')
           .fontSize(24)
           .font('Helvetica-Bold')
           .text('STUDENT PROFILE REPORT', 50, y, { align: 'center' });
        
        y += 35;
        doc.fillColor('#6b7280')
           .fontSize(10)
           .font('Helvetica')
           .text(`Generated on: ${formatDate(new Date())}`, 50, y, { align: 'center' });
        
        y += 30;

        // ===== PERSONAL INFORMATION =====
        y = drawSectionHeader(doc, '📋 PERSONAL INFORMATION', y);
        
        y = drawKeyValue(doc, 'Student ID', student.student_id, 50, y);
        y = drawKeyValue(doc, 'Full Name', student.full_name, 50, y);
        y = drawKeyValue(doc, 'Gender', student.gender, 50, y);
        y = drawKeyValue(doc, 'Date of Birth', formatDate(student.dob), 50, y);
        y = drawKeyValue(doc, 'Email', student.email, 50, y);
        y = drawKeyValue(doc, 'College Email', student.college_email, 50, y);
        y = drawKeyValue(doc, 'Mobile', student.mobile, 50, y);
        y = drawKeyValue(doc, 'Emergency Contact', student.emergency_contact, 50, y);
        y = drawKeyValue(doc, 'Nationality', student.nationality, 50, y);
        y = drawKeyValue(doc, 'Placement Fee Status', student.placement_fee_status, 50, y);

        y += 15;

        // ===== FAMILY INFORMATION =====
        if (family) {
            y = drawSectionHeader(doc, '👨‍👩‍👧 FAMILY INFORMATION', y);
            
            y = drawKeyValue(doc, "Father's Name", family.father_name, 50, y);
            y = drawKeyValue(doc, "Father's Occupation", family.father_occupation, 50, y);
            y = drawKeyValue(doc, "Father's Phone", family.father_phone, 50, y);
            y = drawKeyValue(doc, "Mother's Name", family.mother_name, 50, y);
            y = drawKeyValue(doc, "Mother's Occupation", family.mother_occupation, 50, y);
            y = drawKeyValue(doc, "Mother's Phone", family.mother_phone, 50, y);
            y = drawKeyValue(doc, 'Blood Group', family.blood_group, 50, y);
            
            y += 15;
        }

        // ===== ADDRESS =====
        if (address) {
            y = drawSectionHeader(doc, '🏠 ADDRESS', y);
            
            const permanentAddr = [
                address.permanent_address_line1,
                address.permanent_address_line2,
                address.permanent_city,
                address.permanent_state,
                address.permanent_pincode
            ].filter(Boolean).join(', ');

            const currentAddr = [
                address.current_address_line1,
                address.current_address_line2,
                address.current_city,
                address.current_state,
                address.current_pincode
            ].filter(Boolean).join(', ');

            y = drawKeyValue(doc, 'Permanent Address', permanentAddr || 'N/A', 50, y);
            y += 10;
            y = drawKeyValue(doc, 'Current Address', currentAddr || 'N/A', 50, y);
            
            y += 15;
        }

        // Check if we need a new page
        if (y > 700) {
            doc.addPage();
            y = 50;
        }

        // ===== ACADEMIC INFORMATION =====
        if (academics) {
            y = drawSectionHeader(doc, '🎓 ACADEMIC INFORMATION', y);
            
            // 10th details
            doc.fillColor('#059669')
               .fontSize(11)
               .font('Helvetica-Bold')
               .text('10th Standard', 50, y);
            y += 18;
            y = drawKeyValue(doc, 'Percentage', academics.tenth_percent ? `${academics.tenth_percent}%` : 'N/A', 70, y);
            y = drawKeyValue(doc, 'Year', academics.tenth_year, 70, y);
            y = drawKeyValue(doc, 'Board', academics.tenth_board, 70, y);
            y = drawKeyValue(doc, 'School', academics.tenth_school, 70, y);

            // 12th or Diploma
            if (academics.twelfth_percent) {
                y += 10;
                doc.fillColor('#059669')
                   .fontSize(11)
                   .font('Helvetica-Bold')
                   .text('12th Standard', 50, y);
                y += 18;
                y = drawKeyValue(doc, 'Percentage', `${academics.twelfth_percent}%`, 70, y);
                y = drawKeyValue(doc, 'Year', academics.twelfth_year, 70, y);
                y = drawKeyValue(doc, 'Board', academics.twelfth_board, 70, y);
                y = drawKeyValue(doc, 'College', academics.twelfth_college, 70, y);
            } else if (academics.diploma_percent) {
                y += 10;
                doc.fillColor('#059669')
                   .fontSize(11)
                   .font('Helvetica-Bold')
                   .text('Diploma', 50, y);
                y += 18;
                y = drawKeyValue(doc, 'Percentage', `${academics.diploma_percent}%`, 70, y);
                y = drawKeyValue(doc, 'Year', academics.diploma_year, 70, y);
                y = drawKeyValue(doc, 'College', academics.diploma_college, 70, y);
            }

            // UG details
            y += 10;
            doc.fillColor('#059669')
               .fontSize(11)
               .font('Helvetica-Bold')
               .text('Undergraduate (UG)', 50, y);
            y += 18;
            y = drawKeyValue(doc, 'CGPA', academics.ug_cgpa ? `${academics.ug_cgpa}` : 'N/A', 70, y);
            y = drawKeyValue(doc, 'Year of Passing', academics.ug_year_of_passing, 70, y);
            y = drawKeyValue(doc, 'History of Backlogs', academics.history_of_backs || '0', 70, y);
            y = drawKeyValue(doc, 'Current Arrears', academics.updated_arrears || '0', 70, y);
            y = drawKeyValue(doc, 'Gap Years', academics.gap_years || '0', 70, y);
            y = drawKeyValue(doc, 'Category', academics.category, 70, y);

            y += 15;
        }

        // Check if we need a new page
        if (y > 650) {
            doc.addPage();
            y = 50;
        }

        // ===== INTERNSHIPS =====
        if (internships && internships.length > 0) {
            y = drawSectionHeader(doc, '💼 INTERNSHIPS', y);
            
            for (let i = 0; i < internships.length; i++) {
                const intern = internships[i];
                
                if (y > 700) {
                    doc.addPage();
                    y = 50;
                }

                doc.fillColor('#7c3aed')
                   .fontSize(11)
                   .font('Helvetica-Bold')
                   .text(`${i + 1}. ${intern.organization || 'Organization'}`, 50, y);
                y += 18;
                y = drawKeyValue(doc, 'Duration', intern.duration, 70, y);
                y = drawKeyValue(doc, 'Period', `${formatDate(intern.start_date)} - ${formatDate(intern.end_date)}`, 70, y);
                y = drawKeyValue(doc, 'Skills Acquired', intern.skills_acquired, 70, y);
                y = drawKeyValue(doc, 'Stipend', intern.stipend ? `₹${intern.stipend}` : 'N/A', 70, y);
                
                if (intern.description) {
                    doc.fillColor('#374151')
                       .fontSize(10)
                       .font('Helvetica-Bold')
                       .text('Description:', 70, y);
                    y += 15;
                    doc.fillColor('#1f2937')
                       .font('Helvetica')
                       .text(intern.description, 70, y, { width: 450 });
                    y += doc.heightOfString(intern.description, { width: 450 }) + 10;
                }
                y += 10;
            }
            y += 5;
        }

        // Check if we need a new page
        if (y > 650) {
            doc.addPage();
            y = 50;
        }

        // ===== PROJECTS =====
        if (projects && projects.length > 0) {
            y = drawSectionHeader(doc, '🚀 PROJECTS', y);
            
            for (let i = 0; i < projects.length; i++) {
                const project = projects[i];
                
                if (y > 700) {
                    doc.addPage();
                    y = 50;
                }

                doc.fillColor('#dc2626')
                   .fontSize(11)
                   .font('Helvetica-Bold')
                   .text(`${i + 1}. ${project.title || 'Project'}`, 50, y);
                y += 18;
                y = drawKeyValue(doc, 'Tools Used', project.tools_used, 70, y);
                if (project.repo_link) {
                    y = drawKeyValue(doc, 'Repository', project.repo_link, 70, y);
                }
                
                if (project.description) {
                    doc.fillColor('#374151')
                       .fontSize(10)
                       .font('Helvetica-Bold')
                       .text('Description:', 70, y);
                    y += 15;
                    doc.fillColor('#1f2937')
                       .font('Helvetica')
                       .text(project.description, 70, y, { width: 450 });
                    y += doc.heightOfString(project.description, { width: 450 }) + 10;
                }
                y += 10;
            }
            y += 5;
        }

        // Check if we need a new page
        if (y > 650) {
            doc.addPage();
            y = 50;
        }

        // ===== CERTIFICATIONS =====
        if (certifications && certifications.length > 0) {
            y = drawSectionHeader(doc, '🏆 CERTIFICATIONS', y);
            
            for (let i = 0; i < certifications.length; i++) {
                const cert = certifications[i];
                
                if (y > 720) {
                    doc.addPage();
                    y = 50;
                }

                doc.fillColor('#ea580c')
                   .fontSize(11)
                   .font('Helvetica-Bold')
                   .text(`${i + 1}. ${cert.skill_name || 'Certification'}`, 50, y);
                y += 18;
                y = drawKeyValue(doc, 'Vendor', cert.vendor, 70, y);
                y = drawKeyValue(doc, 'Duration', cert.duration, 70, y);
                y += 5;
            }
            y += 5;
        }

        // Check if we need a new page
        if (y > 650) {
            doc.addPage();
            y = 50;
        }

        // ===== LANGUAGES =====
        if (languages && languages.length > 0) {
            y = drawSectionHeader(doc, '🌐 LANGUAGES', y);
            
            const langList = languages.map(l => {
                const proficiency = [];
                if (l.can_read) proficiency.push('Read');
                if (l.can_write) proficiency.push('Write');
                if (l.can_speak) proficiency.push('Speak');
                return `${l.language_name} (${proficiency.join(', ')})`;
            }).join(' | ');

            doc.fillColor('#1f2937')
               .fontSize(10)
               .font('Helvetica')
               .text(langList, 50, y, { width: 495 });
            y += doc.heightOfString(langList, { width: 495 }) + 15;
        }

        // ===== FOOTER =====
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fillColor('#9ca3af')
               .fontSize(8)
               .font('Helvetica')
               .text(
                   `Page ${i + 1} of ${pageCount} | Placement Management System`,
                   50,
                   doc.page.height - 30,
                   { align: 'center', width: 495 }
               );
        }

        // Finalize the PDF
        doc.end();

        logger.info('generateStudentReport: PDF report generated successfully', { studentId: id });

    } catch (err) {
        logger.error("Error generating student report:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

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
