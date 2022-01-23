const mongoose = require('mongoose');
const {Schema} = mongoose;
const fs = require('fs');
const {google} = require('googleapis');
const {OAuth2} = google.auth;
const {createLogger} = require('../logger');
const logger = createLogger({label: 'model-google'});

const GoogleClientConfigSchema = new Schema(
  {
    client_id: {
      type: String,
      required: true
    },
    project_id: {
      type: String,
      required: true
    },
    auth_uri: {
      type: String,
      required: true
    },
    token_uri: {
      type: String,
      required: true
    },
    auth_provider_x509_cert_url: {
      type: String,
      required: true
    },
    client_secret: {
      type: String,
      required: true
    },
    redirect_uris: [
      {type: String}
    ]
  },
  {
    timestamps: true,
    toJSON: {virtuals: true, getters: true},
    toObject: {virtuals: true, getters: true}
  }
);

GoogleClientConfigSchema.virtual('token', {
  ref: 'GoogleToken',
  localField: '_id',
  foreignField: 'config',
  justOne: true
});

GoogleClientConfigSchema.statics.createFromJson = async function (jsonData) {
  return this.findOne({client_id: jsonData.installed.client_id})
    .then(async config => {
      if (!config) {
        config = await this.create(jsonData.installed);
      }

      return config;
    });
}

GoogleClientConfigSchema.statics.createFromFilePath = async function (p) {
  if (!fs.existsSync(p)) {
    throw new Error('File Not Found');
  }

  return new Promise((resolve, reject) => {
    fs.readFile(p, async (err, content) => {
      if (err) return reject(err);

      try {
        let jsonData = JSON.parse(content);

        let clientConfig = await this.createFromJson(jsonData);

        resolve(clientConfig);
      } catch (err) {
        reject(err);
      }
    })
  });
}

const GoogleTokenSchema = new Schema(
  {
    config: {
      type: Schema.Types.ObjectId,
      ref: 'GoogleClientConfig',
      required: true,
      unique: true
    },
    tokens: {
      access_token: {
        type: String,
        required: true
      },
      refresh_token: {
        type: String,
        required: true
      },
      scope: {
        type: String,
        required: true
      },
      token_type: {
        type: String,
        required: true
      },
      expiry_date: {
        type: Date,
        required: true
      }
    }
  },
  {
    timestamps: true,
    toJSON: {virtuals: true, getters: true},
    toObject: {virtuals: true, getters: true}
  }
);

GoogleTokenSchema.statics.storeToken = async function (configId, tokens) {
  return this.findOne({config: configId})
    .then(token => {
      if (!token) {
        token = new this({config: configId, tokens: {}});
      }

      token.tokens = tokens;

      return token.save();
    })
}

GoogleTokenSchema.statics.resolveOAuth2Client = async function (configId) {
  let config;

  if (!configId) {
    config = await this.model('GoogleClientConfig').findOne({});
  } else {
    config = await this.model('GoogleClientConfig').findById(configId);
  }

  if (!config) {
    throw new Error('No Google Client Config found.');
  }

  let token = await this.findOne({config: config._id});

  if (!token) {
    throw new Error('No Google token found');
  }

  const oauth2client = new OAuth2(config.client_id, config.client_secret, config.redirect_uris[0]);
  oauth2client.setCredentials(token.tokens);

  oauth2client.on('tokens', async (tokens) => {
    token.tokens.access_token = tokens.access_token;

    if (tokens.expiry_date) {
      token.tokens.expiry_date = tokens.expiry_date;
    }

    if (tokens.refresh_token) {
      token.tokens.refresh_token = tokens.refresh_token;
    }

    if (tokens.scope) {
      token.tokens.scope = tokens.scope;
    }

    if (tokens.token_type) {
      token.tokens.token_type = tokens.token_type;
    }

    token.markModified('tokens');
    await token.save();
  });

  return oauth2client;
};

const GoogleCookieConfigSchema = new Schema(
  {
    SID: {
      type: String,
      required: true
    },
    HSID: {
      type: String,
      required: true
    },
    SSID: {
      type: String,
      required: true
    },
    APISID: {
      type: String,
      required: true
    },
    SAPISID: {
      type: String,
      required: true
    },
    LOGIN_INFO: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {virtuals: true, getters: true},
    toObject: {virtuals: true, getters: true}
  }
);

GoogleCookieConfigSchema.statics.resolveConfig = async function () {
  return this.findOne({}).then(res => {
    if (!res) throw new Error('No Cookie Config found');
    return res;
  });
}

const cookieNames = ['SID', 'HSID', 'SSID', 'APISID', 'SAPISID', 'LOGIN_INFO'];

GoogleCookieConfigSchema.methods.toPuppeteerCookies = function () {
  let obj = this.toJSON();
  return Object.keys(obj).filter(name => cookieNames.includes(name) && !!obj[name]).map(name => ({
    name,
    value: obj[name],
    domain: '.youtube.com'
  }));
}

GoogleCookieConfigSchema.methods.updateFromPageCookies = async function (pageCookies) {
  for (let {name, value} of pageCookies) {
    if (cookieNames.includes(name)) {
      logger.debug('set cookie %s with value %s', name, value);
      this.set(name, value);
    }
  }

  if (this.isModified) {
    await this.save();
  }
  return this;
}

const YoutubeChannelSchema = new Schema(
  {
    channelId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: null
    },
    customUrl: {
      type: String,
      default: null
    },
    publishedAt: {
      type: Date,
      default: null
    },
    defaultLanguage: {
      type: String,
      default: 'fr'
    },
    country: {
      type: String,
      default: null
    },
    thumbnails: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
    toJSON: {virtuals: true, getters: true},
    toObject: {virtuals: true, getters: true}
  }
);

YoutubeChannelSchema.statics.createFromYoutubeData = async function (channelData) {
  return this.findOne({channelId: channelData.id})
    .then(channel => {
      if (!channel) {
        channel = new this({
          channelId: channelData.id,
          ...channelData.snippet
        });
      }

      channel.set(channelData.snippet);

      return channel.save();
    })
}


module.exports = {
  GoogleToken: mongoose.model('GoogleToken', GoogleTokenSchema),
  GoogleClientConfig: mongoose.model('GoogleClientConfig', GoogleClientConfigSchema),
  GoogleCookieConfig: mongoose.model('GoogleCookieConfig', GoogleCookieConfigSchema),
  YoutubeChannel: mongoose.model('YoutubeChannel', YoutubeChannelSchema)
};
