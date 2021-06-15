import {Model} from "src/models/common/Model";

export class GoogleClientConfig extends Model {
  static model = "GoogleClientConfig";
}

export class GoogleToken extends Model {
  static model = "GoogleToken";

  static requestToken(config) {
    return this.api().invoke('google.auth', config);
  }
}

export class YoutubeChannel extends Model {
  static model = "YoutubeChannel";

  static paginateChannels(options) {
    return this.api().invoke('youtube.paginateChannels', options);
  }
}

export class GoogleCookieConfig extends Model {
  static model = "GoogleCookieConfig";

  static authOnStudio(channel) {
    return this.api().invoke('youtube.authOnYoutubeStudio', channel);
  }
}
