/**
 * Main App Controller for the Angular Material Starter App
 * @param JobsDataService
 * @param $mdSidenav
 * @constructor
 */
function AppController($mdSidenav) {
    let self = this;
    self.toggleList = function () {
        $mdSidenav('left').toggle();
    };
    self.showDevTools = function () {
        win.showDevTools();
    }
}

export default ['$mdSidenav', AppController];
