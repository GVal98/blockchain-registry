const express = require('express');
const { Server } = require('./server');

exports.HTTPServer = class HTTPServer {
  constructor() {
    this.setPort();
    this.httpServer = express();
    this.addRoute('/', Server.status());
  }

  start() {
    return new Promise((resolve) => {
      this.httpServer
        .listen(this.port)
        .on('listening', resolve);
    });
  }

  addRoute(route, func) {
    this.httpServer.get(route, (request, response) => response.send(func));
  }

  setPort() {
    [, , this.port] = process.argv;
  }
};
