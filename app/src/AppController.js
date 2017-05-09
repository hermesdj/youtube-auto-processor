/**
 * Main App Controller for the Angular Material Starter App
 * @param JobsDataService
 * @param $mdSidenav
 * @constructor
 */
function AppController(JobsDataService, $mdSidenav) {
    let self = this;

    self.selected = null;
    self.jobs = [];
    self.selectJob = selectJob;
    self.toggleList = toggleJobsList;

    // Load all registered users

    JobsDataService
        .loadAllJobs()
        .then(function (users) {
            self.jobs = [].concat(jobs);
            self.selected = jobs[0];
        });

    // *********************************
    // Internal methods
    // *********************************

    /**
     * Hide or Show the 'left' sideNav area
     */
    function toggleJobsList() {
        $mdSidenav('left').toggle();
    }

    /**
     * Select the current avatars
     * @param menuId
     */
    function selectJob(user) {
        self.selected = angular.isNumber(user) ? $scope.users[user] : user;
    }
}

export default ['UsersDataService', '$mdSidenav', AppController];
