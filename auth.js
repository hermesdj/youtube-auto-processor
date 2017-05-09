/**
 * Created by Jérémy on 07/05/2017.
 */
var upload_processor = require('./processors/upload-processor');
var path = require('path');

upload_processor.authorize(path.join(__dirname, './config/client_secret.json'), function (res) {
    console.log(res);
});