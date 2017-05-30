/**
 * Created by jdallard on 09/05/2017.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let ServiceSchema = new Schema({
    service_name: String,
    service_description: String,
    installed: {type: Boolean, default: false},
    started: {type: Boolean, default: false},
    path: String
});

module.exports = mongoose.model('Service', ServiceSchema);