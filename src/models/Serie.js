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
    return this.constructor.api().callMethod(this.id, 'updateStatus', [status]);
  }
}
