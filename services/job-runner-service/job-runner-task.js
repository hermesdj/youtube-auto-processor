/**
 * Created by Jérémy on 07/05/2017.
 */
var path = require('path');
var Job = require('../../model/job.model');
var Serie = require('../../model/serie.model');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var moment = require('moment');
var flow = require('flow');
var fs = require('fs');
var states = require('../../config/states');
var serieProcessor = require('../../processors/serie-processor');
var sheetProcessor = require('../../processors/sheet-processor');
var thumbnailProcessor = require('../../processors/thumbnail-processor');
var playlistProcessor = require('../../processors/playlist-processor');

var processVideoService = require('../../services/process-video-service/install-service');
var processUploadService = require('../../services/upload-video-service/install-service');

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

var find_jobs = function (state, done) {
    Job.find({state: state.label}).sort('+date_created').populate({
        path: 'episode',
        populate: {
            path: 'serie',
            model: 'Serie'
        }
    }).exec(done);
};

var find_job = function (state, done) {
    Job.findOne({state: state.label}).sort('+date_created').populate({
        path: 'episode',
        populate: {
            path: 'serie',
            model: 'Serie'
        }
    }).exec(done);
};

var process_jobs = function (jobs, process, done) {
    flow.serialForEach(jobs, function (job) {
        process(job, this);
    }, function (err, job) {
        if (err) {
            console.error(err);
            job.error(err);
        }
    }, function () {
        done();
    });
};

var process_ready_jobs = function (done) {
    find_job(states.READY, function (err, job) {
        if (err) {
            console.error(err);
            return;
        }
        if (job) {
            console.log('ready jobs found to process:' + job._id);
            serieProcessor.process(job, function (err, job) {
                if (err) {
                    console.error(err);
                    job.error(err);
                }
                console.log('done processing ready job');
                done();
            });
        } else {
            done();
        }
    });
};

var process_initialized_jobs = function (done) {
    find_jobs(states.INITIALIZED, function (err, jobs) {
        if (err) {
            console.error(err);
            done(err, null);
        }
        if (jobs.length > 0) {
            console.log('initialized jobs found to process:' + jobs.length);
            process_jobs(jobs, process_initialized_job, function (err, job) {
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

var process_initialized_job = function (job, done) {
    if ((job.episode.serie && job.episode.serie.named_episode) || job.episode.video_name.indexOf('${episode_name}') > 0) {
        console.log('this needs a name, waiting for user input...');
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

var process_video_ready_jobs = function (done) {
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

var process_schedule_jobs = function (done) {
    find_jobs(states.SCHEDULE, function (err, jobs) {
        if (err) {
            console.error(err);
            done(err, null);
            return;
        }
        if (jobs.length > 0) {
            console.log('schedule jobs found to process:' + jobs.length);
            process_jobs(jobs, process_schedule_job, function (err, job) {
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

var process_schedule_job = function (job, done) {
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

var process_upload_ready_jobs = function (done) {
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

var process_upload_done_jobs = function (done) {
    find_jobs(states.UPLOAD_DONE, function (err, jobs) {
        if (err) {
            console.error(err);
            done(err, null);
            return;
        }

        if (jobs.length > 0) {
            console.log('upload done jobs found to process:' + jobs.length);
            process_jobs(jobs, process_upload_done_job, function (err, job) {
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

var process_upload_done_job = function (job, done) {
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

var process_thumbnail_jobs = function (done) {
    find_jobs(states.THUMBNAIL, function (err, jobs) {
        if (err) {
            console.error(err);
            done(err, null);
            return;
        }

        if (jobs.length > 0) {
            console.log('thumbnail jobs found to process:' + jobs.length);
            process_jobs(jobs, process_thumbnail_job, function (err, job) {
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

var process_thumbnail_job = function (job, done) {
    job.next(done);
};

var process_playlists_jobs = function (done) {
    find_jobs(states.PLAYLIST, function (err, jobs) {
        if (err) {
            console.error(err);
            done(err, null);
            return;
        }

        if (jobs.length > 0) {
            console.log('playlist jobs found to process:' + jobs.length);
            process_jobs(jobs, process_playlist_job, function (err, job) {
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

var process_playlist_job = function (job, done) {
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

var insertVideoToPlaylist = function (job, done) {
    playlistProcessor.addToPlaylist(job, function (err) {
        if (err) {
            console.error(err);
            job.error(err);
        }
        job.next(done);
    });
};

var createPlaylist = function (job, done) {
    playlistProcessor.createPlaylist(job, function (err) {
        if (err) {
            console.error(err);
            job.error(err);
            return done(err);
        }
        done(null);
    });
};

var process_all_done_jobs = function (done) {
    find_jobs(states.ALL_DONE, function (err, jobs) {
        if (err) {
            console.error(err);
            done(err, null);
            return;
        }

        if (jobs.length > 0) {
            console.log('all done job found to process:', jobs.length);
            process_jobs(jobs, process_all_done_job, function (err, job) {
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

var process_all_done_job = function (job, done) {
    var publicDate = moment(job.episode.publishAt);
    var now = moment();

    if (now.diff(publicDate) > 0) {
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

var process_public_jobs = function (done) {
    find_jobs(states.PUBLIC, function (err, jobs) {
        if (err) {
            console.error(err);
            done(err, null);
            return;
        }

        if (jobs.length > 0) {
            console.log('public job found to process:', jobs.length);
            process_jobs(jobs, process_public_job, function (err) {
                if (err) {
                    console.error(err);
                }
                done();
            })
        } else {
            done();
        }
    });
};

var process_public_job = function (job, done) {
    // clear all public videos from file system
    if (fs.existsSync(job.path)) {
        console.log('found file to delete as the video is now public', job.path);
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


