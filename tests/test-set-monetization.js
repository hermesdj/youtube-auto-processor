/**
 * Created by Jérémy on 08/05/2017.
 */

const mongoose = require('mongoose');
const youtubeStudioProcessor = require('../processors/youtube-studio-processor');
const Job = require('../model/job.model');
const db_config = require('../config/database-config');
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

Job.findOne({state: 'MONETIZE'})
    .sort('-date_created')
    .populate('episode')
    .exec(async function (err, job) {
        if (err) {
            console.error(err);
            return;
        }

        if (!job) {
            console.error('no job in UPLOAD_DONE state');
            return;
        }

        if (!job.episode) {
            console.error('this job has no episode configured to upload');
            return;
        }

        await youtubeStudioProcessor.setMonetization(job, function (err, result) {
            if (err) {
                return console.error('monetize error', err);
            } else {
                console.log(result);
            }
        });
    });
