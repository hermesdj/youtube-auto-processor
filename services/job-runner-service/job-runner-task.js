/**
 * Created by Jérémy on 07/05/2017.
 */
const path = require('path');
const Job = require('../../model/job.model');
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
            process_video_ready_jobs(this);
        }, function () {
            process_schedule_jobs(this);
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
            done();
        }
    )
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
            winston.log('ready jobs found to process:' + job._id);
            serieProcessor.process(job, function (err, job) {
                if (err) {
                    winston.error(err);
                    job.error(err);
                }
                winston.log('done processing ready job');
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
            winston.log('initialized jobs found to process:' + jobs.length);
            process_jobs(jobs, process_initialized_job, function (err, job) {
                if (err) {
                    winston.error(err);
                    job.error(err);
                }
                winston.log('done processing ready jobs');
                done();
            });
        } else {
            done();
        }
    });
};

let process_initialized_job = function (job, done) {
    if ((job.episode.serie && job.episode.serie.named_episode) || job.episode.video_name.indexOf('${episode_name}') > 0) {
        winston.log('this needs a name, waiting for user input...');
        if (job.episode.episode_name) {
            job.episode.video_name = job.episode.video_name.replace('${episode_name}', job.episode.episode_name);
            job.episode.save(function () {
                job.next(done);
            });
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
            winston.log('video ready jobs found to process:' + jobs.length);
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
            winston.log('schedule jobs found to process:' + jobs.length);
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
        winston.log(job.episode.video_name + ' scheduled on ' + job.episode.publishAt);
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
            winston.log('upload ready jobs found to process:' + jobs.length);
            processUploadService();
        }
        done();
    })
};

let process_upload_done_jobs = function (done) {
    find_jobs(states.UPLOAD_DONE, function (err, jobs) {
        if (err) {
            winston.error(err);
            done(err, null);
            return;
        }

        if (jobs.length > 0) {
            winston.log('upload done jobs found to process:' + jobs.length);
            process_jobs(jobs, process_upload_done_job, function (err, job) {
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
            winston.log('thumbnail jobs found to process:' + jobs.length);
            process_jobs(jobs, process_thumbnail_job, function (err, job) {
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
            winston.log('playlist jobs found to process:' + jobs.length);
            process_jobs(jobs, process_playlist_job, function (err, job) {
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
            winston.log('all done job found to process:', jobs.length);
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

    if (now.diff(publicDate) > 0) {
        // Episode is public
        winston.log('job found to mark as public');
        job.next(function (err, job) {
            if (err) {
                winston.error(err);
                return done(err, null);
            }
            job.markOnPlanning(done);
        });
    } else {
        done();
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
            winston.log('public job found to process:', jobs.length);
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
    if (fs.existsSync(job.path)) {
        winston.log('found file to delete as the video is now public', job.path);
        fs.unlink(job.path, function (err) {
            if (err) {
                return done(err);
            }
            return done(null, job);
        });
    } else {
        done(null, job);
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
            winston.log('wait processing job found to process:', jobs.length);
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
        winston.log('processing info is', job.processing);
        if (job.processing && job.processing.processingStatus === 'succeeded') {
            // Move to next step as processing is done
            job.next(done);
        } else {
            done(err, job);
        }
    })
};


