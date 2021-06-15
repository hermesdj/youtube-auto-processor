import {runJobRunner} from "./process";

import {createLogger} from 'app/logger';

const logger = createLogger({label: 'job-runner'});

let currentExecutionPromise;
let jobRunnerInterval;

export async function startJobRunnerInterval(db, execTime) {
  const Config = db.model('Config');

  logger.info('creating job runner interval every %d seconds', execTime);
  jobRunnerInterval = setInterval(async () => {
    let appConfig = await Config.loadAsObject();
    await execJobRunner(db, appConfig);
  }, execTime * 1000);

  return jobRunnerInterval;
}

export function stopJobRunnerInterval() {
  if (jobRunnerInterval) clearInterval(jobRunnerInterval);
  jobRunnerInterval = null;
}

export async function execJobRunner(db, appConfig) {
  if (currentExecutionPromise) {
    return currentExecutionPromise;
  }

  logger.debug('Running a new job execution');

  currentExecutionPromise = runJobRunner(db, appConfig);

  return currentExecutionPromise
    .finally(() => {
      currentExecutionPromise = null;
    });
}

export async function isEnabled() {
  return jobRunnerInterval !== null;
}
