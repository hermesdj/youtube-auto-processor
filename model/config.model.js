const mongoose = require('mongoose');
const {Schema} = mongoose;
const {set} = require('lodash');

const ConfigSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true
    },
    value: {
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

ConfigSchema.statics.saveConfig = async function (configs) {
  return this.bulkWrite(configs.map(config => ({
    updateOne: {
      filter: {
        key: config.key
      },
      update: {
        key: config.key,
        value: config.value
      },
      upsert: true
    }
  })));
}

ConfigSchema.statics.loadAsObject = async function () {
  return this.find({}).then(res => res.reduce((acc, config) => set(acc, config.key, config.value), {}));
}

module.exports = mongoose.model('Config', ConfigSchema);
