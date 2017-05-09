/**
 * Created by jdallard on 09/05/2017.
 */

import JobsDataService from 'src/jobs/services/JobsDataService';

import JobsList from 'src/jobs/components/list/JobsList';
import JobDetails from 'src/jobs/components/details/JobDetails';

// Define the Angular 'users' module

export default angular
    .module('jobs', ['ngMaterial'])

    .component(JobsList.name, JobsList.config)
    .component(JobDetails.name, JobDetails.config)

    .service('JobsDataService', JobsDataService);