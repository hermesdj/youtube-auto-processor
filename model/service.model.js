/**
 * Created by jdallard on 09/05/2017.
 */
let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let ServiceSchema = new Schema({
    service_name: String,
    service_description: String,
    exists: Boolean,
    state: String,
    path: String
});

module.exports = mongoose.model('Service', ServiceSchema);