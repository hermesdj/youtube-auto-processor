/**
 * Created by Jérémy on 15/05/2017.
 */
export default {
    name: 'seriesList',
    config: {
        bindings: {series: '<'},
        templateUrl: 'src/series/components/list/SeriesList.html',
        controller: SeriesListController
    }
};

function SeriesListController() {
}