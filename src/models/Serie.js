import {Model} from "src/models/common/Model";

export class Serie extends Model {
  static model = "Serie";

  get name() {
    return this.planning_name ? this.planning_name.replace('${episode_number}', '').replace('-', '').trim() : null;
  }

  addFile(path) {
    return this.constructor.api().callMethod(this.id, 'addRawVideoFromPath', [path]);
  }

  updateStatus(status){
    return this.constructor.updateStatus(this.id, status);
  }

  static updateStatus(id, status){
    return this.api().callMethod(id, 'updateStatus', [status]);
  }
}
