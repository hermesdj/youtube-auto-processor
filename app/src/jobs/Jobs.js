/**
 * Created by jdallard on 09/05/2017.
 */

import JobsDataService from 'src/jobs/services/JobsDataService';
import YoutubeMetadataService from 'src/jobs/services/YoutubeMetadataService';

import JobsList from 'src/jobs/components/list/JobsList';

// Define the Angular 'users' module

export default angular
    .module('jobs', ['ngMaterial'])

    .component(JobsList.name, JobsList.config)

    .service('JobsDataService', JobsDataService)
    .service('YoutubeMetadataService', YoutubeMetadataService);