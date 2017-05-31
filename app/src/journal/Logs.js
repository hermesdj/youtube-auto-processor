/**
 * Created by jdallard on 09/05/2017.
 */

import LogsDataService from 'src/journaljournal/services/LogsDataService';

import LogsList from 'src/journaljournal/components/list/LogsList';

// Define the Angular 'users' module


export default angular
    .module('logs', ['ngMaterial'])

    .component(LogsList.name, LogsList.config)

    .service('LogsDataService', LogsDataService);