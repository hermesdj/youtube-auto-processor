import {BrowserWindow, ipcMain} from 'electron';
import {google} from 'googleapis';
import URL from 'url';
import {GoogleCookieConfig, GoogleToken} from "../../model/google.model";
import youtubeProcessor from "../../processors/youtube-processor";
import {set} from 'lodash';

const OAuth2 = google.auth.OAuth2;

const SCOPES = ['https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/spreadsheets'];

ipcMain.handle('google.auth', async (event, config) => {
  if (config && config.auth_uri && config.client_id && config.client_secret) {
    return new Promise(async (resolve, reject) => {
      try {
        let win = new BrowserWindow({
          useContentSize: true,
          center: true,
          alwaysOnTop: true,
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: false,
            enableRemoteModule: false
          }
        });

        const redirectUri = config.redirect_uris[1] + '/callback';
        const oauth2Client = new OAuth2(config.client_id, config.client_secret, redirectUri);

        const authUri = oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: SCOPES
        });

        console.log('opening auth uri', authUri);
        await win.loadURL(
          authUri,
          {userAgent: 'Chrome'}
        );

        const {session: {webRequest}} = win.webContents;

        const filter = {
          urls: [
            redirectUri + '*'
          ]
        };

        webRequest.onBeforeRequest(filter, async ({url}) => {
          try {
            const parsed = URL.parse(url, true).query;
            if (!parsed.code) {
              return reject(new Error('No code found in returned url'));
            }

            let {tokens} = await oauth2Client.getToken(parsed.code);

            let token = await GoogleToken.storeToken(config.id, tokens);

            resolve(token.toJSON());
          } catch (err) {
            reject(err);
          } finally {
            win.close();
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  } else {
    throw new Error('Invalid config provided');
  }
});

ipcMain.handle('youtube.authOnYoutubeStudio', async (event, channel) => {
  if (!channel) {
    throw new Error('No channel provided');
  }

  console.log('deleting existing cookie config');
  await GoogleCookieConfig.deleteMany({});

  return new Promise(async (resolve, reject) => {
    try {
      let win = new BrowserWindow({
        useContentSize: true,
        center: true,
        alwaysOnTop: true,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          enableRemoteModule: false
        }
      });

      let studioUri = `https://studio.youtube.com/channel/${channel.channelId}`;

      console.log('load studio uri', studioUri);

      await win.loadURL(
        studioUri,
        {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36'
        }
      );

      const {session: {webRequest}} = win.webContents;

      const filter = {
        urls: [
          'https://studio.youtube.com/*',
          'https://accounts.google.com/*'
        ]
      };

      const searchedCookieNames = ['SID', 'HSID', 'SSID', 'APISID', 'SAPISID', 'LOGIN_INFO'];

      webRequest.onBeforeRequest(filter, async ({url}) => {
        if (win) {
          let session = win.webContents.session;
          let cookies = await session.cookies.get({});
          console.log(cookies);

          let config = cookies.reduce((acc, c) => {
            if (!searchedCookieNames.includes(c.name)) return acc;
            return set(acc, c.name, c.value);
          }, {});

          if (Object.keys(config).length >= searchedCookieNames.length - 1) {
            console.log('cookie config is', config);
            win.close();
            win = null;

            let cookieConfig = await GoogleCookieConfig.create(config);

            resolve(cookieConfig.toJSON());
          }
        }
      });
    } catch (err) {
      console.error('error', err);
      reject(err);
    }
  });
});

ipcMain.handle('youtube.paginateChannels', async (event, {pageToken}) => {
  return youtubeProcessor.getChannelList({pageToken});
});

ipcMain.handle('youtube.saveChannel', async (event, {channel}) => {
  console.log(channel);
});
