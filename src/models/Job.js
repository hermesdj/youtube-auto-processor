import {Model} from "src/models/common/Model";

export class Job extends Model {
  static model = "Job";

  async pause() {
    return this.constructor.api().callMethod(this.id, 'pause', []);
  }

  async resume() {
    return this.constructor.api().callMethod(this.id, 'resume', []);
  }

  async changeState(newState) {
    return this.constructor.api().callMethod(this.id, 'goto', [newState]);
  }

  async retry() {
    return this.constructor.api().callMethod(this.id, 'retry', []);
  }
}
