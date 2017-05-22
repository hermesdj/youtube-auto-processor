/**
 * Created by jdallard on 09/05/2017.
 */
let moment = require('moment');
let momentCountdown = require('moment-countdown');

import _ from 'lodash';

export default {
    name: 'jobsList',
    config: {
        bindings: {jobs: '<'},
        templateUrl: 'src/jobs/components/list/JobsList.html',
        controller: JobsListController
    }
};

function JobsListController(JobsDataService, YoutubeMetadataService, $interval, $http) {
    var self = this;

    function Factory() {
    }

    Factory.prototype.$onInit = function () {
        this.jobs = self.jobs;
        this.states = JobsDataService.getStates();
        this.interval = $interval(function () {
            this.reload();
        }.bind(this), 500);
    };

    Factory.prototype.reload = function () {
        var filter = this.selectedFilter ? {state: this.selectedFilter} : {state: {$nin: ['ALL_DONE', 'PUBLIC']}};
        JobsDataService.list(filter).then(function (jobs) {
            let initialized = _.filter(this.jobs, function (job) {
                return job.state === 'INITIALIZED'
            });
            if (initialized.length === 0) {
                this.jobs = jobs;
            }
        }.bind(this), function (err) {
            console.error(err);
        });
    };

    Factory.prototype.next = function (job) {
        job.next(function () {
            console.log('next has been executed')
        });
    };

    Factory.prototype.remove = function (job) {
        if (job.episode) {
            job.episode.remove();
        }
        job.remove();
    };

    Factory.prototype.$onDestroy = function () {
        console.log('onDestroy');
        $interval.cancel(this.interval);
    };

    Factory.prototype.getRemainingTime = function (data) {
        let elapsed = moment().diff(data.startDate);
        let relativeProgress = data.progress / data.total;
        let estimated = 0;
        if (relativeProgress > 0) {
            estimated = elapsed / relativeProgress;
        }
        // TODO save last progress and update value only if progress has changed
        return moment(data.startDate).add(estimated).countdown().toString();
    };

    Factory.prototype.setEpisodeName = function (job, name) {
        job.episode.episode_name = name;
        job.episode.video_name = job.episode.video_name.replace('${episode_name}', name);
        job.episode.save(function () {
            job.next();
        });
    };

    function postMetadata(job, session) {
        var metadata = {
            video_monetization_style: 'ads',
            //ad_breaks: {has_preroll: true, has_midroll: false, has_postroll: true, midrolls_are_manual: true},
            syndication: 'everywhere',
            modified_fields: 'video_monetization_style,syndication',
            video_id: job.episode.youtube_id,
            session_token: session
        };
        return $http({
            method: 'POST',
            url: 'https://www.youtube.com/metadata_ajax?action_edit_video=1',
            data: metadata,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            transformRequest: function(obj) {
                var str = [];
                for(var p in obj) {
                    if(obj[p].hasOwnProperty('has_preroll')){
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(JSON.stringify(obj[p])));
                    }else{
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    }
                }
                return str.join("&");
            }
        }).then(function (res) {
            console.log(res);
        }, function (err) {
            console.log(err);
        })
    }

    Factory.prototype.monetize = function (job) {
        nw.Window.open('https://www.youtube.com/edit?o=U&ns=1&video_id=' + job.episode.youtube_id, {
            inject_js_start: 'load_window.js',
            inject_js_end: 'unload_window.js'
        }, function (new_win) {
            // And listen to new window's focus event
            new_win.on('focus', function () {
                console.log('New window is focused');
            });
            new_win.once('loaded', function () {
                console.log('loaded !');
                require("nw.gui").Window.get().cookies.getAll({}, console.table.bind(console));
                $http.get('https://www.youtube.com/edit?o=U&ns=1&video_id=' + job.episode.youtube_id).then(function (res) {
                    var session = res.data.match(/var session_token = \"(.*?)\";/);
                    console.log('session_token found', session[1]);
                    postMetadata(job, session[1]);
                });
            });
        });
    };

    Factory.prototype.endscreen = function (job) {
        YoutubeMetadataService.endscreen(job);
    };

    return new Factory();
}