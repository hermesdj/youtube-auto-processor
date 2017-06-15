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

function LogsListController(LogsDataService, $interval) {
    let self = this;

    function Factory() {
        this.query = {
            filter: {
                level: 'debug'
            },
            order: '-timestamp',
            limit: 10,
            page: 1
        };

        function success(logs) {
            this.logs = logs;
        }
    }

    Factory.prototype.clearLabel = function () {
        delete this.query.filter.label;
    };

    Factory.prototype.$onInit = function () {
        this.logs = self.logs;
        this.interval = $interval(function () {
            this.reload(this.query);
        }.bind(this), 1000);
    };

    Factory.prototype.reload = function (query) {
        //console.log(query);
        LogsDataService.list(query.filter, query.order, query.limit, query.page).then(function (logs) {
            this.logs = logs;
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