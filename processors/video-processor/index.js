/**
 * Created by Jérémy on 07/05/2017.
 */
let ffmpeg = require('fluent-ffmpeg');

exports.process = function (job, done) {
    // TODO PROCESS VIDEO
    setTimeout(function () {
        job.state = 'VIDEO_DONE';
        job.save(done);
    }, 5000);
};