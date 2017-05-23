/**
 * Created by jdallard on 22/05/2017.
 */
'use strict';
const Job = require('./model/job.model');
const States = require('./config/states');
const moment = require('moment');

function YoutubeMetadataService($q, $http) {
    function Factory() {
    }

    Factory.prototype.setEndscreen = function (job) {
        // Simulate async nature of real remote calls
        let videoId = job.episode.youtube_id;
        let deferred = $q.defer();

        return deferred.promise;
    };

    function authenticateOnYoutube(videoId) {
        let deferred = $q.defer();
        nw.Window.open('https://www.youtube.com/edit?o=U&ns=1&video_id=' + videoId, {}, function (new_win) {
            // And listen to new window's focus event
            new_win.on('loaded', function () {
                console.log('loaded !', new_win);
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
            let parts = Math.floor(duration.asMinutes() / 25);
            var midrolls = [];
            for (var i = 1; i <= parts; i++) {
                midrolls.push("" + 25 * i + ":" + Math.floor(Math.random() * 60));
            }
            metadata.ad_breaks = {
                has_preroll: true,
                has_midroll: true,
                has_postroll: true,
                midrolls_are_manual: true,
                manual_midroll_times: midrolls
            };
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
                var str = [];
                for (var p in obj) {
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

    function getSession(videoId) {
        return $http.get('https://www.youtube.com/edit?o=U&ns=1&video_id=' + videoId).then(function (res) {
            var session = res.data.match(/var session_token = \"(.*?)\";/);
            if (session) {
                return session[1];
            } else {
                return $q.reject({code: 4000});
            }
        });
    }

    Factory.prototype.setMonetization = function (job) {
        let deferred = $q.defer();

        // Move to monetizing state
        job.next(function (err, job) {
            getSession(job.episode.youtube_id).then(function (session) {
                postMetadata(job, session).then(function (result) {
                    deferred.resolve(result);
                }, function (err) {
                    console.error(err);
                    deferred.reject('error while posting metadata');
                });
            }, function (err) {
                if (err.code === 4000) {
                    authenticateOnYoutube(job.episode.youtube_id).then(function (result) {
                        getSession().then(function (session) {
                            postMetadata(job, session).then(function (result) {
                                deferred.resolve(result);
                            }, function (err) {
                                console.error(err);
                                deferred.reject('error while posting metadata');
                            });
                        })
                    }, function (err) {
                        console.error(err);
                        deferred.reject('error while authenticating on Youtube');
                    });
                } else {
                    console.error(err);
                    deferred.reject('error on get Session');
                }
            });
        });

        return deferred.promise;
    };

    return new Factory();
}

export default ['$q', '$http', YoutubeMetadataService];