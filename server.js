const express = require('express');

exports.Server = class Server {
  constructor(blockchainHandler, connectionHandler) {
    this.blockchainHandler = blockchainHandler;
    this.connectionHandler = connectionHandler;
    this.setIP();
    this.setPort();
    this.server = express();
    this.server.use(express.json());
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
    this.server.post(route, (request, response) => this.handleRequest(
      response,
      request,
      func,
    ));
  }

  handleRequest(response, request, func) {
    response.send(this.formFullResponse(func, request.body));
  }

  formFullResponse(func, json) {
    return { nodeIP: this.ip, nodePort: this.port, result: func(json) };
  }

  addRoutes() {
    this.addRoute('/getHeight', () => this.blockchainHandler.getHeight());
    this.addRoute('/getNodes', (json) => this.connectionHandler.getNodes(json));
  }

  setPort() {
    [, , , this.port] = process.argv;
  }

  setIP() {
    [, , this.ip] = process.argv;
  }
};
