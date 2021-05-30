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

function SeriesListController(SeriesDataService) {
    function Factory() {

    }

    Factory.prototype.refresh = function () {
        return SeriesDataService.list().then(series => {
            this.series = series;
        });
    };

    Factory.prototype.delete = function (serie) {
        console.log(serie);
        return serie.remove().then(() => this.refresh());
    };

    return new Factory();
}