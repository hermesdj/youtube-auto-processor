/**
 * Created by Jérémy on 08/05/2017.
 */
var sheet_processor = require('./processors/sheet-processor');
var Job = require('./model/job.model');
var mongoose = require('mongoose');
var db_config = require('./config/database-config');
mongoose.connect(db_config.mongo.uri, db_config.mongo.options);

Job.findOne({state: 'SCHEDULE'}).sort('-date_created').populate({
    path: 'episode',
    populate: {
        path: 'serie',
        model: 'Serie'
    }
}).exec(function (err, job) {
    if (err) {
        console.error(err);
        return;
    }

    if (!job) {
        console.error('no job in SCHEDULE state');
        return;
    }
    sheet_processor.getScheduledDate(job, function (err, result) {
        if (err) {
            console.error(err);
            return;
        }
        console.log('scheduled date for', job.episode.video_name, 'is', result);
        sheet_processor.markAsPublic(job, function (err, result) {
            if (err) {
                console.error(err);
                return;
            }

            console.log('marked as ready', result);
        })
    });
});