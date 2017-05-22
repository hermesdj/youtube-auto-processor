/**
 * Created by jdallard on 22/05/2017.
 */
'use strict';
const Job = require('./model/job.model');
const States = require('./config/states');

function YoutubeMetadataService($q) {
    function Factory() {
    }

    Factory.prototype.setEndscreen = function (job) {
        // Simulate async nature of real remote calls
        let videoId = job.episode.youtube_id;
        let deferred = $q.defer();

        return deferred.promise;
    };

    return new Factory();
}

export default ['$q', YoutubeMetadataService];