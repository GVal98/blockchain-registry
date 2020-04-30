const express = require('express');

exports.Server = class Server {
  constructor(blockchainHandler, connectionHandler) {
    this.blockchainHandler = blockchainHandler;
    this.connectionHandler = connectionHandler;
    this.setPort();
    this.server = express();
    this.addRoutes();
  }

  start() {
    return new Promise((resolve) => {
      this.server
        .listen(this.port)
        .on('listening', resolve);
    });
  }

  addRoute(route, func) {
    this.server.get(route, (request, response) => response.send({ result: func }));
  }

  addRoutes() {
    this.addRoute('/getHeight', this.blockchainHandler.getHeight());
    this.addRoute('/getNodes', this.connectionHandler.getNodes());
  }

  setPort() {
    [, , this.port] = process.argv;
  }
};
