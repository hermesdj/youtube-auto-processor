'use strict';
let Log = require('./model/log.model');

function LogsDataService($q) {
    function Factory() {
    }


    Factory.prototype.list = function (opts, orders, limit, page) {
        // Simulate async nature of real remote calls
        opts = opts || {};
        return Log.find(opts).sort(orders).limit(limit).skip(limit * (page - 1)).exec().then(function (data) {
            return Log.count(opts).exec().then(function (count) {
                return {
                    data: data,
                    count: count
                }
            })
        });
    };

    return new Factory();
}

export default ['$q', LogsDataService];

