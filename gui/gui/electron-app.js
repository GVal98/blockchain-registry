const { app, BrowserWindow, screen} = require('electron');
exports.ElectronApp = class ElectronApp {
  createWindow () {
    this.window = new BrowserWindow({
      show: false,
      width: screen.getPrimaryDisplay().workAreaSize.width,
      height: screen.getPrimaryDisplay().workAreaSize.height,
      webPreferences: {
        nodeIntegration: true
      }
    });
    this.window.maximize();
    this.window.loadFile('./gui/index.html');
    this.window.webContents.openDevTools();
    this.window.show();
  }
  
  getApp() {
    return app;
  }

  updateAvailableNodes(availableNodes) {
    this.window.webContents.send('newAvailableNodes', availableNodes);
  }
  
  updateChain(chain) {
    this.window.webContents.send('newBlock', chain);
  }

  updatePendingTransactions(pendingTransactions) {
    this.window.webContents.send('newPendingTransactions', pendingTransactions);
  }

  async run() {
    app.allowRendererProcessReuse = true;
    await app.whenReady();
    this.createWindow();
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
    return Promise.resolve();
  }
}