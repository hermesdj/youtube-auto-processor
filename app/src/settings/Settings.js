/**
 * Created by Jérémy on 15/05/2017.
 */
import SettingsPage from 'src/settings/components/page/SettingsPage';

// Define the Angular 'users' module

export default angular
    .module('settings', ['ngMaterial'])

    .component(SettingsPage.name, SettingsPage.config);