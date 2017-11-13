/**
 * Created by Jérémy on 09/05/2017.
 */
const google = require('googleapis');
const client = require('../../config/google-client');
const winston = require('winston');

function process(auth, job, done) {
    let youtube = google.youtube({
        version: 'v3',
        auth: auth.oauth2client
    });

    let playlistId = job.episode.serie.playlist_id;
    if (!playlistId) {
        return done('no playlist id in serie', null);
    }

    let videoId = job.episode.youtube_id;
    if (!videoId) {
        return done('no video id in episode', null);
    }

    winston.info('adding ' + videoId + ' to playlist ' + playlistId);

    youtube.playlistItems.insert({
        part: 'snippet',
        resource: {
            snippet: {
                playlistId: playlistId,
                resourceId: {
                    videoId: videoId,
                    kind: 'youtube#video'
                }
            }
        }
    }, done);
}

exports.addToPlaylist = function (job, done) {
    if (!job) {
        winston.error('No job to insert the playlist from !');
        return done('No job to insert the playlist from !');
    }

    if (!job.episode) {
        winston.error('this job has no episode configured to add to a playlist !');
        return done('playlist job error, no episode', null);
    }

    if (!job.episode.serie) {
        winston.error('this job has no serie configured to add configure a playlist !');
        return done('playlist job error, no serie', null);
    }

    winston.debug('adding episode to playlist', job.episode.video_name);

    client(function (auth) {
        process(auth, job, done);
    });
};

function create(auth, job, done) {
    let youtube = google.youtube({
        version: 'v3',
        auth: auth.oauth2client
    });

    let metadata = {
        part: 'snippet, status',
        resource: {
            snippet: {
                title: job.episode.serie.playlist_title,
                description: job.episode.serie.description,
                tags: job.episode.serie.keywords
            },
            status: {
                privacyStatus: 'public'
            }
        }
    };

    youtube.playlists.insert(metadata, function (err, data) {
        if (err) {
            return done(err, null);
        }
        job.episode.serie.playlist_id = data.id;
        job.episode.serie.save(done);
    });
}

exports.createPlaylist = function (job, done) {
    if (!job) {
        winston.error('No job to create the playlist from !');
        return done('No job to create the playlist from !');
    }
    if (!job.episode) {
        winston.error('this job has no episode configured to add to a playlist !');
        return done('playlist job error, no episode');
    }

    if (!job.episode.serie) {
        winston.error('this job has no serie configured to add configure a playlist !');
        return done('playlist job error, no serie');
    }

    client(function (auth) {
        create(auth, job, done);
    });
};
