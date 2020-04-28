const { ConnectionHandler } = require('./connection-handler');
const { BlockchainHandler } = require('./blockchain-handler');
const { Server } = require('./server');
const { HTTPServer } = require('./http-server');

class App {
  async run() {
    this.connectionHandler = new ConnectionHandler();
    console.log('Connection handler started');

    this.blockchainHandler = new BlockchainHandler(this.connectionHandler);
    console.log('Blockchain handler started');

    this.server = new Server(this.blockchainHandler, this.connectionHandler);
    console.log('Server started');

    this.httpServer = new HTTPServer(this.server);
    await this.httpServer.start();
    console.log('HTTP server started');
  }
}

const app = new App();
app.run();
