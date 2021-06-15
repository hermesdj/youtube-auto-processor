import {app, BrowserWindow, Menu, nativeTheme, Tray} from 'electron'
import {setup} from '../utils/db'
import '../utils/images'
import '../utils/google-auth'
import '../utils/processing'
import fs from "fs";
import path from "path";
import mkdirp from "mkdirp";
import {startIpcServer, stopIpcServer} from "app/src-electron/ipc-service";
import {startFileWatcher, stopFileWatcher} from "app/src-electron/file-watcher-service";
import {startJobRunnerInterval, stopJobRunnerInterval} from "app/src-electron/job-runner-service";

try {
  if (process.platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    fs.unlinkSync(path.join(app.getPath('userData'), 'DevTools Extensions'))
  }
} catch (_) {
}

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = __dirname
}

export async function quitApp() {
  stopJobRunnerInterval();
  await stopFileWatcher();
  stopIpcServer();
  if (mainWindow) {
    mainWindow.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
}

let mainWindow = null;
let tray;
let ipcServer;

async function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    useContentSize: true,
    frame: false,
    webPreferences: {
      nodeIntegration: process.env.QUASAR_NODE_INTEGRATION,
      nodeIntegrationInWorker: process.env.QUASAR_NODE_INTEGRATION,
    }
  });

  mainWindow.maximize();

  mainWindow.loadURL(process.env.APP_URL)

  mainWindow.on('closed', () => {
    mainWindow = null
  });
}


app.on('ready', async () => {
  tray = new Tray(path.resolve(path.join(__dirname, '../icons/icon.ico')));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Close',
      click: async () => {
        console.log('close app');
        await quitApp();
      }
    }
  ]);

  tray.setToolTip("Jay's Channel Manager");
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    console.log('double click !');
    if (mainWindow === null) {
      createWindow();
    }
  });

  ipcServer = startIpcServer();

  ipcServer.on('db.event', (data, socket) => {
    if (mainWindow) {
      mainWindow.webContents.send('db.event', data);
    }
  });

  let appPath = path.resolve(path.join(app.getPath('userData'), 'YoutubeChannelManager'));

  let db = await setup();
  let Config = db.model('Config');
  let config = await Config.loadAsObject();

  if (!config.mainAppDirectory) {
    await Config.create({
      key: 'mainAppDirectory',
      value: appPath
    });

    if (!fs.existsSync(appPath)) {
      await mkdirp(appPath);
    }
  } else {
    appPath = config.mainAppDirectory;
  }

  if (!config.jobRunnerExecTime) {
    await Config.create({
      key: 'jobRunnerExecTime',
      value: 10
    });

    config.jobRunnerExecTime = 10;
  }

  await startFileWatcher(app, appPath, db);
  await startJobRunnerInterval(db, config.jobRunnerExecTime);

  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', function () {
  if (tray) {
    tray.destroy();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
})
