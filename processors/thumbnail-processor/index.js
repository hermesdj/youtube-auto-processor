/**
 * Created by Jérémy on 08/05/2017.
 */
var google = require('googleapis');
var client = require('../../config/google-client');
var fs = require('fs');
var path = require('path');
var util = require('util');

function process(auth, job, done) {
    var thumbnail_path = path.join(path.dirname(job.path), 'thumbnails', job.episode.episode_number + '.png');
    var stream = fs.createReadStream(thumbnail_path);
    if (!stream) {
        job.error('no thumbnail file found at' + thumbnail_path);
        return done(job.err, null);
    }

    var youtube = google.youtube({
        version: 'v3',
        auth: auth.oauth2client
    });
    var req = youtube.thumbnails.set({
        videoId: job.episode.youtube_id,
        media: {
            body: stream
        }
    }, function (err, data) {
        if (err) {
            job.error('error uploading thumbnail: ' + err);
            return done(err, null);
        }
        if (data) {
            job.episode.thumbnails = data.items;
            job.save(done);
        }
    });
}
exports.setThumbnail = function (job, done) {
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