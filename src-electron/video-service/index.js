import {fork} from "child_process";
import path from "path";
import {createLogger} from "app/logger";

const logger = createLogger({label: 'video-service'});

let countRunningProcesses = 0;
let jobMap = new Map();

export function runVideoService(jobId) {
  if (jobMap.has(jobId)) {
    return jobMap.get(jobId);
  }
  logger.info('Forking a new video service process');
  const process = fork(
    path.resolve(
      path.join(__dirname, 'process.js')
    ),
    ['args'], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    }
  );

  jobMap.set(jobId, process);

  process.on('message', (m) => {
    console.log('video service process message', m);
  });

  process.stdout.on('data', (data) => console.log(data.toString()));
  process.stderr.on('data', (err) => console.log(err.toString()));

  process.on('close', code => {
    logger.info('Video service process closed with code %d', code);
    countRunningProcesses--;

    if (countRunningProcesses < 0) {
      countRunningProcesses = 0;
    }

    jobMap.delete(jobId);
  });

  countRunningProcesses++;

  return process;
}

export function hasRunningProcesses() {
  return countRunningProcesses > 0;
}

export function getRunningProcessCount() {
  return countRunningProcesses;
}
