const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loaded!');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Toggle drawing mode
  onToggleDrawing: (callback) => {
    const subscription = (_event) => callback();
    ipcRenderer.on('toggle-drawing', subscription);
    return () => ipcRenderer.removeListener('toggle-drawing', subscription);
  },

  // Clear canvas
  onClearCanvas: (callback) => {
    const subscription = (_event) => callback();
    ipcRenderer.on('clear-canvas', subscription);
    return () => ipcRenderer.removeListener('clear-canvas', subscription);
  },

  // Toggle UI visibility
  onToggleUI: (callback) => {
    const subscription = (_event) => callback();
    ipcRenderer.on('toggle-ui', subscription);
    return () => ipcRenderer.removeListener('toggle-ui', subscription);
  },

  // Notify main process about click-through state
  setClickThrough: (enabled) => {
    ipcRenderer.send('set-click-through', enabled);
  },

  // Quit app
  onQuit: (callback) => {
    const subscription = (_event) => callback();
    ipcRenderer.on('quit-app', subscription);
    return () => ipcRenderer.removeListener('quit-app', subscription);
  }
});
