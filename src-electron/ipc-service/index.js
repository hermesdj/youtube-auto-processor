import ipc from 'node-ipc';
import {createLogger} from 'app/logger';

const logger = createLogger({label: 'ipc-server'});

let mainWindow = null;

ipc.config.id = "youtube-auto-processor-ipc";
ipc.config.retry = 1500;
ipc.config.logger = msg => {
};
ipc.serve();

ipc.server.on('start', () => {
  logger.info('IPC Server started');
});

ipc.server.on('connect', () => {
  logger.info('IPC Server socket connected');
});

ipc.server.on('socket.disconnected', (socket, socketId) => {
  logger.info('IPC Server socket disconnected : %O', socketId);
});

export function startIpcServer(window) {
  mainWindow = window;
  ipc.server.start();

  return ipc.server;
}

export function stopIpcServer() {
  ipc.server.stop();
}
