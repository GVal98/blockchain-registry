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
    this.server.post(route, (request, response) => Server.handleRequest(
      response,
      request,
      func,
    ));
  }

  static handleRequest(response, request, func) {
    response.send({ result: func(request.body) });
  }

  addRoutes() {
    this.addRoute('/getNodes', (json) => this.getNodes(json));
    this.addRoute('/getBlocks', (json) => this.getBlocks(json));
    this.addRoute('/sendTransaction', (json) => this.connectionHandler.getNewTransaction(json));
    this.addRoute('/getPendingTransactions', () => this.getPendingTransactions());
  }

  getBlocks(json) {
    return this.blockchainHandler.getBlocks(json.startBlock, json.endBlock);
  }

  getNodes(json) {
    return {
      height: this.blockchainHandler.getHeight(),
      pendingTransactions: this.connectionHandler.getPendingTransactions(),
      nodes: this.connectionHandler.getNodes(json),
    };
  }

  getPendingTransactions() {
    return {
      height: this.blockchainHandler.getHeight(),
      pendingTransactions: this.connectionHandler.getPendingTransactions(),
    };
  }

  setPort() {
    [, , , this.port] = process.argv;
  }

  setIP() {
    [, , this.ip] = process.argv;
  }
};
