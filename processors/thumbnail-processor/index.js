/**
 * Created by Jérémy on 08/05/2017.
 */
const {google} = require('googleapis');
const client = require('../../config/google-client-v1');
const fs = require('fs');
const path = require('path');

function process(auth, job, done) {
    let thumbnail_path = path.join(path.dirname(job.path), 'thumbnails', job.episode.episode_number + '.png');
    let stream = fs.createReadStream(thumbnail_path);
    if (!stream) {
        job.error('no thumbnail file found at' + thumbnail_path);
        return done(job.err, null);
    }

    let youtube = google.youtube({
        version: 'v3',
        auth: auth.oauth2client
    });
    youtube.thumbnails.set({
        videoId: job.episode.youtube_id,
        media: {
            body: stream
        }
    }, function (err, res) {
        if (err) {
            job.error('error uploading thumbnail: ' + err);
            return done(err, null);
        }

        console.log(res);
        if (res && res.data) {
            job.episode.thumbnails = res.data.items;
            job.episode.save(function (err) {
                if (err) {
                    return done(err);
                }

                job.save(done);
            });
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
