/**
 * Created by Jérémy on 15/05/2017.
 */
import SeriesDataService from 'src/series/services/SeriesDataService';

import SeriesList from 'src/series/components/list/SeriesList';
import EditSerie from 'src/series/components/edit/EditSerie';

// Define the Angular 'users' module

export default angular
    .module('series', ['ngMaterial'])

    .component(SeriesList.name, SeriesList.config)
    .component(EditSerie.name, EditSerie.config)

    .service('SeriesDataService', SeriesDataService);