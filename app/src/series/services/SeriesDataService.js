/**
 * Users DataService
 * Uses embedded, hard-coded data model; acts asynchronously to simulate
 * remote data service call(s).
 *
 * @returns {{loadAll: Function}}
 * @constructor
 */
'use strict';
let Serie = require('./model/serie.model');

function SeriesDataService($q) {
    function Factory() {
    }

    Factory.prototype.list = function (opts) {
        // Simulate async nature of real remote calls
        opts = opts || {};
        return Serie.find(opts).populate('episodes').exec();
    };

    Factory.prototype.get = function (id) {
        return Serie.findOne({_id: id}).populate('episodes').exec().then(function (serie) {
            console.log(serie);
            return serie;
        });
    };

    return new Factory();
}

export default ['$q', SeriesDataService];

