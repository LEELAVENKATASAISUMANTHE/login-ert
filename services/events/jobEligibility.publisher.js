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

export function buildJobCreatedEligibilityEvent({
  jobId,
  companyName,
  minCgpa,
  allowedBranches,
  eligibleBatchYear,
  timestamp
}) {
  return {
    event: 'JOB_CREATED',
    jobId: toNumberOrNull(jobId),
    companyName: companyName ? String(companyName).trim() : null,
    minCgpa: toNumberOrNull(minCgpa),
    allowedBranches: normalizeBranches(allowedBranches),
    eligibleBatchYear: toNumberOrNull(eligibleBatchYear),
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
