const { ConnectionHandler } = require('./connection-handler');
const { BlockchainHandler } = require('./blockchain-handler');
const { Server } = require('./server');

class App {
  async run() {
    this.connectionHandler = new ConnectionHandler();
    console.log('Connection handler started');

    this.blockchainHandler = new BlockchainHandler(this.connectionHandler);
    console.log('Blockchain handler started');

    this.Server = new Server(this.blockchainHandler, this.connectionHandler);
    await this.Server.start();
    console.log('server started');
  }
}

const app = new App();
app.run();
