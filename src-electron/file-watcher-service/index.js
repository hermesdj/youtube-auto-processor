import {createLogger} from 'app/logger';
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import mkdirp from "mkdirp";
import moment from "moment";
import {execJobRunner} from "app/src-electron/job-runner-service";

const logger = createLogger({label: 'file-watcher'});

let watcher = null;

export async function startFileWatcher(app, appPath, db) {
  if (!watcher) {
    const Job = db.model('Job');
    const Config = db.model('Config');
    let watchDirectory = path.resolve(path.join(appPath, "Watch"));

    if (!fs.existsSync(watchDirectory)) {
      await mkdirp(watchDirectory);
    }

    let watchGlob = path.join(watchDirectory, '/**/*.mp4');

    watcher = chokidar.watch(watchGlob, {persistent: true, ignoreInitial: true});

    watcher.on('add', async function (filePath) {
      try {
        logger.info('New file detected by file-watcher: %s', filePath);

        let job = await Job.findOne({path: filePath});

        if (!job) {
          let date = moment(path.basename(filePath, '.mp4'), 'YYYY-MM-DD_HH:mm:ss', 'fr');
          let fileStat = fs.statSync(filePath);
          let videoDate = new Date(fileStat.mtime);

          if (date.isValid()) {
            videoDate = date.toDate();
          }

          let job = await Job.create({
            path: filePath,
            date_created: videoDate
          });

          logger.info('new job %s created for video %s', job.id, path.basename(filePath));

          let appConfig = await Config.loadAsObject();
          await execJobRunner(db, appConfig);

          logger.info('File watcher has executed the job runner after new file detected');
        } else {
          logger.warn('Job %s already exists for path %s', job.id, filePath);
        }
      } catch (err) {
        console.error(err);
        logger.error('Error creating job : %s', err.message);
      }
    });
  }

  return watcher;
}

export async function stopFileWatcher() {
  if (watcher) return await watcher.close();
  else return Promise.resolve();
}
