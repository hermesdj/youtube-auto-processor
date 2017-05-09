/**
 * Created by jdallard on 09/05/2017.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ServiceSchema = new Schema({
    service_name: String,
    service_description: String,
    exists: Boolean,
    state: String,
    path: String
});

module.exports = mongoose.model('Service', ServiceSchema);