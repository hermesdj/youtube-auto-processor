/**
 * Created by Jérémy on 07/05/2017.
 */
var service = require('./service');

module.exports = function(){
    // Listen for the "uninstall" event so we know when it's done.
    service.on('uninstall',function(){
        console.log('Uninstall compvare.');
        console.log('The service exists: ', service.exists);
    });

// Uninstall the service.
    service.uninstall();
};