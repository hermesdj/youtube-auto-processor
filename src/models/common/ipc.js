import {ipcRenderer} from 'electron';
import {Subject} from 'rxjs';

export const dbEvents = new Subject();

ipcRenderer.on('db.event', (event, data) => {
  console.log('db event emitted from services', data);
  dbEvents.next(data);
});

export function invoke(modelName, methodName, args) {
  return ipcRenderer.invoke(`model.${methodName}`, {modelName, ...args})
}

export class MongooseApiProxy {
  constructor(modelName, model) {
    this.modelName = modelName;
    this.model = model;
  }

  async paginate(args) {
    return invoke(this.modelName, 'paginate', args).then(({total, rows}) => ({
      total,
      rows: rows.map(row => new this.model(row))
    }));
  }

  async find(args) {
    return invoke(this.modelName, 'find', args).then(res => res.map(data => new this.model(data)));
  }

  async findById(id, projection, options) {
    return invoke(this.modelName, 'findById', {id, projection, options}).then(res => res ? new this.model(res) : null);
  }

  async findOne(filter, projection = {}, options = {}) {
    return invoke(this.modelName, 'findOne', {
      filter,
      projection,
      options
    }).then(res => res ? new this.model(res) : null);
  }

  async countDocuments(filter) {
    return invoke(this.modelName, 'countDocuments', {filter});
  }

  async send(event, data) {
    ipcRenderer.send(event, data);
  }

  async invoke(event, data) {
    return ipcRenderer.invoke(event, data);
  }

  async callMethod(id, methodName, args = []) {
    return invoke(this.modelName, 'callMethod', {id, methodName, args});
  }

  async callStatic(methodName, args = []) {
    return invoke(this.modelName, 'callStatic', {methodName, args});
  }
}
