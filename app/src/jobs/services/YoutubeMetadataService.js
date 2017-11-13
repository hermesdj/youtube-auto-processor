/**
 * Created by jdallard on 22/05/2017.
 */
'use strict';
const Job = require('./model/job.model');
const States = require('./config/states');
const moment = require('moment');
const google = require('googleapis');
const client = require('./config/google-client');
const fs = require('fs');
const path = require('path');
const config = JSON.parse(fs.readFileSync(path.resolve(path.join('./config', 'youtube.json'))))

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
                return retrieveEndscreen(videoId, sourceId, session).then(function (editorData) {
                    let oldPlaylist = _.find(editorData.elements, function (element) {
                        return element.type === 'PLAYLIST';
                    });
                    if (!oldPlaylist) {
                        return deferred.reject('no playlist to replace');
                    }
                    _.pull(editorData.elements, oldPlaylist);
                    return getCurrentPlaylist(job).then(function (playlist) {
                        oldPlaylist.displayImages.thumbnails = [playlist.snippet.thumbnails.high];
                        oldPlaylist.playlistLength = playlist.contentDetails.itemCount + " vidéos";
                        oldPlaylist.accessibilityStr = oldPlaylist.playlistLength + ', ' + playlist.snippet.title;
                        oldPlaylist.title = playlist.snippet.title;
                        oldPlaylist.playlistId = playlist.id;
                        // TODO find next episode id maybe ?
                        oldPlaylist.videoId = videoId;
                        oldPlaylist.targetUrl = encodeURIComponent('https://www.youtube.com/watch?v=' + videoId + '&list=' + playlist.id);

                        editorData.elements.push(oldPlaylist);

                        return postEndscreen(editorData, videoId, session);
                    });
                });
            }).then(function (result) {
                console.log(result);
                deferred.resolve(result);
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
        return $http({
            method: 'POST',
            url: 'https://www.youtube.com/endscreen_ajax?v=' + videoId,
            data: metadata,
            headers: {
                'Content-Type': 'application/json'
            },
        }).then(function (res) {
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
            let req = youtube.playlists.list({
                id: job.episode.serie.playlist_id,
                part: 'snippet,contentDetails'
            }, function (err, data) {
                if (err) {
                    deferred.reject(err);
                }
                if (data) {
                    deferred.resolve(data.items[0]);
                } else {
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
        nw.Window.open('https://www.youtube.com/edit?o=U&ns=1&video_id=' + videoId, {}, function (new_win) {
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

    function postMetadata(job, session) {
        let metadata = {
            video_monetization_style: 'ads',
            syndication: 'everywhere',
            modified_fields: 'video_monetization_style,syndication',
            video_id: job.episode.youtube_id,
            session_token: session
        };

        let duration = moment.duration(job.details.duration);
        if (duration.asMinutes() > 10) {
            metadata.ad_breaks = {
                has_preroll: true,
                has_postroll: true,
            };
            let parts = Math.floor(duration.asMinutes() / 25);
            console.log('parts found in video with', duration.asMinutes(), 'duration are', parts);
            var midrolls = [];
            for (var i = 1; i <= parts; i++) {
                midrolls.push("" + Math.floor((duration.asMinutes() / (parts + 1))) * i + ":" + Math.floor(Math.random() * 60));
            }
            console.log('midrolls generated are', midrolls);
            metadata.ad_breaks.has_midroll = midrolls.length > 0;
            if (midrolls.length > 0) {
                metadata.ad_breaks.midrolls_are_manual = true;
                metadata.ad_breaks.manual_midroll_times = midrolls
            }
            metadata.modified_fields = metadata.modified_fields + ',ad_breaks';
        }

        console.log('metadata sent to youtube:', metadata);

        return $http({
            method: 'POST',
            url: 'https://www.youtube.com/metadata_ajax?action_edit_video=1',
            data: metadata,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            transformRequest: function (obj) {
                let str = [];
                for (let p in obj) {
                    if (obj[p].hasOwnProperty('has_preroll')) {
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(JSON.stringify(obj[p])));
                    } else {
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    }
                }
                return str.join("&");
            }
        }).then(function (result) {
            if (result.data.metadata_errors.length === 0) {
                return true;
            } else {
                return $q.reject(result.data.metadata_errors);
            }
        });
    }

    function getSession(url, videoId) {
        let deferred = $q.defer();
        $http.get(url + videoId).then(function (res) {
            let session = res.data.match(/var session_token = \"(.*?)\";/);
            if (session) {
                return session[1];
            } else {
                session = res.data.match(/'XSRF_TOKEN': \"(.*?)\"/);
                if (session) {
                    return session[1];
                } else {
                    return $q.reject({code: 4000});
                }
            }
        }).then(function (session) {
            deferred.resolve(session);
        }, function (err) {
            if (err.code === 4000) {
                console.log('no session found, authenticating on youtube');
                authenticateOnYoutube(videoId).then(function () {
                    getSession(url, videoId).then(function (session) {
                        deferred.resolve(session);
                    }, function (err) {
                        console.error(err);
                        deferred.reject(err);
                    });
                }, function (err) {
                    console.error(err);
                    deferred.reject('error while authenticating on Youtube');
                });
            } else {
                console.error(err);
                deferred.reject('error on get Session');
            }
        });
        return deferred.promise;
    }

    Factory.prototype.setMonetization = function (job) {
        let deferred = $q.defer();

        // Move to monetizing state
        job.next(function (err, job) {
            getSession('https://www.youtube.com/edit?o=U&ns=1&video_id=', job.episode.youtube_id)
                .then(function (session) {
                    postMetadata(job, session).then(function (result) {
                        deferred.resolve(result);
                    }, function (err) {
                        console.error(err);
                        deferred.reject('error while posting metadata');
                    });
                });
        });

        return deferred.promise;
    };

    return new Factory();
}

export default ['$q', '$http', YoutubeMetadataService];
