/**
 * Created by Jérémy on 08/05/2017.
 */
const path = require('path');
const {Serie} = require('../../model');
const {createLogger} = require('../../logger');
const logger = createLogger({label: 'serie-processor'});

exports.process = async function (job) {
    logger.info('serie processor on job %s', job._id);

    job.serie = await Serie.findOrCreate(path.dirname(job.path));

    job.episode = await job.serie.addEpisode(job);

    await job.save();

    logger.info('episode and serie ready, moving to next state');
    await job.next();

    return job;
};
