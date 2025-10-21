import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let win;

app.whenReady().then(() => {
  win = new BrowserWindow({
    fullscreen: true,
  frame: false,
  transparent: true,
  alwaysOnTop: true,
  hasShadow: false,
  resizable: false,
  focusable: false,
  backgroundColor: '#00000000', // 👈 full transparency
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
  },
  });

  // 👇 load built Vite files
  win.loadFile(path.join(__dirname, '../dist/index.html'));
  // optional: open dev tools for debugging
  // win.webContents.openDevTools();
  
  
    win.setAlwaysOnTop(true, 'screen-saver');

  // Safety check: see if rendering context works
  win.webContents.on('did-finish-load', () => {
    console.log('Electron: overlay loaded!');
  });
});
