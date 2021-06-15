import {Platform} from 'quasar';
import {MongooseApiProxy} from "src/models/common/ipc";
import {Subject} from 'rxjs';

const ipcSubject = new Subject();

export class Model {
  constructor(data) {
    Object.assign(this, data);
  }

  static api() {
    if (Platform.is.electron) {
      return new MongooseApiProxy(this.model, this);
    }
  }

  static subscribe() {
    return ipcSubject.subscribe();
  }
}
