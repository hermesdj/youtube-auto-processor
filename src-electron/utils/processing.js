import {ipcMain} from "electron";
import videoProcessor from "../../processors/video-processor";

ipcMain.handle('processing.availableCodecs', async () => {
  return videoProcessor.getAvailableCodecs();
});

ipcMain.handle('processing.availableFilters', async () => {
  return videoProcessor.getAvailableFilters();
});

ipcMain.handle('processing.availableEncoders', async () => {
  return videoProcessor.getAvailableEncoders();
});

ipcMain.handle('processing.availableFormats', async () => {
  return videoProcessor.getAvailableFormats();
});
