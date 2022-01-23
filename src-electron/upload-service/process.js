const {createLogger} = require('../../logger');
const states = require('../../config/states');
const uploadProcessor = require('../../processors/upload-processor');
const logger = createLogger({label: 'video-uploader'});
const {Job} = require('../../model');

module.exports = async (jobId) => {

  if (!jobId) {
    throw new Error('No Job ID provided to upload video service');
  }

  logger.info('starting upload processor service');

  let job = await Job.findById(jobId)
    .populate({
      path: 'episode',
      populate: {
        path: 'serie',
        model: 'Serie'
      }
    }).exec();

  if (!job) {
    logger.info('Job %s does not exists', jobId);
    return;
  }

  if (job.state !== states.UPLOAD_READY.label) {
    logger.error("Job with id %s is in state %s and not in state %s", jobId, job.state, states.UPLOAD_READY.label);
    return;
  }

  if (!job.episode) {
    await job.error(new Error('this job has no episode configured to upload'));
    return;
  }

  try {
    let uploadResult = await uploadProcessor.uploadJob(job);
    logger.info('done uploading episode %s', job.episode.video_name, uploadResult);
    return uploadResult;
  } catch (err) {
    await job.error(err);
    logger.error('upload service error: %s', err.message);
    throw err;
  }
};
