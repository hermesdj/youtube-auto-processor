/**
 * Created by Jérémy on 07/05/2017.
 */
let ResumableUpload = require('node-youtube-resumable-upload');
let fs = require('fs');
let client = require('../../config/google-client');
let moment = require('moment');

function process(auth, job, done) {
    let episode = job.episode;
    let resumable = new ResumableUpload();
    let metadata = {
        snippet: {
            title: episode.video_name,
            description: episode.description,
            tags: episode.keywords
        },
        status: {
            privacyStatus: 'private',
            publishAt: moment(episode.publishAt).format('YYYY-MM-DDTHH:mm:ss.sZ')
        }
    };
    resumable.tokens = auth.token;
    resumable.filepath = episode.path;
    resumable.metadata = metadata;
    resumable.monitor = true;
    resumable.retry = 3;

    resumable.upload();
    let total = fs.statSync(episode.path).size;
    job.state = 'UPLOAD_PROGRESS';
    job.upload_data = {
        progress: 0,
        total: total
    };
    job.save();

    resumable.on('progress', function (progress) {
        console.log(progress, '/', total);
        job.upload_data.progress = progress;
        job.save();
    });

    resumable.on('error', function (error) {
        console.error('error processing video: ', error);
        job.state = 'UPLOAD_ERROR';
        job.save();
        done(error, null);
    });

    resumable.on('success', function (success) {
        success = JSON.parse(success);
        job.episode.youtube_id = success.id;
        job.episode.status = success.status;
        job.state = 'UPLOAD_DONE';
        job.upload_data.progress = total;
        job.episode.save();
        job.save(function (err, job) {
            if (err) {
                return done(err, null);
            }
            done(null, job);
        });
    });
}

exports.upload = function (job, done) {
    if (!job.episode) {
        console.error('this job has no episode configured to upload');
        return done('upload job error, no episode', null);
    }

    client(function (auth) {
        process(auth, job, done);
    });
};