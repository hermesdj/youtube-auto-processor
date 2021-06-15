/**
 * Created by Jérémy on 06/05/2017.
 */
const mongoose = require('mongoose');
const {Schema} = mongoose;
const states = require('../config/states');
const {createLogger} = require('../logger');
const logger = createLogger({label: 'job-model'});

class JobError extends Error {
  constructor(message, data) {
    super(message);
    this.data = data;
  }
}

let JobSchema = new Schema(
  {
    path: {
      type: String,
      required: true,
      index: true
    },
    date_created: {
      type: Date,
      default: null,
      unique: true,
      required: true,
      dropDubs: true,
      index: true
    },
    state: {
      type: String,
      default: states.READY.label,
      index: true
    },
    last_state: {
      type: String,
      default: null
    },
    upload_data: Schema.Types.Mixed,
    process_data: Schema.Types.Mixed,
    processing: Schema.Types.Mixed,
    upload_status: Schema.Types.Mixed,
    details: Schema.Types.Mixed,
    episode: {
      type: Schema.Types.ObjectId,
      ref: 'Episode',
      index: true
    },
    serie: {
      type: Schema.Types.ObjectId,
      ref: 'Serie',
      index: true
    },
    err: Schema.Types.Mixed,
    message: {type: String},
    lastProcessFetchDate: {
      type: Date,
      default: null,
      index: true
    },
    currentPlanningState: {
      type: String,
      enum: ['processing', 'error', 'done', 'public', 'unknown'],
      default: 'unknown',
      index: true
    }
  }, {
    timestamps: true,
    toJSON: {virtuals: true, getters: true},
    toObject: {virtuals: true, getters: true}
  }
);

JobSchema.virtual('title')
  .get(function () {
    return this.episode ? this.episode.video_name : this.path;
  });

JobSchema.plugin(require('../db/plugins/mongoose-ipc'), {
  ipcId: process.env.IPC_ID
});

JobSchema.static.states = states;

JobSchema.methods.error = async function (err) {
  if ((!err instanceof JobError)) {
    err = new JobError(err.message || err, err);
  }
  logger.error('job error : %s', err.message);
  if (this.state !== 'ERROR') {
    this.last_state = this.state;
    this.state = states.ERROR.label;
  }
  this.err = err;
  return this.save();
};

JobSchema.methods.markOnPlanning = async function () {
  const appConfig = await this.model('Config').loadAsObject();
  const sheetProcessor = require('../processors/sheet-processor');

  if (this.state === states.ALL_DONE.label) {
    return sheetProcessor.markAsReady(this, appConfig);
  } else if (this.state === states.ERROR.label) {
    return sheetProcessor.markAsError(this, appConfig);
  } else if (this.state === states.PUBLIC.label) {
    return sheetProcessor.markAsPublic(this, appConfig);
  } else if (this.state !== states.ALL_DONE.label && this.state !== states.ERROR.label && this.state !== states.PUBLIC.label) {
    return sheetProcessor.markAsProcessing(this, appConfig);
  } else {
    return Promise.resolve();
  }
};

JobSchema.methods.next = async function (done) {
  const next = states[this.state].next();

  if (next) {
    logger.info('moving job %s from state %s to %s', this.id, this.state, next.label);
    this.last_state = this.state;
    this.state = next.label;

    if (this.state === states.VIDEO_READY.label || next.label === states.ALL_DONE.label) {
      try {
        await this.markOnPlanning();
        logger.info('done marking on planning');
      } catch (err) {
        return this.error(err);
      }
    }
  } else {
    logger.warn('No next state found for state %s', this.state);
  }

  return this.save().then((job) => {
    if (done) done(null, job);
    return job;
  }).catch(err => {
    if (done) done(err);
    return Promise.reject(err);
  });
};

JobSchema.methods.pause = async function () {
  this.last_state = this.state;
  this.state = states.PAUSED.label;

  return this.save();
};

JobSchema.methods.resume = function () {
  this.state = this.last_state;
  this.last_state = states.PAUSED.label;

  return this.save();
};

JobSchema.methods.goto = function (state) {
  this.last_state = this.state;
  this.state = state;

  return this.save();
};

JobSchema.methods.retry = function () {
  if (this.state !== 'ERROR') {
    throw new Error('Can only retry from ERROR state');
  }

  this.state = this.last_state;

  return this.save();
}

JobSchema.methods.formatIpcData = async function () {
  if (!this.populated('episode')) await this.populate({path: 'episode', populate: 'serie'}).execPopulate();
  if (this.episode && !this.episode.populated('serie')) await this.episode.populate('serie').execPopulate();

  if (this.episode && this.episode.serie) {
    this.serie = this.episode.serie;
  }

  return this.toJSON({virtuals: true, getters: true});
};

module.exports = mongoose.model('Job', JobSchema);
