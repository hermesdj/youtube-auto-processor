/**
 * Created by jdallard on 22/05/2017.
 */
'use strict';
const moment = require('moment');
const {google} = require('googleapis');
const client = require('./config/google-client-v1');
const fs = require('fs');
const path = require('path');
const config = JSON.parse(fs.readFileSync(path.resolve(path.join('./config', 'youtube.json'))));

import _ from 'lodash';

function YoutubeMetadataService($q, $http) {
    function Factory() {
    }

    Factory.prototype.setEndscreen = function (job) {
        let videoId = job.episode.youtube_id;
        let sourceId = config.endscreen_source_video_id || 'uoArPjzsStk';
        let deferred = $q.defer();
        console.log('setting endscreen for video', videoId);

        job.next(function (err, job) {
            if (err) {
                deferred.reject(err);
                return;
            }
            getSession('https://www.youtube.com/endscreen?v=', videoId).then(function (session) {
                console.log('session retrieved is', session);
                return retrieveEndscreen(videoId, sourceId, session).then(function (data) {
                    var editorData = angular.copy(data);
                    console.log('retrieved endscreen', data);
                    let oldPlaylist = _.find(editorData.elements, function (element) {
                        return element.type === 'PLAYLIST';
                    });
                    if (!oldPlaylist) {
                        return deferred.reject('no playlist to replace');
                    }
                    _.pull(editorData.elements, oldPlaylist);
                    return getCurrentPlaylist(job).then(function (playlist) {
                        console.log('found playlist', playlist);
                        console.log('old playlist is', oldPlaylist);
                        if (oldPlaylist.displayImages) {
                            oldPlaylist.displayImages.thumbnails = [playlist.snippet.thumbnails.high];
                        }
                        // oldPlaylist.playlistLength = playlist.contentDetails.itemCount + " vidéos";
                        // oldPlaylist.accessibilityStr = oldPlaylist.playlistLength + ', ' + playlist.snippet.title;
                        oldPlaylist.title = playlist.snippet.title;
                        oldPlaylist.playlistId = playlist.id;
                        // TODO find next episode id maybe ?
                        oldPlaylist.videoId = videoId;
                        oldPlaylist.targetUrl = 'https://www.youtube.com/watch?v=' + videoId + '&list=' + playlist.id;

                        editorData.elements.push(oldPlaylist);

                        return postEndscreen(editorData, videoId, session);
                    });
                });
            }).then(function (result) {
                console.log(result);
                if (result.errors && result.errors.length > 0) {
                    deferred.reject(result.errors[0]);
                } else {
                    deferred.resolve(result);
                }
            }, function (err) {
                console.error(err);
                deferred.reject(err);
            });
        });

        return deferred.promise;
    };

    function postEndscreen(data, videoId, session) {
        let metadata = {
            session_token: session,
            v: videoId,
            encrypted_video_id: videoId,
            action_save: 1
        };
        metadata = angular.extend(metadata, data);
        console.log('setting endscreen', metadata);
        return $http({
            method: 'POST',
            url: 'https://www.youtube.com/endscreen_ajax?v=' + videoId,
            data: metadata,
            headers: {
                'Content-Type': 'application/json'
            },
        }).then(function (res) {
            if (res.data.errors && res.data.errors.length > 0) {
                console.error('error while updating endscreen !');
                return $q.reject('error while posting endscreen : ' + res.data.errors);
            }
            console.log('update endscreen is successfull', res);
            return res.data;
        });
    }

    function getCurrentPlaylist(job) {
        let deferred = $q.defer();
        client(function (auth) {
            let youtube = google.youtube({
                version: 'v3',
                auth: auth.oauth2client
            });
            youtube.playlists.list({
                id: job.episode.serie.playlist_id,
                part: 'snippet,contentDetails'
            }, function (err, data) {
                if (err) {
                    console.error(err);
                    deferred.reject(err);
                }
                if (data) {
                    deferred.resolve(data.items[0]);
                } else {
                    console.error('no data in playlist response');
                    deferred.reject('no data in get playlist response');
                }
            });
        });
        return deferred.promise;
    }

    function retrieveEndscreen(videoId, sourceId, session) {
        let metadata = {
            session_token: session
        };
        return $http({
            method: 'POST',
            url: 'https://www.youtube.com/endscreen_ajax?v=' + videoId + '&encrypted_video_id=' + videoId + '&from_video_id=' + sourceId + '&action_retrieve_from_video=1',
            data: metadata,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        }).then(function (res) {
            return res.data.for_editor;
        });
    }

    function authenticateOnYoutube(videoId) {
        let deferred = $q.defer();
        nw.Window.open(`https://studio.youtube.com/video/${videoId}/edit`, {}, function (new_win) {
            // TODO revoir l'authentification
            new_win.on('loaded', function () {
                console.log('loaded !', new_win);
            });

            new_win.on('closed', function () {
                deferred.resolve();
            });
        });
        return deferred.promise;
    }

    function openMonetizeYoutubePage(videoId) {
        let deferred = $q.defer();
        nw.Window.open(`https://studio.youtube.com/video/${videoId}/monetization/ads`, {}, function (new_win) {
            new_win.on('loaded', function () {
                console.log('loaded !', new_win);
            });

            new_win.on('closed', function () {
                deferred.resolve();
            });
        });
        return deferred.promise;
    }

    Factory.prototype.setMonetization = function (job) {
        return openMonetizeYoutubePage(job.episode.youtube_id);
    };

    return new Factory();
}

export default ['$q', '$http', YoutubeMetadataService];
