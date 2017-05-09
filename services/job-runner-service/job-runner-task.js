/**
 * Created by Jérémy on 07/05/2017.
 */
let path = require('path');
let Job = require('../../model/job.model');
let Serie = require('../../model/serie.model');
let EventEmitter = require('events').EventEmitter;
let util = require('util');
let moment = require('moment');
let flow = require('flow');
let states = require('../../config/states');
let serieProcessor = require('../../processors/serie-processor');
let sheetProcessor = require('../../processors/sheet-processor');
let thumbnailProcessor = require('../../processors/thumbnail-processor');
let playlistProcessor = require('../../processors/playlist-processor');

let processVideoService = require('../../services/process-video-service/install-service');
let processUploadService = require('../../services/upload-video-service/install-service');

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
            process_playlists_jobs(this);
        }, function () {
            process_all_done_jobs(this);
        }, function () {
            done();
        }
    )
}

util.inherits(jobRunner, EventEmitter);

exports.run = jobRunner;

let find_jobs = function (state, done) {
    Job.find({state: state.label}).sort('-date_created').populate({
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
    }, function () {
        done();
    });
};

let process_ready_jobs = function (done) {
    find_jobs(states.READY, function (err, jobs) {
        if (err) {
            console.error(err);
            return;
        }
        if (jobs.length > 0) {
            console.log('ready jobs found to process:' + jobs.length);
            process_jobs(jobs, serieProcessor.process, function (err, job) {
                if (err) {
                    console.error(err);
                    job.error(err);
                }
                console.log('done processing ready jobs');
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
            console.error(err);
            done(err, null);
        }
        if (jobs.length > 0) {
            console.log('initialized jobs found to process:' + jobs.length);
            process_jobs(jobs, process_initialized_job, function (err, result) {
                if (err) {
                    console.error(err);
                    job.error(err);
                }
                console.log('done processing ready jobs');
                done();
            });
        } else {
            done();
        }
    });
};

let process_initialized_job = function (job, done) {
    job.next(done);
};

let process_video_ready_jobs = function (done) {
    find_jobs(states.VIDEO_READY, function (err, jobs) {
        if (err) {
            console.error(err);
            done(err, null);
            return;
        }
        if (jobs.length > 0) {
            console.log('video ready jobs found to process:' + jobs.length);
            processVideoService();
        }
        done();
    });
};

let process_schedule_jobs = function (done) {
    find_jobs(states.SCHEDULE, function (err, jobs) {
        if (err) {
            console.error(err);
            done(err, null);
            return;
        }
        if (jobs.length > 0) {
            console.log('schedule jobs found to process:' + jobs.length);
            process_jobs(jobs, process_schedule_job, function (err) {
                if (err) {
                    console.error(err);
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
            console.error(err);
            done(err, null);
            return;
        }

        console.log(job.episode.video_name + ' scheduled on ' + result);
        job.episode.publishAt = moment(result).toDate();
        job.episode.save();
        job.next(done);
    });
};

let process_upload_ready_jobs = function (done) {
    find_jobs(states.UPLOAD_READY, function (err, jobs) {
        if (err) {
            console.error(err);
            done(err, null);
            return;
        }
        if (jobs.length > 0) {
            console.log('upload ready jobs found to process:' + jobs.length);
            processUploadService();
        }
        done();
    })
};

let process_upload_done_jobs = function (done) {
    find_jobs(states.UPLOAD_DONE, function (err, jobs) {
        if (err) {
            console.error(err);
            done(err, null);
            return;
        }

        if (jobs.length > 0) {
            console.log('upload done jobs found to process:' + jobs.length);
            process_jobs(jobs, process_upload_done_job, function (err) {
                if (err) {
                    console.error(err);
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
            console.error(err);
            done(err, null);
            return;
        }

        thumbnailProcessor.setThumbnail(job, function (err, job) {
            if (err) {
                console.error(err);
                done(err, null);
                return;
            }
            job.next(done);
        });
    });
};

let process_playlists_jobs = function (done) {
    find_jobs(states.PLAYLIST, function (err, jobs) {
        if (err) {
            console.error(err);
            done(err, null);
            return;
        }

        if (jobs.length > 0) {
            console.log('playlist jobs found to process:' + jobs.length);
            process_jobs(jobs, process_playlist_job, function (err) {
                if (err) {
                    console.error(err);
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
            console.error(err);
            job.error(err);
        }
        job.next(done);
    });
};

let createPlaylist = function (job, done) {
    playlistProcessor.createPlaylist(job, function (err) {
        if (err) {
            console.error(err);
            job.error(err);
            return done(err);
        }
        done(null);
    });
};

let process_all_done_jobs = function (done) {
    find_jobs(states.ALL_DONE, function (err, jobs) {
        if (err) {
            console.error(err);
            done(err, null);
            return;
        }

        if (jobs.length > 0) {
            process_jobs(jobs, process_all_done_job, function (err) {
                if (err) {
                    console.error(err);
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

    if (publicDate < now) {
        // Episode is public
        console.log('job found to mark as public');
        job.next(function (err, job) {
            if (err) {
                console.error(err);
                return done(err, null);
            }
            job.markOnPlanning(done);
        });
    } else {
        done();
    }
};


