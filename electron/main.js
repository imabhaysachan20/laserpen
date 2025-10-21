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
  
  
  
  win.setAlwaysOnTop(true, 'screen-saver');

  // Safety check: see if rendering context works
  win.webContents.on('did-finish-load', () => {
    console.log('Electron: overlay loaded!');
  });
}

// Register global shortcuts
function registerShortcuts() {
  // Ctrl+Shift+D: Toggle drawing mode
  const toggleRegistered = globalShortcut.register('CommandOrControl+Shift+D', () => {
    console.log('Toggle shortcut pressed');
    if (win) {
      win.webContents.send('toggle-drawing');
      console.log('Sent toggle-drawing message');
    }
  });
  console.log('Ctrl+Shift+D registered:', toggleRegistered);

  // Ctrl+Shift+C: Clear canvas
  const clearRegistered = globalShortcut.register('CommandOrControl+Shift+C', () => {
    console.log('Clear shortcut pressed');
    if (win) {
      win.webContents.send('clear-canvas');
      console.log('Sent clear-canvas message');
    }
  });
  console.log('Ctrl+Shift+C registered:', clearRegistered);

  // Ctrl+B: Toggle UI visibility
  const uiRegistered = globalShortcut.register('CommandOrControl+B', () => {
    console.log('Toggle UI shortcut pressed');
    if (win) {
      win.webContents.send('toggle-ui');
      console.log('Sent toggle-ui message');
    }
  });
  console.log('Ctrl+B registered:', uiRegistered);

  // Ctrl+Shift+Q: Quit app
  const quitRegistered = globalShortcut.register('CommandOrControl+Shift+Q', () => {
    console.log('Quit shortcut pressed');
    app.quit();
  });
  console.log('Ctrl+Shift+Q registered:', quitRegistered);

  console.log('All shortcuts registered');
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
