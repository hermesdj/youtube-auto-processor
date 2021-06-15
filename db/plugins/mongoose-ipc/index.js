const {createLogger} = require('../../../logger');
const logger = createLogger({label: 'mongoose-ipc'});

const ipc = require('node-ipc');

ipc.config.id = process.env.IPC_ID;
ipc.config.retry = 3;
ipc.config.maxRetries = 10;
ipc.config.logger = msg => {
};

const connectTo = "youtube-auto-processor-ipc";
let connectedTo = null;
ipc.connectTo(connectTo, function () {
  connectedTo = ipc.of[connectTo];
});

module.exports = function mongooseIpcPlugin(schema) {
  async function emitMessage(collection, modelName, doc, eventType) {
    let data = {
      collection,
      modelName,
      data: doc.formatIpcData ? await doc.formatIpcData() : doc.toJSON({virtuals: true, getters: true}),
      eventType,
      pid: process.pid
    };

    if (connectedTo && connectedTo.emit) {
      connectedTo.emit('db.event', data);
    } else {
      logger.warn('Connect to is null');
    }
  }

  schema.pre('save', async function () {
    if (this.isNew) {
      await emitMessage(this.constructor.collection.name, this.constructor.modelName, this, 'CREATE');
    }
  });

  schema.post('save', async function (doc, next) {
    await emitMessage(doc.constructor.collection.name, doc.constructor.modelName, doc, 'UPDATE');
    next();
  });

  schema.post('remove', async function (doc, next) {
    await emitMessage(doc.constructor.collection.name, doc.constructor.modelName, doc, 'REMOVE');
    next();
  });
}
