/**
 * Created by Jérémy on 09/05/2017.
 */
var google = require('googleapis');
var client = require('../../config/google-client');

function process(auth, job, done) {
    var youtube = google.youtube({
        version: 'v3',
        auth: auth.oauth2client
    });

    var playlistId = job.episode.serie.playlist_id;
    if (!playlistId) {
        return done('no playlist id in serie', null);
    }

    var videoId = job.episode.youtube_id;
    if (!videoId) {
        return done('no video id in episode', null);
    }

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
    if (!job.episode) {
        console.error('this job has no episode configured to add to a playlist !');
        return done('playlist job error, no episode', null);
    }

    if (!job.episode.serie) {
        console.error('this job has no serie configured to add configure a playlist !');
        return done('playlist job error, no serie', null);
    }

    client(function (auth) {
        process(auth, job, done);
    });
};

function create(auth, job, done) {
    var youtube = google.youtube({
        version: 'v3',
        auth: auth.oauth2client
    });

    var metadata = {
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
        done(null, job);
    });
}

exports.createPlaylist = function (job, done) {
    if (!job.episode) {
        console.error('this job has no episode configured to add to a playlist !');
        return done('playlist job error, no episode', null);
    }

    if (!job.episode.serie) {
        console.error('this job has no serie configured to add configure a playlist !');
        return done('playlist job error, no serie', null);
    }

    client(function (auth) {
        create(auth, job, done);
    });
};