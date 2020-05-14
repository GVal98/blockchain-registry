const { Elliptic } = require('./elliptic');
const { TransactionHelper } = require('./transaction-helper');
const { BlockHelper } = require('./block-helper');
const { ConnectionHandler } = require('./connection-handler');
const { BlockchainHandler } = require('./blockchain-handler');
const { Server } = require('./server');
const { ElectronApp } = require('./gui/electron-app');

class App {
  async run() {

    const electronApp = new ElectronApp();
    await electronApp.run();
    console.log('Electron app started');
    this.electronApp = electronApp.getApp();
    this.appPath = this.electronApp.getAppPath();
    this.elliptic = new Elliptic();
    this.transactionHelper = new TransactionHelper(this.elliptic);
    this.blockHelper = new BlockHelper(this.elliptic, this.transactionHelper);

    this.connectionHandler = new ConnectionHandler(this.transactionHelper, `${this.appPath}/nodes.json`, electronApp);
    this.blockchainHandler = new BlockchainHandler(this.transactionHelper, this.blockHelper, `${this.appPath}/blockchain.json`, electronApp);

    this.connectionHandler.setBlockchainHandler(this.blockchainHandler);
    this.blockchainHandler.setConnectionHandler(this.connectionHandler);

    await this.connectionHandler.init();
    console.log('Connection handler started');

    this.blockchainHandler.init();
    console.log('Blockchain handler started');
/*
    this.Server = new Server(this.blockchainHandler, this.connectionHandler);
    await this.Server.start();
    console.log('Server started');*/
  }
}

const app = new App();
app.run();
