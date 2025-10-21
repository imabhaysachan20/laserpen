import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let win;

// Create window
function createWindow() {
  win = new BrowserWindow({
    fullscreen: true,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    focusable: false,
    backgroundColor: '#00000000', // full transparency
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'), // Load preload script
    },
  });

  // Start with click-through enabled (laser off by default)
  win.setIgnoreMouseEvents(true, { forward: true });

  // Load built Vite files
  win.loadFile(path.join(__dirname, '../dist/index.html'));
  
  // Optional: open dev tools for debugging
  // win.webContents.openDevTools();
  
  win.setAlwaysOnTop(true, 'screen-saver');

  // Safety check: see if rendering context works
  win.webContents.on('did-finish-load', () => {
    console.log('Electron: overlay loaded!');
  });
}

// Register global shortcuts
function registerShortcuts() {
  // Ctrl+Shift+D: Toggle drawing mode
  globalShortcut.register('CommandOrControl+Shift+D', () => {
    if (win) {
      win.webContents.send('toggle-drawing');
    }
  });

  // Ctrl+Shift+C: Clear canvas
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    if (win) {
      win.webContents.send('clear-canvas');
    }
  });

  // Ctrl+B: Toggle UI visibility
  globalShortcut.register('CommandOrControl+B', () => {
    if (win) {
      win.webContents.send('toggle-ui');
    }
  });

  // Ctrl+Shift+Q: Quit app
  globalShortcut.register('CommandOrControl+Shift+Q', () => {
    app.quit();
  });

  console.log('Global shortcuts registered');
}

// Handle click-through toggle from renderer
ipcMain.on('set-click-through', (_event, shouldIgnore) => {
  if (win) {
    win.setIgnoreMouseEvents(shouldIgnore, { forward: true });
    console.log('Click-through:', shouldIgnore ? 'enabled' : 'disabled');
  }
});

app.whenReady().then(() => {
  createWindow();
  registerShortcuts();
});

// Unregister shortcuts when app quits
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
