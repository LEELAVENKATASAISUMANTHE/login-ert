import { redis } from "../../db/redis.js";
import pool from "../../db/connection.js";
import logger from "../../utils/logger.js";

// ──────── Redis key ────────
// Pattern:  student:{studentId}:jobs  →  Sorted Set (score = deadline, value = jobId)
const studentJobsKey = (studentId) => `student:${studentId.toUpperCase()}:jobs`;

// ──────── READ: get job IDs + deadline scores from Redis ────────

async function getEligibleJobIdsWithScores(studentId) {
    const key = studentJobsKey(studentId);
    const raw = await redis.zrange(key, 0, -1, "WITHSCORES");

    // raw = ["101", "1741219200000", "105", "1741824000000", …]
    const result = [];
    for (let i = 0; i < raw.length; i += 2) {
        result.push({ jobId: raw[i], deadlineMs: Number(raw[i + 1]) });
    }
    return result;
}

// ──────── PostgreSQL: fetch full job details ────────

const JOB_DETAILS_QUERY = `
  SELECT
    j.job_id,
    j.company_id,
    c.company_name,
    j.job_title,
    j.job_description,
    j.job_type,
    j.ctc_lpa,
    j.stipend_per_month,
    j.location,
    j.interview_mode,
    j.application_deadline,
    j.drive_date,
    j.year_of_graduation,
    -- status column removed (not present in jobs table)
  FROM jobs j
  JOIN companies c ON c.company_id = j.company_id
  WHERE j.job_id = ANY($1::int[])
  ORDER BY j.application_deadline ASC
`;

// ──────── Main dashboard function ────────

/**
 * 1. ZRANGE student:{id}:jobs 0 -1 WITHSCORES  →  job IDs from Redis
 * 2. SELECT … WHERE job_id = ANY(…)            →  full details from PostgreSQL
 *
 * Returns { jobs: [ { job_id, company_name, … } ], count }
 */
export async function getStudentEligibleJobs(studentId) {
    // 1 ─ Redis
    const jobEntries = await getEligibleJobIdsWithScores(studentId);

    if (!jobEntries.length) {
        return { jobs: [], count: 0 };
    }

    const jobIds = jobEntries.map(e => parseInt(e.jobId, 10));

    // 2 ─ PostgreSQL
    const { rows } = await pool.query(JOB_DETAILS_QUERY, [jobIds]);

    // Build deadline map from Redis scores
    const deadlineMap = new Map(
        jobEntries.map(e => [parseInt(e.jobId, 10), e.deadlineMs])
    );

    // Preserve Redis sort order (earliest deadline first)
    const orderedJobs = jobIds
        .map(id => {
            const row = rows.find(r => r.job_id === id);
            if (!row) return null;   // job deleted from PG but still in Redis
            return {
                ...row,
                redis_deadline_ms: deadlineMap.get(id),
            };
        })
        .filter(Boolean);

    return { jobs: orderedJobs, count: orderedJobs.length };
}
