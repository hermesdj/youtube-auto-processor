/**
 * Users DataService
 * Uses embedded, hard-coded data model; acts asynchronously to simulate
 * remote data service call(s).
 *
 * @returns {{loadAll: Function}}
 * @constructor
 */
'use strict';
let Job = require('./model/job.model');
let States = require('./config/states');

function JobsDataService($q) {
    function Factory() {
    }

    Factory.prototype.list = function (opts) {
        // Simulate async nature of real remote calls
        opts = opts || {};
        return Job.find(opts).populate({
            path: 'episode',
            populate: {
                path: 'serie',
                model: 'Serie'
            }
        }).exec();
    };

    Factory.prototype.getStates = function () {
        return States;
    };

    return new Factory();
}

export default ['$q', JobsDataService];

