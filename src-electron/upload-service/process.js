process.env.IPC_ID = "upload-processor-service-" + process.pid;

const {connect} = require('../../db');
const {createLogger} = require('../../logger');
const states = require('../../config/states');
const uploadProcessor = require('../../processors/upload-processor');
const logger = createLogger({label: 'video-uploader'});
const {Job} = require('../../model');

(async () => {
  let db = await connect();

  try {
    logger.info('starting upload processor service');

    let job = await Job.findOne({state: states.UPLOAD_READY.label})
      .sort('date_created')
      .populate({
        path: 'episode',
        populate: {
          path: 'serie',
          model: 'Serie'
        }
      }).exec();

    if (!job) {
      logger.info('Upload service found no job in %s state', states.UPLOAD_READY.label);
      return;
    }

    if (!job.episode) {
      await job.error(new Error('this job has no episode configured to upload'));
      return;
    }

    try {
      let uploadResult = await uploadProcessor.uploadJob(job);
      logger.info('done uploading episode %s', job.episode.video_name, uploadResult);
    } catch (err) {
      await job.error(err);
      logger.error('upload service error: %s', err.message);
    }
  } finally {
    await db.connection.close();
    process.exit(0);
  }
})();
