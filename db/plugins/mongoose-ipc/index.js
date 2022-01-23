const {emitMessage} = require('./io');

module.exports = function mongooseIpcPlugin(schema) {
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
