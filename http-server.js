const express = require('express');
const { Server } = require('./server');

exports.HTTPServer = class HTTPServer {
  constructor() {
    this.httpServer = express();
    this.addRoute('/', Server.status());
  }

  start() {
    return new Promise((resolve) => {
      this.httpServer
        .listen(process.env.PORT)
        .on('listening', resolve);
    });
  }

  addRoute(route, func) {
    this.httpServer.get(route, (request, response) => response.send(func));
  }
};
