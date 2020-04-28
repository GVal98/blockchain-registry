const express = require('express');

exports.HTTPServer = class HTTPServer {
  constructor(server) {
    this.server = server;
    this.setPort();
    this.httpServer = express();
    this.addRoutes();
  }

  start() {
    return new Promise((resolve) => {
      this.httpServer
        .listen(this.port)
        .on('listening', resolve);
    });
  }

  addRoute(route, func) {
    this.httpServer.get(route, (request, response) => response.send({ result: func }));
  }

  addRoutes() {
    this.addRoute('/getHeight', this.server.getHeight());
    this.addRoute('/getNodes', this.server.getNodes());
  }

  setPort() {
    [, , this.port] = process.argv;
  }
};
