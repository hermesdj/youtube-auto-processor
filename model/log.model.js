/**
 * Created by jdallard on 30/05/2017.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let LogSchema = new Schema(
  {
    timestamp: Date,
    level: String,
    message: String,
    meta: Schema.Types.Mixed,
    label: String
  }, {
    collection: 'log'
  }
);

LogSchema.statics.listLabels = async function () {
  return this.distinct('label');
}

module.exports = mongoose.model('Log', LogSchema);
