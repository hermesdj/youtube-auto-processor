/**
 * Created by Jérémy on 15/05/2017.
 */
import WinServiceDataService from 'src/services/services/WinServiceDataService';

import ServicesList from 'src/services/components/list/ServicesList';

// Define the Angular 'users' module

export default angular
    .module('services', ['ngMaterial'])

    .component(ServicesList.name, ServicesList.config)

    .service('WinServiceDataService', WinServiceDataService);