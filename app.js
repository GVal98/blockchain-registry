require('dotenv').config();
const { HTTPServer } = require('./http-server');

class App {
  async run() {
    this.httpServer = new HTTPServer();
    await this.httpServer.start();
    console.log('Server started');
  }
}

const app = new App();
app.run();
