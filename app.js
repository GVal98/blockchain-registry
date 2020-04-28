const { HTTPServer } = require('./http-server');
const { ConnectionHandler } = require('./connection-handler');

class App {
  async run() {
    this.connectionHandler = new ConnectionHandler();
    console.log('Client started');
    this.httpServer = new HTTPServer();
    await this.httpServer.start();
    console.log('Server started');
  }
}

const app = new App();
app.run();
