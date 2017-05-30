/**
 * Created by Jérémy on 08/05/2017.
 */
const google = require('googleapis');
const client = require('../../config/google-client');
const fs = require('fs');
const path = require('path');
const util = require('util');

function process(auth, job, done) {
    let youtube = google.youtube({
        version: 'v3',
        auth: auth.oauth2client
    });
    let req = youtube.videos.list({
        id: job.episode.youtube_id,
        part: 'processingDetails, contentDetails'
    }, function (err, data) {
        if (err) {
            job.error('error retrieving processing details: ' + err);
            return done(err, null);
        }
        if (data) {
            job.processing = data.items[0].processingDetails;
            job.details = data.items[0].contentDetails;
            job.markModified('processing');
            job.markModified('details');
            job.save(done);
        }
    });
}
exports.getVideoProcessorStats = function (job, done) {
    if (!job.episode) {
        job.error('no episode in this job');
        return;
    }

    if (!job.episode.youtube_id) {
        job.error('no youtube id for episode ' + job.episode._id);
        return;
    }

    client(function (auth) {
        process(auth, job, done);
    })
};