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

function JobsListController(JobsDataService, $interval) {
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
            console.log('initialized', initialized);
            if (initialized.length === 0) {
                this.jobs = jobs;
                console.log(jobs);
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
        job.episode.remove();
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

    return new Factory();
}