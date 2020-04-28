const fs = require('fs');

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
};
