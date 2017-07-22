/**
 * Created by Jérémy on 06/05/2017.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Serie = require('./serie.model');
const states = require('../config/states');
const sheetProcessor = require('../processors/sheet-processor');
const winston = require('winston');

let JobSchema = new Schema({
    path: String,
    date_created: {type: Date, default: null, unique: true, required: true, dropDubs: true},
    state: {type: String, default: states.READY.label},
    last_state: String,
    upload_data: Schema.Types.Mixed,
    process_data: Schema.Types.Mixed,
    processing: Schema.Types.Mixed,
    details: Schema.Types.Mixed,
    episode: {type: Schema.Types.ObjectId, ref: 'Episode'},
    err: Schema.Types.Mixed
});

JobSchema.static.states = states;

JobSchema.methods.error = function (err) {
    winston.error('job error : ', err);
    this.state = states.ERROR.label;
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
        winston.info('moving job', this._id, 'from state', this.state, 'to', next.label);
        this.last_state = this.state;
        this.state = next.label;
        if (this.state === states.INITIALIZED.label || next.label === states.ALL_DONE.label) {
            this.markOnPlanning(function (err, res) {
                if (err) {
                    winston.error(err);
                    return;
                }
                winston.info('done marking on planning');
            });
        }
    }

    this.save(done);
};

JobSchema.methods.pause = function (next) {
    this.last_state = this.state;
    this.state = states.PAUSED.label;

    this.save(next);
};

JobSchema.methods.resume = function (next) {
    this.state = this.last_state;
    this.last_state = states.PAUSED.label;

    this.save(next);
};

JobSchema.methods.goto = function (state, next) {
    this.last_state = this.state;
    this.state = state;

    this.save(next);
};

module.exports = mongoose.model('Job', JobSchema);