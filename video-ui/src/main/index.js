import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'

import { join } from 'node:path'
import * as path from 'node:path'
import * as fs from 'node:fs/promises';
import { createWriteStream } from 'fs';

// Include fs and path module 
// const fs = require('fs');
// const path = require('path');

import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }


    ipcMain.handle("choose-directory", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory", "createDirectory"]
    });
    return result.canceled ? null : result.filePaths[0];
  });

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))


  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.handle("save-file", async (_event, { directory, filename, data }) => {
  if (!directory || !filename || !data) throw new Error("Invalid save request");
  
  await fs.mkdir(directory, { recursive: true });

  const safeName = path.basename(filename);
  const target = path.join(directory, safeName);
  
  await fs.writeFile(target, Buffer.from(data));

  return target;
});

function parseCSV(csv, delimiter = null) {
  if (!csv || !csv.trim()) {
    return [];
  }

  console.log("Parsing CSV with delimiter:", delimiter);

  const lines = csv.trim().split(/\r?\n/);

  // Automatically detect delimiter if not provided
  if (!delimiter) {
    const possibleDelimiters = [';', ',', '\t', '|'];

    delimiter = possibleDelimiters.reduce((best, current) => {
      const bestCount = lines[0].split(best).length;
      const currentCount = lines[0].split(current).length;

      return currentCount > bestCount ? current : best;
    }, possibleDelimiters[0]);
  }

  const headers = lines[0]
    .split(delimiter)
    .map(header => header.trim());

  return lines.slice(1).map(line => {
    const values = line
      .split(delimiter)
      .map(value => value.trim());

    return Object.fromEntries(
      headers.map((header, index) => [
        header,
        values[index] ?? ''
      ])
    );
  });
}


ipcMain.handle('open-csv', async (delimeter) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'CSV Files', extensions: ['csv'] }
    ]
  });

  if (result.canceled) {
    return null;
  }

  const filePath = result.filePaths[0];
  const content = await fs.readFile(filePath, 'utf8');
  const data = parseCSV(content, delimeter);

  return {
    filePath,
    data
  };
});


// https://www.w3schools.com/nodejs/ref_writestream.asp

//[ ] FIXME: This is a naive example for a single stream case
// a second video start might overwrite the existing stream if not handled properly
// example: use a jobID to track multiple concurrent recordings with a list (dict, or map) of streams
// let stream;
const streamJobs = new Map();

function writeChunk(stream, buffer) {
    return new Promise((resolve, reject) => {
        stream.write(buffer, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function finishStream(stream) {
    return new Promise((resolve, reject) => {
        stream.end((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

ipcMain.handle("video:start", async (_event, {directory, filename}) => {
    if (!directory || !filename) throw new Error("Invalid save request");
    
    await fs.mkdir(directory, { recursive: true });

    const safeName = path.basename(filename);
    const filepath = path.join(directory, safeName);
    
    // [ ] FIXME: create a new Job and add the stream to it, return the JobID
    const stream = createWriteStream(filepath);
    
    
    stream.on("error", (err) => {
      console.error("Video stream error:", err);
    });
    

    const jobID = crypto.randomUUID();

    streamJobs.set(jobID, {
        stream,
        filePath: filepath
    });

    return { filepath, jobID };
});

ipcMain.handle("video:write", async (_event, { jobID, buffer }) => {
  // if (!stream) return;
  const job = streamJobs.get(jobID);
    if (!job) {
        throw new Error("No active recording for this JobID");
    }
    //stream.write(Buffer.from(buffer));
    await writeChunk(job.stream, Buffer.from(buffer));
});

ipcMain.handle("video:stop", async ( _event, {jobID} ) => {
   // if (!stream) return;
    const job = streamJobs.get(jobID);
    if (!job) {
        throw new Error("No active recording for this JobID");
    }

    await finishStream(job.stream);
    streamJobs.delete(jobID);
});



