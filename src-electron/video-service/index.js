import {createLogger} from "app/logger";
import processVideo from "./process";

const logger = createLogger({label: 'video-service'});

const maxRunningProcesses = 2;
const jobMap = new Map();

export function runVideoService(jobId) {
  if (jobMap.has(jobId)) {
    logger.info("Job %s already has a running video service process", jobId);
    return jobMap.get(jobId);
  }

  if (jobMap.size >= maxRunningProcesses) {
    logger.info('Video processing already in progress, wait for one of them to end');
    return;
  }

  logger.info('Forking a new video service process');

  jobMap.set(
    jobId,
    processVideo(jobId)
      .then(() => {
        logger.info("Video Processor for job %s is done", jobId);
      })
      .catch((err) => {
        logger.error("Video Processor error for job %s is in error: %s", jobId, err.message);
      })
      .finally(() => {
        if (jobMap.has(jobId)) {
          jobMap.delete(jobId);
        }
      })
  );

  return jobMap.get(jobId);
}

export function hasRunningProcesses() {
  return jobMap.size > 0;
}

export function getRunningProcessCount() {
  return jobMap.size;
}
