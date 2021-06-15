import {Model} from "src/models/common/Model";

export class Service extends Model {
  static model = "Service";

  async start() {
    return this.constructor.api().send('service.start', this);
  }

  async stop() {
    return this.constructor.api().send('service.stop', this);
  }
}
