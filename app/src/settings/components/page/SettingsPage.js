const fs = require('fs');
const path = require('path');

export default {
    name: 'settingsPage',
    config: {
        bindings: {settings: '<'},
        templateUrl: 'src/settings/components/page/SettingsPage.html',
        controller: SettingsPageController
    }
};

function SettingsPageController($scope) {
    function Factory() {
    }


    Factory.prototype.$onInit = function () {
        this.configPath = './config/';
        this.settings = {
            app: JSON.parse(fs.readFileSync(path.resolve(path.join(this.configPath, 'app.json')))),
            youtube: JSON.parse(fs.readFileSync(path.resolve(path.join(this.configPath, 'youtube.json'))))
        };

        console.log(this);
        console.log(this.settings);
    };

    Factory.prototype.openDirectorySelector = function (id) {
        setTimeout(function () {
            document.getElementById(id).click();
            $scope.$apply();
        }, 0);
    };

    Factory.prototype.pickDirectory = function (element) {
        console.log(element);
    };

    Factory.prototype.save = function () {

    };

    return new Factory();
}