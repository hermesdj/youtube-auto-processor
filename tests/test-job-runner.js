/**
 * Created by Jérémy on 07/05/2017.
 */

let mongoose = require('mongoose');
let Task = require('./services/job-runner-service/job-runner-task');
let db_config = require('./config/database-config');
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

Task.run(function(err, jobs){

});