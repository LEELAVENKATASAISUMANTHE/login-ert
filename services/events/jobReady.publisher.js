import logger from '../../utils/logger.js';
import { publishEvent, TOPICS } from '../../utils/kafka.js';

export function buildJobReadyEvent({ jobId, companyId, yearOfGraduation, timestamp }) {
  return {
    event: 'JOB_READY',
    jobId,
    companyId,
    yearOfGraduation,
    timestamp: timestamp || new Date().toISOString()
  };
}

export async function publishJobReadyEvent(input) {
  const eventPayload = buildJobReadyEvent(input);

  if (!eventPayload.jobId) {
    throw new Error('jobId is required to publish JOB_READY event');
  }

  try {
    await publishEvent(TOPICS.JOB_READY, eventPayload, {
      key: String(eventPayload.jobId),
      headers: {
        'x-event-name': eventPayload.event
      }
    });
  } catch (error) {
    logger.error({
      jobId: eventPayload.jobId,
      topic: TOPICS.JOB_READY,
      error: error.message
    }, 'Failed to publish JOB_READY event');
    throw error;
  }

  return eventPayload;
}
