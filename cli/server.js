const express = require('express');
const cors = require('cors');

exports.Server = class Server {
  constructor(blockchainHandler, connectionHandler) {
    this.blockchainHandler = blockchainHandler;
    this.connectionHandler = connectionHandler;
    this.setIP();
    this.setPort();
    this.server = express();
    this.server.use(express.json());
    this.server.use(cors());
    this.addRoutes();
    this.addWeb();
  }

  start() {
    return new Promise((resolve) => {
      this.server
        .listen(this.port)
        .on('listening', resolve);
    });
  }

  addWeb() {
    this.server.use(express.static(__dirname + '/web/'));
    this.server.get('/web', (request, response) => response.sendFile(__dirname + '/web/index.html'));
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
    this.addRoute('/getBlock', (json) => this.getBlock(json));
    this.addRoute('/sendTransaction', (json) => this.connectionHandler.getNewTransaction(json));
    this.addRoute('/getPendingTransactions', () => this.getPendingTransactions());
    this.addRoute('/search', (json) => this.search(json));
  }

  getBlocks(json) {
    return this.blockchainHandler.getBlocks(json.startBlock, json.endBlock);
  }

  search(json) {
    return { transactions: this.blockchainHandler.search(...Object.values(json)) };
  }

  getBlock(json) {
    return this.blockchainHandler.getBlock(json.blockHeight);
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
