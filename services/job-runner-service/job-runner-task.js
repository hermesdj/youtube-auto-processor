/**
 * Created by Jérémy on 07/05/2017.
 */
const path = require('path');
const Job = require('../../model/job.model');
const Log = require('../../model/log.model');
const Serie = require('../../model/serie.model');
const EventEmitter = require('events').EventEmitter;
const util = require('util');
const moment = require('moment');
const flow = require('flow');
const config = require('../../config/app.json');
const fs = require('fs');
const winston = require('winston');
const states = require('../../config/states');
const serieProcessor = require('../../processors/serie-processor');
const sheetProcessor = require('../../processors/sheet-processor');
const thumbnailProcessor = require('../../processors/thumbnail-processor');
const playlistProcessor = require('../../processors/playlist-processor');
const youtubeProcessor = require('../../processors/youtube-processor');
const processVideoService = require('../../services/process-video-service/install-service');
const processUploadService = require('../../services/upload-video-service/install-service');

function jobRunner(done) {
    flow.exec(
        function () {
            process_ready_jobs(this);
        }, function () {
            process_initialized_jobs(this);
        }, function () {
            process_schedule_jobs(this);
        }, function () {
            process_video_ready_jobs(this);
        }, function () {
            process_upload_ready_jobs(this);
        }, function () {
            process_upload_done_jobs(this);
        }, function () {
            process_thumbnail_jobs(this);
        }, function () {
            process_playlists_jobs(this);
        }, function () {
            process_wait_youtube_processing_jobs(this);
        }, function () {
            process_all_done_jobs(this);
        }, function () {
            process_public_jobs(this);
        }, function () {
            process_finished_jobs(this);
        }, function () {
            done();
        }
    );
}

util.inherits(jobRunner, EventEmitter);

exports.run = jobRunner;

let find_jobs = function (state, done) {
    Job.find({state: state.label}).sort('+date_created').populate({
        path: 'episode',
        populate: {
            path: 'serie',
            model: 'Serie'
        }
    }).exec(done);
};

let find_job = function (state, done) {
    Job.findOne({state: state.label}).sort('+date_created').populate({
        path: 'episode',
        populate: {
            path: 'serie',
            model: 'Serie'
        }
    }).exec(done);
};

let process_jobs = function (jobs, process, done) {
    flow.serialForEach(jobs, function (job) {
        process(job, this);
    }, function (err, job) {
        if (err) {
            winston.error(err);
        }
    }, function () {
        done();
    });
};

let process_ready_jobs = function (done) {
    find_job(states.READY, function (err, job) {
        if (err) {
            winston.error(err);
            return;
        }
        if (job) {
            winston.info('ready jobs found to process:' + job._id);
            serieProcessor.process(job, function (err, job) {
                if (err) {
                    winston.error(err);
                    job.error(err);
                }
                winston.info('done processing ready job');
                done();
            });
        } else {
            done();
        }
    });
};

let process_initialized_jobs = function (done) {
    find_jobs(states.INITIALIZED, function (err, jobs) {
        if (err) {
            winston.error(err);
            done(err, null);
        }
        if (jobs.length > 0) {
            winston.info('initialized jobs found to process:' + jobs.length);
            process_jobs(jobs, process_initialized_job, function (err, job) {
                if (err) {
                    winston.error(err);
                    job.error(err);
                }
                winston.info('done processing ready jobs');
                done();
            });
        } else {
            done();
        }
    });
};

let process_initialized_job = function (job, done) {
    if ((job.episode.serie && job.episode.serie.named_episode) || job.episode.video_name.indexOf('${episode_name}') > 0) {
        winston.info('this needs a name, waiting for user input...');
        if (job.episode.episode_name) {
            job.episode.video_name = job.episode.video_name.replace('${episode_name}', job.episode.episode_name);
            job.episode.save(function () {
                job.next(done);
            });
        } else {
            done();
        }
    } else {
        // Not a named serie
        job.next(done);
    }
};

let process_video_ready_jobs = function (done) {
    find_jobs(states.VIDEO_READY, function (err, jobs) {
        if (err) {
            winston.error(err);
            done(err, null);
            return;
        }
        if (jobs.length > 0) {
            winston.info('video ready jobs found to process:' + jobs.length);
            processVideoService();
        }
        done();
    });
};

let process_schedule_jobs = function (done) {
    find_jobs(states.SCHEDULE, function (err, jobs) {
        if (err) {
            winston.error(err);
            done(err, null);
            return;
        }
        if (jobs.length > 0) {
            winston.info('schedule jobs found to process:' + jobs.length);
            process_jobs(jobs, process_schedule_job, function (err, job) {
                if (err) {
                    winston.error(err);
                    job.error(err);
                }
                done();
            });
        } else {
            done();
        }
    });
};

let process_schedule_job = function (job, done) {
    sheetProcessor.getScheduledDate(job, function (err, result) {
        if (err) {
            job.error(err);
            return done(err, null);
        }

        job.episode.publishAt = moment(result).toDate();
        winston.info(job.episode.video_name + ' scheduled on ' + job.episode.publishAt);
        job.episode.save(function (err, episode) {
            if (err) {
                job.error(err);
                return done(err);
            }

            if (config.pause_before_processing) {
                job.state = states.SCHEDULE.next().label;
                job.pause(done);
            } else {
                job.next(done);
            }
        });

    });
};

let process_upload_ready_jobs = function (done) {
    find_jobs(states.UPLOAD_READY, function (err, jobs) {
        if (err) {
            winston.error(err);
            done(err, null);
            return;
        }
        if (jobs.length > 0) {
            winston.info('upload ready jobs found to process:' + jobs.length);
            processUploadService();
        }
        done();
    });
};

let process_upload_done_jobs = function (done) {
    find_jobs(states.UPLOAD_DONE, function (err, jobs) {
        if (err) {
            winston.error(err);
            done(err, null);
            return;
        }

        if (jobs.length > 0) {
            winston.info('upload done jobs found to process:' + jobs.length);
            process_jobs(jobs, process_upload_done_job, function (err, job) {
                if (err) {
                    winston.error(err);
                    job.error(err);
                }

                done();
            });
        } else {
            done();
        }
    });
};

let process_upload_done_job = function (job, done) {
    job.next(function (err, job) {
        if (err) {
            winston.error(err);
            done(err, null);
            return;
        }

        thumbnailProcessor.setThumbnail(job, function (err, job) {
            if (err) {
                winston.error(err);
                job.error(err);
                return done(err, null);
            }
            job.next(done);
        });
    });
};

let process_thumbnail_jobs = function (done) {
    find_jobs(states.THUMBNAIL, function (err, jobs) {
        if (err) {
            winston.error(err);
            done(err, null);
            return;
        }

        if (jobs.length > 0) {
            winston.info('thumbnail jobs found to process:' + jobs.length);
            process_jobs(jobs, process_thumbnail_job, function (err, job) {
                if (err) {
                    winston.error(err);
                    job.error(err);
                }

                done();
            });
        } else {
            done();
        }
    });
};

let process_thumbnail_job = function (job, done) {
    job.next(done);
};

let process_playlists_jobs = function (done) {
    find_jobs(states.PLAYLIST, function (err, jobs) {
        if (err) {
            winston.error(err);
            done(err, null);
            return;
        }

        if (jobs.length > 0) {
            winston.info('playlist jobs found to process:' + jobs.length);
            process_jobs(jobs, process_playlist_job, function (err, job) {
                if (err) {
                    winston.error(err);
                    job.error(err);
                }

                done();
            });
        } else {
            done();
        }
    });
};

let process_playlist_job = function (job, done) {
    if (job.episode.serie.playlist_id) {
        insertVideoToPlaylist(job, done);
    } else {
        createPlaylist(job, function (err) {
            if (err) {
                return done();
            }
            insertVideoToPlaylist(job, done);
        });
    }
};

let insertVideoToPlaylist = function (job, done) {
    playlistProcessor.addToPlaylist(job, function (err) {
        if (err) {
            winston.error(err);
            job.error(err);
        }
        job.next(done);
    });
};

let createPlaylist = function (job, done) {
    playlistProcessor.createPlaylist(job, function (err) {
        if (err) {
            winston.error(err);
            job.error(err);
            return done(err);
        }
        done(null);
    });
};

let process_all_done_jobs = function (done) {
    find_jobs(states.ALL_DONE, function (err, jobs) {
        if (err) {
            winston.error(err);
            done(err, null);
            return;
        }

        if (jobs.length > 0) {
            winston.info('all done job found to process:', jobs.length);
            process_jobs(jobs, process_all_done_job, function (err, job) {
                if (err) {
                    winston.error(err);
                    job.error(err);
                }
                done();
            })
        } else {
            done();
        }
    });
};

let process_all_done_job = function (job, done) {
    let publicDate = moment(job.episode.publishAt);
    let now = moment();

    if (now.isAfter(publicDate)) {
        winston.info('job found to mark as public');
        job.next(function (err, job) {
            if (err) {
                winston.error(err);
                return done(err, null);
            }
            job.markOnPlanning(function (err, res) {
                if (err) {
                    winstong.error('job task error on marking on planning');
                    done();
                }
                done();
            });
        });
    } else {
        winston.info('job ' + job._id + ' is not public yet');
    }
};

let process_public_jobs = function (done) {
    find_jobs(states.PUBLIC, function (err, jobs) {
        if (err) {
            winston.error(err);
            done(err, null);
            return;
        }

        if (jobs.length > 0) {
            winston.info('public jobs found to process:', jobs.length);
            process_jobs(jobs, process_public_job, function (err) {
                if (err) {
                    winston.error(err);
                }
                done();
            })
        } else {
            done();
        }
    });
};

let process_public_job = function (job, done) {
    // clear all public videos from file system

    // Mark as public so it is deleted 24 hours after being online
    if (moment().isAfter(publicDate, 'day')) {
        // Episode is public
        winston.info('job found to mark as finished');
        job.next(function (err, job) {
            if (err) {
                winston.error(err);
                return done(err, null);
            }
        });
    } else {
        done();
    }
};

let process_wait_youtube_processing_jobs = function (done) {
    find_jobs(states.WAIT_YOUTUBE_PROCESSING, function (err, jobs) {
        if (err) {
            winston.error(err);
            done(err, null);
            return;
        }

        if (jobs.length > 0) {
            winston.info('wait processing job found to process:', jobs.length);
            process_jobs(jobs, process_wait_youtube_processing_job, function (err) {
                if (err) {
                    winston.error(err);
                }
                done();
            })
        } else {
            done();
        }
    });
};

let process_wait_youtube_processing_job = function (job, done) {
    youtubeProcessor.getVideoProcessorStats(job, function (err, job) {
        if (err) {
            winston.error(err);
            return done(err, null);
        }
        winston.info('processing info is', JSON.stringify(job.processing));
        if (job.processing && job.processing.processingStatus === 'succeeded') {
            // Move to next step as processing is done
            winston.info('video definition is', job.details.definition);
            if (job.details.definition === 'hd') {
                job.next(done);
            } else {
                job.message = 'video is still in sd on youtube';
                done(null, job);
            }
        } else {
            done(err, job);
        }
    })
};

let process_finished_jobs = function (done) {
    find_jobs(states.FINISHED, function (err, jobs) {
        if (err) {
            winston.error('cannot find finished jobs');
            winston.error(err);
            return done(err, null);
        }

        if (jobs.length > 0) {
            winston.info('found ' + jobs.length + 'finished jobs to process');

            for (let i = 0; i < jobs.length; i++) {
                let job = jobs[i];
                if (fs.existsSync(job.path)) {
                    winston.info('found file to delete as the video is now public :' + job.path);
                    fs.unlinkSync(job.path);
                }

                if (fs.existsSync(job.episode.path)) {
                    winston.info('found episode file to delete as the video is now public :' + job.episode.path);
                    fs.unlinkSync(job.episode.path);
                }

                job.remove();
            }

            winston.info('removed ' + jobs.length + ' jobs');
        } else {
            winston.info('no jobs to remove');
        }
    });

    // Clean logs
    let oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    Log.find({timestamp: {$lte: oneWeekAgo}}).exec(function (err, logs) {
        if (err) {
            winston.error('error retrieving logs older than a week ago');
        }

        if (logs.length > 0) {
            winston.info('found ' + logs.length + ' logs to remove');

            for (let i = 0; i < logs.length; i++) {
                let log = logs[i];
                log.remove();
            }

            winston.info('removed ' + logs.length + ' logs');
        } else {
            winston.info('no logs to remove');
        }
    });
};


