/**
 * Created by Jérémy on 07/05/2017.
 */
const Ffmpeg = require('fluent-ffmpeg');
const config = require('../../config/app.json');
const options = require('../../config/youtube.json');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const winston = require('winston');


exports.process = function (job, done) {
    if (config.ffmpeg_path) {
        process.env['FFMPEG_PATH'] = config.ffmpeg_path;
    }
    if (config.ffmpeg_path) {
        process.env['FFPROBE_PATH'] = config.ffprobe_path;
    }

    winston.info('FFMPEG_PATH=', process.env.FFMPEG_PATH);
    winston.info('FFPROBE_PATH=', process.env.FFPROBE_PATH);

    let intro = null;
    let outro = null;
    let content = null;
    let partner = null;

    if (job) {
        if (job.episode && job.episode.serie) {
            if (job.episode.serie.intro) {
                intro = path.resolve(job.intro);
            }
            if (job.episode.serie.partner) {
                partner = path.resolve(job.partner);
            }
            if (job.episode.serie.outro) {
                outro = path.resolve(job.outro);
            }
        }
        if (job.path) {
            content = path.resolve(job.path);
        }
    }

    if (!intro) {
        intro = path.resolve(options.default_intro);
    }
    if (!outro) {
        outro = path.resolve(options.default_outro);
    }

    if (!content) {
        return done('no content to process !');
    }

    let outputDirectory = path.resolve(config.output_directory, path.basename(path.dirname(job.path)));

    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory);
    }

    let airDate = moment(options.intro_outro_air_date, 'YYYY/MM/DD HH:mm:ss');
    let publicDate = moment(job.episode.publishAt);
    winston.info(airDate, publicDate, publicDate.diff(airDate));
    let allow_intro = publicDate.diff(airDate) >= 0 && options.prepend_intro;
    let allow_outro = publicDate.diff(airDate) >= 0 && options.append_outro;

    let out = path.resolve(outputDirectory, job.episode.episode_number + '.mp4');

    if (!allow_intro && !allow_outro) {
        winston.info('nothing to process !');
        job.state = 'VIDEO_DONE';
        return job.save(done);
    }

    winston.info('processing video content', path.resolve(content));
    winston.info('output directory is', out);


    let command = new Ffmpeg();
    if (intro && allow_intro) {
        winston.info('adding intro to the video', path.resolve(intro));
        command.input(intro);
    }
    if (partner) {
        winston.info('adding partner to the video', path.resolve(partner));
        command.input(partner);
    }
    command.input(content);
    if (outro && allow_outro) {
        winston.info('adding outro to the video', path.resolve(outro));
        command.input(outro);
    }

    command.on('start', function (commandLine) {
        winston.info('Spawned ffmpeg with command', commandLine);
        job.state = 'VIDEO_PROCESSING';
        job.process_data = {
            totalSize: fs.statSync(content).size,
            startDate: moment().toDate()
        };
        job.save();
        //job.markOnPlanning();
    });

    command.on('progress', function (progress) {
        job.process_data.progress = progress;
        job.markModified('process_data');
        job.save();
    });

    command.on('error', function (err) {
        winston.error(`FFMPEG err ${err}`);
        done(err);
    });

    command.on('end', function () {
        // TODO do not delete the video for now, more tests are necessary
        //fs.unlinkSync(job.episode.path);
        job.episode.path = out;
        job.episode.save(function (err, episode) {
            job.state = 'VIDEO_DONE';
            job.process_data.endDate = moment().toDate();
            job.markModified('process_data');
            job.save(done);
        });
    });

    command.mergeToFile(out, config.working_directory);

    winston.info('started');
};
