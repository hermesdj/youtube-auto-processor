/**
 * Created by jdallard on 09/05/2017.
 */
const mongoose = require('mongoose');
const {Schema} = mongoose;

let ServiceSchema = new Schema(
  {
    service_name: {
      type: String,
      required: true
    },
    service_description: {
      type: String,
      default: null
    },
    installed: {
      type: Boolean,
      default: false
    },
    started: {
      type: Boolean,
      default: false
    },
    path: {
      type: String,
      required: true
    },
    lastServiceError: {
      type: Schema.Types.Mixed,
      default: null
    },
    config: {
      type: Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {virtuals: true, getters: true},
    toObject: {virtuals: true, getters: true}
  }
);

ServiceSchema.plugin(require('../db/plugins/mongoose-ipc'), {
  ipcId: process.env.IPC_ID
});

ServiceSchema.statics.loadService = function (config) {
  return this.findOne({path: config.servicePath}).exec()
    .then(async service => {
      if (!service) {
        service = await this.createService(config);
      } else {
        if (!service.config) {
          await this.updateOne({_id: service._id}, {$set: {config}});
          service.config = config;
        }
      }

      return service;
    });
};

ServiceSchema.statics.createService = function (config) {
  return this.create({
    path: config.servicePath,
    service_name: config.service_name,
    service_description: config.service_description,
    started: false,
    installed: false,
    config
  });
}

module.exports = mongoose.model('Service', ServiceSchema);
