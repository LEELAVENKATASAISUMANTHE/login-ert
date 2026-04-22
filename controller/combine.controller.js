import logger from "../utils/logger.js";
import joi from "joi";
import { handleError } from "../utils/errors.js";
import pool from "../db/connection.js";
import { cacheStudentJobViewByJobId } from "../services/cache/studentJobView.cache.js";
import { publishJobCreatedEligibilityEvent } from "../services/events/jobEligibility.publisher.js";
import { getBranchCodes } from "../utils/branches.js";

/* ----------------------------------------------------
   CONSTANTS
---------------------------------------------------- */

const JOB_TYPES = [
  "Full-Time",
  "Part-Time",
  "Internship",
  "Contract",
  "Temporary",
  "Remote",
  "PBC",
];

/* ----------------------------------------------------
   VALIDATION SCHEMA
   Built per-request so it always reflects the current
   branches.json without requiring a server restart.
---------------------------------------------------- */

const buildJobSchema = () => {
  const branches = getBranchCodes();
  return joi.object({
    company_id: joi.number().integer().required(),
    job_title: joi.string().required(),
    job_description: joi.string().required(),
    job_type: joi.string().valid(...JOB_TYPES).required(),
    ctc_lpa: joi.number().min(0).required(),
    stipend_per_month: joi.number().min(0).required(),
    location: joi.string().required(),
    interview_mode: joi.string().required(),
    application_deadline: joi.date().required(),
    drive_date: joi.date().required(),
    year_of_graduation: joi.number().integer().required(),

    tenth_percent: joi.number().min(0).max(100).required(),
    twelfth_percent: joi.number().min(0).max(100).required(),
    ug_cgpa: joi.number().min(0).max(10).required(),
    min_experience_yrs: joi.number().min(0).required(),
    allowed_branches: joi
      .array()
      .items(joi.string().valid(...branches))
      .required(),
    backlogs_allowed: joi.number().integer().min(0).required(),
    skills_required: joi.string().required(),
    additional_notes: joi.string().optional().allow(null, ""),
  });
};

const cacheStudentJobView = async (client, jobId) => {
  try {
    const { key, ttlSeconds } = await cacheStudentJobViewByJobId(client, jobId);
    logger.info("Student job view cached in Redis", {
      jobId,
      redisKey: key,
      ttlSeconds,
    });
  } catch (error) {
    logger.warn("Failed to cache student job view in Redis", {
      jobId,
      error: error.message,
    });
  }
};

const getCompanyNameById = async (client, companyId) => {
  const companyQuery = `
    SELECT company_name
    FROM companies
    WHERE company_id = $1
  `;

  const result = await client.query(companyQuery, [companyId]);
  if (result.rowCount === 0) return null;

  return result.rows[0].company_name;
};

const publishEligibilityEvent = async ({
  jobId,
  jobRequirementId,
  validated,
  companyName,
}) => {
  try {
    await publishJobCreatedEligibilityEvent({
      jobId,
      companyName,
      minCgpa: validated.ug_cgpa,
      allowedBranches: validated.allowed_branches,
      eligibleBatchYear: validated.year_of_graduation,
      jobRequirements: {
        job_requirement_id: jobRequirementId,
        tenth_percent: validated.tenth_percent,
        twelfth_percent: validated.twelfth_percent,
        ug_cgpa: validated.ug_cgpa,
        min_experience_yrs: validated.min_experience_yrs,
        allowed_branches: validated.allowed_branches,
        skills_required: validated.skills_required,
        additional_notes: validated.additional_notes,
        backlogs_allowed: validated.backlogs_allowed,
      },
    });

    logger.info("Job eligibility event published", { jobId });
  } catch (error) {
    logger.warn("Failed to publish job eligibility event", {
      jobId,
      error: error.message,
    });
  }
};

/* ----------------------------------------------------
   CREATE JOB + REQUIREMENTS
---------------------------------------------------- */

export const createJobWithRequirements = async (data) => {
  const client = await pool.connect();

  try {
    const validated = await buildJobSchema().validateAsync(data);

    await client.query("BEGIN");

    // Insert into jobs table
    const jobInsertQuery = `
      INSERT INTO jobs (
        company_id,
        job_title,
        job_description,
        job_type,
        ctc_lpa,
        stipend_per_month,
        location,
        interview_mode,
        application_deadline,
        drive_date,
        year_of_graduation
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING job_id
    `;

    const jobInsertValues = [
      validated.company_id,
      validated.job_title,
      validated.job_description,
      validated.job_type,
      validated.ctc_lpa,
      validated.stipend_per_month,
      validated.location,
      validated.interview_mode,
      validated.application_deadline,
      validated.drive_date,
      validated.year_of_graduation,
    ];

    const jobResult = await client.query(jobInsertQuery, jobInsertValues);
    const jobId = jobResult.rows[0].job_id;

    // Insert into job_requirements table
    const reqInsertQuery = `
      INSERT INTO job_requirements (
        job_id,
        tenth_percent,
        twelfth_percent,
        ug_cgpa,
        min_experience_yrs,
        allowed_branches,
        skills_required,
        additional_notes,
        backlogs_allowed
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING job_requirement_id
    `;

    const reqInsertValues = [
      jobId,
      validated.tenth_percent,
      validated.twelfth_percent,
      validated.ug_cgpa,
      validated.min_experience_yrs,
      validated.allowed_branches,
      validated.skills_required,
      validated.additional_notes ?? null,
      validated.backlogs_allowed,
    ];

    const reqResult = await client.query(reqInsertQuery, reqInsertValues);
    const jobRequirementId = reqResult.rows[0]?.job_requirement_id;

    if (!Number.isInteger(jobRequirementId) || jobRequirementId <= 0) {
      throw new Error("Failed to create job requirements");
    }

    const companyName = await getCompanyNameById(client, validated.company_id);

    await client.query("COMMIT");
    await cacheStudentJobView(client, jobId);
    await publishEligibilityEvent({
      jobId,
      jobRequirementId,
      validated,
      companyName,
    });

    logger.info("Job created successfully", { jobId });

    return {
      success: true,
      jobId,
      message: "Job created successfully",
    };
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("Job creation failed", { error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

/* ----------------------------------------------------
   UPDATE JOB + REQUIREMENTS
   - Full overwrite
   - job_id cannot change
---------------------------------------------------- */

export const updateJobWithRequirements = async (jobId, data) => {
  const client = await pool.connect();

  try {
    if (!jobId) {
      throw new Error("jobId is required for update");
    }

    const validated = await buildJobSchema().validateAsync(data);

    await client.query("BEGIN");

    // Check if job exists
    const checkQuery = `
      SELECT job_id FROM jobs WHERE job_id = $1
    `;

    const checkResult = await client.query(checkQuery, [jobId]);

    if (checkResult.rowCount === 0) {
      throw new Error("Job not found");
    }

    // Update jobs table
    const jobUpdateQuery = `
      UPDATE jobs SET
        company_id = $1,
        job_title = $2,
        job_description = $3,
        job_type = $4,
        ctc_lpa = $5,
        stipend_per_month = $6,
        location = $7,
        interview_mode = $8,
        application_deadline = $9,
        drive_date = $10,
        year_of_graduation = $11
      WHERE job_id = $12
    `;

    const jobUpdateValues = [
      validated.company_id,
      validated.job_title,
      validated.job_description,
      validated.job_type,
      validated.ctc_lpa,
      validated.stipend_per_month,
      validated.location,
      validated.interview_mode,
      validated.application_deadline,
      validated.drive_date,
      validated.year_of_graduation,
      jobId,
    ];

    await client.query(jobUpdateQuery, jobUpdateValues);

    // Update job_requirements table
    const reqUpdateQuery = `
      UPDATE job_requirements SET
        tenth_percent = $1,
        twelfth_percent = $2,
        ug_cgpa = $3,
        min_experience_yrs = $4,
        allowed_branches = $5,
        skills_required = $6,
        additional_notes = $7,
        backlogs_allowed = $8
      WHERE job_id = $9
      RETURNING job_requirement_id
    `;

    const reqUpdateValues = [
      validated.tenth_percent,
      validated.twelfth_percent,
      validated.ug_cgpa,
      validated.min_experience_yrs,
      validated.allowed_branches,
      validated.skills_required,
      validated.additional_notes ?? null,
      validated.backlogs_allowed,
      jobId,
    ];

    const reqResult = await client.query(reqUpdateQuery, reqUpdateValues);

    if (reqResult.rowCount === 0) {
      throw new Error("Job requirements not found");
    }

    const jobRequirementId = reqResult.rows[0]?.job_requirement_id;
    if (!Number.isInteger(jobRequirementId) || jobRequirementId <= 0) {
      throw new Error("Invalid job requirement id");
    }

    const companyName = await getCompanyNameById(client, validated.company_id);

    await client.query("COMMIT");
    await cacheStudentJobView(client, jobId);
    await publishEligibilityEvent({
      jobId,
      jobRequirementId,
      validated,
      companyName,
    });

    logger.info("Job updated successfully", { jobId });

    return {
      success: true,
      jobId,
      message: "Job updated successfully",
    };
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("Job update failed", { error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

export const createCombinedJob = async (req, res) => {
  try {
    const result = await createJobWithRequirements(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return handleError(error, res, 'createCombinedJob');
  }
};

export const updateCombinedJob = async (req, res) => {
  try {
    const jobId = Number.parseInt(req.params.jobId, 10);
    if (Number.isNaN(jobId)) {
      return res.status(400).json({
        success: false,
        message: "jobId must be a valid number",
      });
    }

    const result = await updateJobWithRequirements(jobId, req.body);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res, 'updateCombinedJob');
  }
};
