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

  static getStringAddress(node) {
    return `http://${node.ip}:${node.port}/`;
  }

  static getHeight(address) {
    needle.get(`${address}getHeight`, { open_timeout: 3000 }, (error, response) => {
      if (!error) {
        // console.log(response.body);
      } else {
        // console.log('eror');
      }
    });
  }
};
