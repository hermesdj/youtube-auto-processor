import {createLogger} from "app/logger";
import processUpload from './process';

const logger = createLogger({label: 'upload-service'});

const maxRunningProcesses = 1;
const jobMap = new Map();

export function runUploadService(jobId) {
  if (jobMap.has(jobId)) {
    logger.info("Job %s already has an upload process", jobId);
    return jobMap.get(jobId);
  }

  if (jobMap.size >= maxRunningProcesses) {
    logger.info('Upload already in progress, wait for upload to end');
    return;
  }

  jobMap.set(jobId,
    processUpload(jobId)
      .then(() => {
        logger.info("Upload Processor for job %s is done", jobId);
      })
      .catch((err) => {
        logger.error("Upload Processor error for job %s is in error: %s", jobId, err.message);
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
