const { app, BrowserWindow } = require('electron');
exports.ElectronApp = class ElectronApp {
  createWindow () {
    this.window = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true
      }
    });
    this.window.loadFile('./gui/index.html');
    this.window.webContents.openDevTools();
  }
  
  getApp() {
    return app;
  }

  updateAvailableNodes(availableNodes) {
    this.window.webContents.send('newAvailableNodes', availableNodes);
  }

  run() {
    app.allowRendererProcessReuse = true;
    app.whenReady().then(this.createWindow.bind(this));
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })
    
    app.on('activate', () => {
     if (BrowserWindow.getAllWindows().length === 0) {
       createWindow()
     }
   })
  }
}