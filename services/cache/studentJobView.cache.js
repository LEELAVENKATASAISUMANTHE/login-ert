import logger from "../../utils/logger.js";
import { redis } from "../../db/redis.js";

const STUDENT_JOB_VIEW_QUERY = `
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
    jr.job_requirement_id,
    jr.tenth_percent,
    jr.twelfth_percent,
    jr.ug_cgpa,
    jr.min_experience_yrs,
    jr.allowed_branches,
    jr.backlogs_allowed,
    jr.skills_required,
    jr.additional_notes
  FROM jobs j
  JOIN companies c ON c.company_id = j.company_id
  LEFT JOIN job_requirements jr ON jr.job_id = j.job_id
  WHERE j.job_id = $1
`;

const normalizeJobId = (jobId) => {
  const parsedJobId = Number.parseInt(jobId, 10);
  if (Number.isNaN(parsedJobId) || parsedJobId <= 0) {
    throw new Error("Invalid jobId");
  }
  return parsedJobId;
};

export const buildStudentJobCacheKey = (jobId) => {
  return String(normalizeJobId(jobId));
};

const mapToStudentView = (row) => {
  return {
    job: {
      job_id: row.job_id,
      company_id: row.company_id,
      company_name: row.company_name,
      job_title: row.job_title,
      job_description: row.job_description,
      job_type: row.job_type,
      ctc_lpa: row.ctc_lpa,
      stipend_per_month: row.stipend_per_month,
      location: row.location,
      interview_mode: row.interview_mode,
      application_deadline: row.application_deadline,
      drive_date: row.drive_date,
      year_of_graduation: row.year_of_graduation,
    },
    requirements: {
      job_requirement_id: row.job_requirement_id,
      tenth_percent: row.tenth_percent,
      twelfth_percent: row.twelfth_percent,
      ug_cgpa: row.ug_cgpa,
      min_experience_yrs: row.min_experience_yrs,
      allowed_branches: row.allowed_branches,
      backlogs_allowed: row.backlogs_allowed,
      skills_required: row.skills_required,
      additional_notes: row.additional_notes,
    },
  };
};

const getTtlSecondsFromApplicationDeadline = (applicationDeadline) => {
  if (!applicationDeadline) {
    return null;
  }

  const deadlineMs = new Date(applicationDeadline).getTime();
  if (Number.isNaN(deadlineMs)) {
    return null;
  }

  const ttlSeconds = Math.ceil((deadlineMs - Date.now()) / 1000);
  return ttlSeconds > 0 ? ttlSeconds : 1;
};

export const cacheStudentJobViewByJobId = async (client, jobId) => {
  const normalizedJobId = normalizeJobId(jobId);
  const result = await client.query(STUDENT_JOB_VIEW_QUERY, [normalizedJobId]);

  if (result.rowCount === 0) {
    throw new Error("Job not found");
  }

  const studentView = mapToStudentView(result.rows[0]);
  const key = buildStudentJobCacheKey(normalizedJobId);
  const ttlSeconds = getTtlSecondsFromApplicationDeadline(
    studentView.job.application_deadline
  );

  if (ttlSeconds) {
    await redis.set(key, JSON.stringify(studentView), "EX", ttlSeconds);
  } else {
    await redis.set(key, JSON.stringify(studentView));
  }

  return {
    key,
    studentView,
    ttlSeconds,
  };
};

export const getStudentJobViewByJobIdFromCache = async (jobId) => {
  const key = buildStudentJobCacheKey(jobId);
  const cachedValue = await redis.get(key);

  if (!cachedValue) {
    return null;
  }

  try {
    return JSON.parse(cachedValue);
  } catch (error) {
    logger.warn("Invalid JSON found in student job cache", {
      key,
      error: error.message,
    });
    return null;
  }
};
