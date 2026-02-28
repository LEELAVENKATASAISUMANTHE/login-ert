import logger from "../utils/logger.js";
import { getStudentEligibleJobs } from "../services/cache/studentEligibleJobs.service.js";

/**
 * GET /api/students/:studentId/eligible-jobs
 *
 * Reads the Redis sorted set  student:{studentId}:jobs  (populated by another service)
 * then fetches full job details from PostgreSQL.
 */
export const getEligibleJobs = async (req, res) => {
    try {
        const { studentId } = req.params;

        if (!studentId || !studentId.trim()) {
            return res.status(400).json({
                success: false,
                message: "studentId is required",
            });
        }

        const result = await getStudentEligibleJobs(studentId);

        res.status(200).json({
            success: true,
            message:
                result.count > 0
                    ? `Found ${result.count} eligible job(s) for ${studentId.toUpperCase()}`
                    : `No eligible jobs found for ${studentId.toUpperCase()}`,
            data: result,
        });
    } catch (err) {
        logger.error("Error fetching eligible jobs", {
            studentId: req.params.studentId,
            error: err.message,
            stack: err.stack,
        });
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
