const { Elliptic } = require('./elliptic');
const { TransactionHelper } = require('./transaction-helper');
const { BlockHelper } = require('./block-helper');
const { ConnectionHandler } = require('./connection-handler');
const { BlockchainHandler } = require('./blockchain-handler');
const { Server } = require('./server');
const { ElectronApp } = require('./gui/electron-app');
const { ipcMain } = require('electron');
const fs = require('fs');

class App {
  async run() {

    const electronApp = new ElectronApp();
    await electronApp.run();
    // console.log('Electron app started');
    this.electronApp = electronApp.getApp();
    this.appPath = this.electronApp.getAppPath();
    this.userPath = this.electronApp.getPath('userData');
    this.elliptic = new Elliptic();
    this.transactionHelper = new TransactionHelper(this.elliptic);
    this.blockHelper = new BlockHelper(this.elliptic, this.transactionHelper);

    this.defaultNodesPath = `${this.appPath}/nodes.json`;
    this.defaultBlockchainPath = `${this.appPath}/blockchain.json`;
    this.userNodesPath = `${this.userPath}/nodes.json`;
    this.userBlockchainPath = `${this.userPath}/blockchain.json`;

    if (!fs.existsSync(this.userNodesPath)) {
      fs.writeFileSync(this.userNodesPath, fs.readFileSync(this.defaultNodesPath));
      console.log(`${this.userNodesPath} created`);
    }
    if (!fs.existsSync(this.userBlockchainPath)) {
      fs.writeFileSync(this.userBlockchainPath, fs.readFileSync(this.defaultBlockchainPath));
      console.log(`${this.userBlockchainPath} created`);
    }
    
    this.connectionHandler = new ConnectionHandler(this.transactionHelper, this.userNodesPath, electronApp);
    this.blockchainHandler = new BlockchainHandler(this.transactionHelper, this.blockHelper, this.userBlockchainPath, electronApp);

    this.connectionHandler.setBlockchainHandler(this.blockchainHandler);
    this.blockchainHandler.setConnectionHandler(this.connectionHandler);

    await this.connectionHandler.init();
    // console.log('Connection handler started');

    this.blockchainHandler.init();
    // console.log('Blockchain handler started');
    ipcMain.on('startServer', async (event, ip, port) => {
      this.Server = new Server(this.blockchainHandler, this.connectionHandler, ip, port);
      await this.Server.start();
      event.reply('serverStarted');
    })
  }
}

const app = new App();
app.run();
