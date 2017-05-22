/**
 * Created by Jérémy on 08/05/2017.
 */
var google = require('googleapis');
var client = require('../../config/google-client');
var fs = require('fs');
var path = require('path');
var util = require('util');

function process(auth, job, done) {
    var youtube = google.youtube({
        version: 'v3',
        auth: auth.oauth2client
    });
    var req = youtube.videos.list({
        id: job.episode.youtube_id,
        part: 'processingDetails, contentDetails'
    }, function (err, data) {
        if (err) {
            job.error('error retrieving processing details: ' + err);
            return done(err, null);
        }
        if (data) {
            job.processing = data.items[0].processingDetails;
            job.episode.details = data.items[0].contentDetails;
            job.episode.markModified('details');
            job.episode.save(function (err, episode) {
                if (err) {
                    console.error(err);
                    return done(err, null);
                }
                job.markModified('processing');
                job.save(done);
            });
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