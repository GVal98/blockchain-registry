const express = require('express');

module.exports = class Server {
  constructor() {
    this.server = express();
    this.server.get('/', (request, response) => {
      response.send('Hello World!');
    });
  }

  start() {
    return new Promise((resolve) => {
      this.server
        .listen(process.env.PORT)
        .on('listening', resolve);
    });
  }
};
