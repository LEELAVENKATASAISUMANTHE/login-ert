import logger from '../../utils/logger.js';
import { publishEvent, TOPICS } from '../../utils/kafka.js';

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? null : numericValue;
}

function normalizeBranches(allowedBranches) {
  if (!Array.isArray(allowedBranches)) {
    return [];
  }

  return allowedBranches
    .map((branch) => String(branch).trim())
    .filter(Boolean);
}

function normalizeJobRequirements(req) {
  if (!req || typeof req !== 'object') return null;

  return {
    jobRequirementId: toNumberOrNull(req.job_requirement_id ?? req.jobRequirementId ?? req.id),
    tenthPercent: toNumberOrNull(req.tenth_percent ?? req.tenthPercent),
    twelfthPercent: toNumberOrNull(req.twelfth_percent ?? req.twelfthPercent),
    ugCgpa: toNumberOrNull(req.ug_cgpa ?? req.ugCgpa),
    minExperienceYrs: toNumberOrNull(req.min_experience_yrs ?? req.minExperienceYrs),
    allowedBranches: normalizeBranches(req.allowed_branches ?? req.allowedBranches),
    skillsRequired: req.skills_required ?? req.skillsRequired ? String(req.skills_required ?? req.skillsRequired).trim() : null,
    additionalNotes: req.additional_notes ?? req.additionalNotes ? String(req.additional_notes ?? req.additionalNotes).trim() : null,
    backlogsAllowed: req.backlogs_allowed ?? req.backlogsAllowed != null ? !!(req.backlogs_allowed ?? req.backlogsAllowed) : null
  };
}

export function buildJobCreatedEligibilityEvent({
  jobId,
  companyName,
  minCgpa,
  allowedBranches,
  eligibleBatchYear,
  jobRequirements,
  timestamp
}) {
  return {
    event: 'JOB_CREATED',
    jobId: toNumberOrNull(jobId),
    companyName: companyName ? String(companyName).trim() : null,
    minCgpa: toNumberOrNull(minCgpa),
    allowedBranches: normalizeBranches(allowedBranches),
    eligibleBatchYear: toNumberOrNull(eligibleBatchYear),
    jobRequirements: normalizeJobRequirements(jobRequirements),
    timestamp: timestamp || new Date().toISOString()
  };
}

export async function publishJobCreatedEligibilityEvent(input) {
  const eventPayload = buildJobCreatedEligibilityEvent(input);

  if (eventPayload.jobId === null) {
    throw new Error('jobId is required to publish JOB_CREATED event');
  }

  try {
    await publishEvent(TOPICS.JOB_ELIGIBILITY, eventPayload, {
      key: eventPayload.jobId,
      headers: {
        'x-event-name': eventPayload.event
      }
    });
  } catch (error) {
    logger.error('Failed to publish JOB_CREATED eligibility event', {
      jobId: eventPayload.jobId,
      topic: TOPICS.JOB_ELIGIBILITY,
      error: error.message
    });
    throw error;
  }

  return eventPayload;
}
