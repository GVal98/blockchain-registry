const { Elliptic } = require('./elliptic');
const { TransactionHelper } = require('./transaction-helper');
const { BlockHelper } = require('./block-helper');
const { ConnectionHandler } = require('./connection-handler');
const { BlockchainHandler } = require('./blockchain-handler');
const { Server } = require('./server');

class App {
  async run() {
    this.elliptic = new Elliptic();
    this.transactionHelper = new TransactionHelper(this.elliptic);
    this.blockHelper = new BlockHelper(this.elliptic, this.transactionHelper);

    this.connectionHandler = new ConnectionHandler(this.transactionHelper);
    await this.connectionHandler.init();
    console.log('Connection handler started');

    this.blockchainHandler = new BlockchainHandler(
      this.connectionHandler,
      this.transactionHelper,
      this.blockHelper,
    );
    console.log('Blockchain handler started');

    this.Server = new Server(this.blockchainHandler, this.connectionHandler);
    await this.Server.start();
    console.log('Server started');
  }
}

const app = new App();
app.run();
