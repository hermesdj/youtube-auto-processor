/**
 * Created by jdallard on 09/05/2017.
 */
const moment = require('moment');
const momentCountdown = require('moment-countdown');

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
    let self = this;

    function Factory() {
    }

    Factory.prototype.$onInit = function () {
        this.jobs = self.jobs;
        this.states = JobsDataService.getStates();
        this.interval = $interval(function () {
            this.reload();
        }.bind(this), 1000);
    };

    Factory.prototype.reload = function () {
        let filter = this.selectedFilter ? {state: this.selectedFilter} : {state: {$nin: ['ALL_DONE', 'PUBLIC', 'FINISHED']}};
        JobsDataService.list(filter).then(function (jobs) {
            let initialized = _.filter(this.jobs, function (job) {
                return job.state === 'INITIALIZED'
            });
            if (initialized.length === 0) {
                this.jobs = jobs;
            }
            let monetize = _.filter(this.jobs, function (job) {
                return job.state === 'MONETIZE'
            });
            if (monetize.length > 0) {
                for (let i = 0; i < monetize.length; i++) {
                    let job = monetize[i];
                    this.monetize(job);
                }
            }

            let endscreen = _.filter(this.jobs, function (job) {
                return job.state === 'ENDSCREEN'
            });
            if(endscreen.length > 0){
                console.log('found', endscreen.length, 'job to process in ENDSCREEN state');
                for (let i = 0; i < endscreen.length; i++) {
                    let job = endscreen[i];
                    this.endscreen(job);
                }
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

    Factory.prototype.monetize = function (job) {
        YoutubeMetadataService.setMonetization(job).then(function (result) {
            job.next(function (err, job) {
                if (err) {
                    console.error(err);
                    job.error(err);
                }
                console.log('job is next now', job);
            });
        }, function (err) {
            console.error(err);
            job.error(err);
        });
    };

    Factory.prototype.endscreen = function (job) {
        console.log('processing endscreen', job);
        YoutubeMetadataService.setEndscreen(job).then(function(result){
            job.next(function (err, job) {
                if (err) {
                    console.error(err);
                    job.error(err);
                }
                console.log('job is next now', job);
            });
        }, function(err){
            console.error(err);
            job.error(err);
        });
    };

    return new Factory();
}