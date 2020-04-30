const fs = require('fs');
const needle = require('needle');

exports.ConnectionHandler = class ConnectionHandler {
  constructor() {
    this.setNodesFile();
    this.loadNodesFromFile();
  }

  setNodesFile() {
    [, , , this.nodesFile] = process.argv;
  }

  loadNodesFromFile() {
    this.nodes = JSON.parse(fs.readFileSync(this.nodesFile));
  }

  getNodes() {
    return this.nodes;
  }

  static getURL(node, func) {
    return `http://${node.ip}:${node.port}/${func}`;
  }

  static sendRequest(node, func) {
    return new Promise((resolve) => {
      needle.get(
        ConnectionHandler.getURL(node, func),
        { open_timeout: 3000 },
        (error, response) => {
          if (error) {
            return resolve(null);
          }
          return resolve(response.body);
        },
      );
    });
  }

  static getNodes(node) {
    return ConnectionHandler.sendRequest(node, 'getNodes');
  }

  static getHeight(node) {
    return ConnectionHandler.sendRequest(node, 'getHeight');
  }
};
