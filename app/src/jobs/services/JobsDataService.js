/**
 * Users DataService
 * Uses embedded, hard-coded data model; acts asynchronously to simulate
 * remote data service call(s).
 *
 * @returns {{loadAll: Function}}
 * @constructor
 */
function JobsDataService($q) {
    // Promise-based API
    return {
        loadAllJobs: function() {
            // Simulate async nature of real remote calls
            return $q.when(users);
        }
    };
}

export default ['$q', JobsDataService];

