/**
 * Created by Jérémy on 15/05/2017.
 */
export default {
    name: 'servicesList',
    config: {
        bindings: {services: '<'},
        templateUrl: 'src/services/components/list/ServicesList.html',
        controller: ServicesListController
    }
};

function ServicesListController($interval, WinServiceDataService) {
    var self = this;

    function Factory() {
    }

    Factory.prototype.$onInit = function () {
        this.services = self.services;
        this.interval = $interval(function () {
            this.reload();
        }.bind(this), 500);
    };

    Factory.prototype.reload = function () {
        WinServiceDataService.list().then(function (services) {
            this.services = services;
        }.bind(this), function (err) {
            console.error(err);
        });
    };

    Factory.prototype.start = function (service) {
        WinServiceDataService.start(service).then(function (err) {
            if (err) {
                console.error(err);
            }
            this.reload();
        }.bind(this));
    };

    Factory.prototype.restart = function (service) {
        WinServiceDataService.restart(service).then(function (err) {
            if (err) {
                console.error(err);
            }
            this.reload();
        }.bind(this));
    };

    Factory.prototype.stop = function (service) {
        WinServiceDataService.stop(service).then(function (err) {
            if (err) {
                console.error(err);
            }
            this.reload();
        }.bind(this));
    };

    Factory.prototype.install = function (service) {
        WinServiceDataService.install(service).then(function (err) {
            if (err) {
                console.error(err);
            }
            this.reload();
        }.bind(this));
    };

    Factory.prototype.uninstall = function (service) {
        WinServiceDataService.uninstall(service).then(function (err) {
            if (err) {
                console.error(err);
            }
            this.reload();
        }.bind(this));
    };

    Factory.prototype.$onDestroy = function () {
        $interval.cancel(this.interval);
    };

    return new Factory();
}