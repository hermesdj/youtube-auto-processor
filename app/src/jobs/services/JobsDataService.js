/**
 * Users DataService
 * Uses embedded, hard-coded data model; acts asynchronously to simulate
 * remote data service call(s).
 *
 * @returns {{loadAll: Function}}
 * @constructor
 */
'use strict';
let Job = require('../model/job.model');

function JobsDataService($q) {
    // Promise-based API
    return {
        list: function (opts) {
            // Simulate async nature of real remote calls
            opts = opts || {};
            return Job.find(opts).populate({
                path: 'episode',
                populate: {
                    path: 'serie',
                    model: 'Serie'
                }
            });
        }
    };
}

export default ['$q', JobsDataService];

