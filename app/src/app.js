// Load libraries
import angular from 'angular';

import 'angular-animate';
import 'angular-aria';
import 'angular-material';
import 'angular-ui-router';
import 'angular-moment';

import AppController from 'src/AppController';
import Jobs from 'src/jobs/Jobs';
import Services from 'src/services/Services';
import Series from 'src/series/Series';

export default angular.module('starter-app', ['ngMaterial', 'ui.router', 'angularMoment', Jobs.name, Services.name, Series.name])
    .config(($mdIconProvider, $mdThemingProvider, $stateProvider, $urlRouterProvider) => {
        // Register the user `avatar` icons
        $mdIconProvider
            .defaultIconSet('./assets/svg/avatars.svg', 128)
            .icon('menu', './assets/svg/menu.svg', 24)
            .icon('share', './assets/svg/share.svg', 24)
            .icon('google_plus', './assets/svg/google_plus.svg', 24)
            .icon('hangouts', './assets/svg/hangouts.svg', 24)
            .icon('twitter', './assets/svg/twitter.svg', 24)
            .icon('start', './assets/svg/play.svg', 24)
            .icon('stop', './assets/svg/stop.svg', 24)
            .icon('restart', './assets/svg/replay.svg', 24)
            .icon('install', './assets/svg/server-plus.svg', 24)
            .icon('uninstall', './assets/svg/server-minus.svg', 24)
            .icon('refresh', './assets/svg/refresh.svg', 24)
            .icon('add', './assets/svg/plus.svg', 24)
            .icon('edit', './assets/svg/pencil.svg', 24)
            .icon('delete', './assets/svg/delete.svg', 24)
            .icon('next', './assets/svg/arrow-right-bold-circle.svg', 24)
            .icon('phone', './assets/svg/phone.svg', 24)
            .icon('pause', './assets/svg/pause-circle-outline.svg', 24);

        let customPrimary = {
            '50': '#ef7579',
            '100': '#ec5e63',
            '200': '#e9474d',
            '300': '#e73036',
            '400': '#e31b21',
            '500': '#cc181e',
            '600': '#b5151b',
            '700': '#9e1317',
            '800': '#881014',
            '900': '#710d11',
            'A100': '#f18c8f',
            'A200': '#f4a2a5',
            'A400': '#f7b9bb',
            'A700': '#5a0b0d'
        };
        $mdThemingProvider
            .definePalette('customPrimary',
                customPrimary);

        let customAccent = {
            '50': '#0b416b',
            '100': '#0e4f82',
            '200': '#105d99',
            '300': '#136bb0',
            '400': '#1579c7',
            '500': '#1887de',
            '600': '#3e9fea',
            '700': '#55aaed',
            '800': '#6cb6ef',
            '900': '#83c1f2',
            'A100': '#3e9fea',
            'A200': '#2793e8',
            'A400': '#1887de',
            'A700': '#9acdf4'
        };
        $mdThemingProvider
            .definePalette('customAccent',
                customAccent);

        let customWarn = {
            '50': '#ffb280',
            '100': '#ffa266',
            '200': '#ff934d',
            '300': '#ff8333',
            '400': '#ff741a',
            '500': '#ff6400',
            '600': '#e65a00',
            '700': '#cc5000',
            '800': '#b34600',
            '900': '#993c00',
            'A100': '#ffc199',
            'A200': '#ffd1b3',
            'A400': '#ffe0cc',
            'A700': '#803200'
        };
        $mdThemingProvider
            .definePalette('customWarn',
                customWarn);

        let customBackground = {
            '50': '#ffffff',
            '100': '#ffffff',
            '200': '#ffffff',
            '300': '#ffffff',
            '400': '#fefefe',
            '500': '#f1f1f1',
            '600': '#e4e4e4',
            '700': '#d7d7d7',
            '800': '#cbcbcb',
            '900': '#bebebe',
            'A100': '#ffffff',
            'A200': '#ffffff',
            'A400': '#ffffff',
            'A700': '#b1b1b1'
        };

        var darkBackground = {
            '50': '#737373',
            '100': '#666666',
            '200': '#595959',
            '300': '#4d4d4d',
            '400': '#404040',
            '500': '#333',
            '600': '#262626',
            '700': '#1a1a1a',
            '800': '#0d0d0d',
            '900': '#000000',
            'A100': '#808080',
            'A200': '#8c8c8c',
            'A400': '#999999',
            'A700': '#000000'
        };
        $mdThemingProvider
            .definePalette('darkBackground',
                darkBackground);
        $mdThemingProvider
            .definePalette('customBackground',
                customBackground);

        $mdThemingProvider.theme('default')
            .primaryPalette('customPrimary')
            .accentPalette('customAccent')
            .warnPalette('customWarn')
            .backgroundPalette('customBackground');
        $mdThemingProvider.theme('dark')
            .backgroundPalette('darkBackground').dark();


        $stateProvider
            .state('jobs', {
                url: '/jobs',
                component: 'jobsList', // The component's name
                resolve: {
                    jobs: function (JobsDataService) {
                        return JobsDataService.list({state: {$nin: ['ALL_DONE', 'PUBLIC']}});
                    }
                }
            })
            .state('series', {
                url: '/series',
                component: 'seriesList', // The component's name
                resolve: {
                    series: function (SeriesDataService) {
                        return SeriesDataService.list();
                    }
                }
            })
            .state('series.edit', {
                url: '/edit/:id',
                component: 'editSerie', // The component's name
                resolve: {
                    serie: function (SeriesDataService, $stateParams) {
                        return SeriesDataService.get($stateParams.id);
                    }
                }
            })
            .state('services', {
                url: '/services',
                component: 'servicesList', // The component's name
                resolve: {
                    services: function (WinServiceDataService) {
                        return WinServiceDataService.list();
                    }
                }
            })
            .state('settings', {
                url: '/settings'
            });

        $urlRouterProvider.otherwise('/jobs');
    })
    .controller('AppController', AppController);
