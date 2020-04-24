require('dotenv').config();
const Server = require('./server');

class App {
  async run() {
    this.server = new Server();
    await this.server.start();
    console.log('Server started');
  }
}

const app = new App();
app.run();
