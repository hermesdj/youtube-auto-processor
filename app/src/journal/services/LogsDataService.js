'use strict';
let Log = require('./model/log.model');

function LogsDataService($q) {
    function Factory() {
    }


    Factory.prototype.list = function (opts, orders, limit, page) {
        // Simulate async nature of real remote calls
        opts = opts || {};
        return Log.find().sort(orders).limit(100).exec().then(function (data) {
            return {data: data};
        });
    };

    return new Factory();
}

export default ['$q', LogsDataService];

