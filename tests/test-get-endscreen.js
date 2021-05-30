/**
 * Created by Jérémy on 25/05/2017.
 */
const mongoose = require('mongoose');
const Job = require('../model/job.model');
const db_config = require('../config/database-config');
const {getEndScreen} = require('../processors/youtube-studio-processor');

mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

(async function(){
    await getEndScreen(null, function(err, result){
        if(err) console.error(err);
    });
})();



