// Load libraries
import angular from 'angular';

import 'angular-animate';
import 'angular-aria';
import 'angular-material';

import AppController from 'src/AppController';
import Jobs from 'src/jobs/Jobs';

export default angular.module( 'starter-app', [ 'ngMaterial', Jobs.name ] )
  .config(($mdIconProvider, $mdThemingProvider) => {
    // Register the user `avatar` icons
    $mdIconProvider
      .defaultIconSet("./assets/svg/avatars.svg", 128)
      .icon("menu", "./assets/svg/menu.svg", 24)
      .icon("share", "./assets/svg/share.svg", 24)
      .icon("google_plus", "./assets/svg/google_plus.svg", 24)
      .icon("hangouts", "./assets/svg/hangouts.svg", 24)
      .icon("twitter", "./assets/svg/twitter.svg", 24)
      .icon("phone", "./assets/svg/phone.svg", 24);

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
      $mdThemingProvider
          .definePalette('customBackground',
              customBackground);

      $mdThemingProvider.theme('default')
          .primaryPalette('customPrimary')
          .accentPalette('customAccent')
          .warnPalette('customWarn')
          .backgroundPalette('customBackground');
  })
  .controller('AppController', AppController);
