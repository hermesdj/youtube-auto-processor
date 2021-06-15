import {fork} from "child_process";
import path from "path";
import {createLogger} from "app/logger";
import {ipcMain} from "electron";

const logger = createLogger({label: 'upload-service'});

let countRunningProcesses = 0;
let jobMap = new Map();

export function runUploadService(jobId) {
  if (jobMap.has(jobId)) {
    return jobMap.get(jobId);
  }

  if (countRunningProcesses > 0) {
    logger.info('Upload already in progress, wait for upload to end');
    return;
  }
  logger.info('Forking a new upload process');

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
    console.log('upload service process message', m);
  });

  process.stdout.on('data', (data) => console.log(data.toString()));
  process.stderr.on('data', (err) => console.log(err.toString()));

  process.on('close', code => {
    logger.info('Upload process closed with code %d', code);
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

export function killUploadProcess(jobId) {
  if (jobMap.has(jobId)) {
    let process = jobMap.get(jobId);
    process.kill('SIGINT');
    return true;
  } else {
    return null;
  }
}

ipcMain.handle('upload-service.killUpload', async (event, {jobId}) => {
  return killUploadProcess(jobId);
});
