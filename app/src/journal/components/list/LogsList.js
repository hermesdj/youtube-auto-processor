/**
 * Created by jdallard on 09/05/2017.
 */

export default {
    name: 'logsList',
    config: {
        templateUrl: 'src/journal/components/list/LogsList.html',
        controller: LogsListController
    }
};

function LogsListController(LogsDataService, $interval, $filter) {
    let self = this;

    function Factory() {
        this.query = {
            filter: {},
            order: '+timestamp',
            limit: 10,
            page: 1
        };

        this.logstring = '';
        this.ago = new Date(((new Date()).getTime() - (15 * 60 * 1000)));

        function success(logs) {
            this.logs = logs;
        }
    }

    Factory.prototype.clearLabel = function () {
        delete this.query.filter.label;
    };

    Factory.prototype.$onInit = function () {
        this.logs = self.logs;
        this.reload(this.query);
        this.interval = $interval(function () {
            this.reload(this.query);
        }.bind(this), 1000);
    };

    Factory.prototype.reload = function (query) {
        console.log(query);
        var lastAgo = angular.copy(this.ago);
        this.ago = new Date();

        LogsDataService.list({timestamp: {$gte: lastAgo}}, {timestamp: -1}, query.limit, query.page).then(function (logs) {
            var newstring = '';
            for (var i = 0; i < logs.data.length; i++) {
                var log = logs.data[i];
                newstring += $filter('date')(log.timestamp, 'dd/MM/yyyy HH:mm:ss') + ' ' + log.label + ' ' + log.level + ' ' + log.message + '\r \n';
            }

            this.logstring = newstring + this.logstring;
        }.bind(this), function (err) {
            console.error(err);
        });
    };

    Factory.prototype.$onDestroy = function () {
        console.log('onDestroy');
        $interval.cancel(this.interval);
    };

    return new Factory();
}