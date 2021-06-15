import {connect, mongoose} from '../../db';
import '../../model';
import {ipcMain} from "electron";

export async function setup() {
  return connect();
}

ipcMain.handle('model.paginate', async (event, {modelName, filter, offset, limit, sort, projection, options}) => {
  const Model = mongoose.model(modelName);

  const total = await Model.countDocuments(filter);
  const rows = await Model.find(filter, projection, options).skip(offset).limit(limit).sort(sort).exec()
    .then(logs => logs.map(log => log.toJSON({_id: false, virtuals: true, getters: true})));

  return {rows, total};
});

ipcMain.handle('model.find', async (event, {modelName, filter, sort, projection = {}, options = {}}) => {
  return mongoose.model(modelName).find(filter, projection, options).sort(sort).exec()
    .then(rows => rows.map(row => row.toJSON({virtuals: true, getters: true})));
});

ipcMain.handle('model.countDocuments', async (event, {modelName, filter}) => {
  return mongoose.model(modelName).countDocuments(filter);
});

ipcMain.handle('model.findById', async (event, {modelName, id, projection, options}) => {
  return mongoose.model(modelName)
    .findById(id, projection, options)
    .then(res => res ? res.toJSON({
      virtuals: true,
      getters: true
    }) : null);
});

ipcMain.handle('model.findOne', async (event, {modelName, filter, projection, options}) => {
  return mongoose.model(modelName)
    .findOne(filter, projection, options)
    .then(res => res ? res.toJSON() : null);
});

ipcMain.handle('model.callMethod', async (event, {modelName, id, methodName, args}) => {
  console.log('calling method', methodName, 'on model', modelName, 'for id', id, 'with args', args);
  return mongoose.model(modelName)
    .findById(id)
    .then(res => {
      if (!res) return null;
      if (!res[methodName]) return null;

      return res[methodName](...args).then(result => result && result.toJSON ? result.toJSON() : result);
    });
});

ipcMain.handle('model.callStatic', async (event, {modelName, methodName, args}) => {
  console.log(modelName, methodName, args);
  return mongoose.model(modelName)[methodName](...args).then(res => res && res.toJSON ? res.toJSON({
    virtuals: true,
    getters: true
  }) : res);
});
