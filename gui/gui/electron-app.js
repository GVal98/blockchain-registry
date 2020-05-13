const { app, BrowserWindow } = require('electron');
exports.ElectronApp = class ElectronApp {
  createWindow () {
    const window = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true
      }
    });
    window.loadFile('./gui/index.html');
    window.webContents.openDevTools();
  }
  
  getApp() {
    return app;
  }
  run() {
    app.allowRendererProcessReuse = true;
    app.whenReady().then(this.createWindow);
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