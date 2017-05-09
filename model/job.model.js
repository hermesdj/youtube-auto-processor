/**
 * Created by Jérémy on 06/05/2017.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Serie = require('./serie.model');
var states = require('../config/states');
var sheetProcessor = require('../processors/sheet-processor');

var JobSchema = new Schema({
    path: String,
    date_created: {type: Date, default: null, unique: true, required: true, dropDubs: true},
    state: {type: String, default: states.READY.label},
    upload_data: Schema.Types.Mixed,
    episode: {type: Schema.Types.ObjectId, ref: 'Episode'},
    err: Schema.Types.Mixed
});

JobSchema.static.states = states;

JobSchema.methods.error = function (err) {
    console.error('job error : ', err);
    this.state = states.ERROR.label;
    this.markOnPlanning(function (err, res) {
        if (err) {
            console.error(err);
            return;
        }
        console.log('done marking on planning');
    });
    this.err = err;
    this.save();
};

JobSchema.methods.markOnPlanning = function (done) {
    if (this.state === states.ALL_DONE.label) {
        return sheetProcessor.markAsReady(this, done);
    }
    if (this.state === states.ERROR.label) {
        return sheetProcessor.markAsError(this, done);
    }
    if (this.state === states.PUBLIC.label) {
        return sheetProcessor.markAsPublic(this, done);
    }
    if (this.state !== states.ALL_DONE.label && this.state !== states.ERROR.label && this.state !== states.PUBLIC.label) {
        return sheetProcessor.markAsProcessing(this, done);
    }
};

JobSchema.methods.next = function (done) {
    var next = states[this.state].next();
    if (next) {
        console.log('moving job', this._id, 'from state', this.state, 'to', next.label);
        this.state = next.label;
        if (this.state === states.READY.label) {
            this.markOnPlanning(function (err, res) {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log('done marking on planning');
            });
        }
        if (next.label === states.ALL_DONE.label) {
            this.markOnPlanning(function (err, res) {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log('done marking on planning');
            });
        }
    }

    this.save(done);
};

module.exports = mongoose.model('Job', JobSchema);