const fs = require('fs');
const needle = require('needle');

exports.ConnectionHandler = class ConnectionHandler {
  constructor() {
    this.setNodesFile();
    this.loadNodesFromFile();
    this.availableNodes = [];
    this.pendingNodes = [];
    [, , this.nodeIP] = process.argv;
    [, , , this.nodePort] = process.argv;
    this.node = { ip: this.nodeIP, port: parseInt(this.nodePort, 10) };
  }

  async init() {
    Promise.resolve(await this.getAvailableNodesFull(this.allNodes));
    setInterval(() => this.getAvailableNodesFull(this.allNodes), 5000);
  }

  getAvailableNodes(getNodesPromises, pendingNodes, targetNodes) {
    targetNodes.forEach(async (node) => {
      if (this.isNodeItself(node)) {
        console.log(`Skipped: ${JSON.stringify(node)} (Self)`);
        return;
      }
      if (ConnectionHandler.isInArray(node, pendingNodes)) {
        console.log(`Skipped: ${JSON.stringify(node)} (Already pending)`);
        return;
      }
      const getNodes = ConnectionHandler.getNodes(node);
      getNodesPromises.push(getNodes);
      pendingNodes.push(node);
      console.log(`Checking: ${JSON.stringify(node)}`);
      const nodes = await getNodes;
      this.pushToAllNodes(node);
      if (nodes) {
        console.log(`Available: ${JSON.stringify(node)}`);
        this.pushToAvailableNodes(node);
        getNodesPromises.push(this.getAvailableNodes(getNodesPromises, pendingNodes, nodes.result));
      } else {
        console.log(`Not available: ${JSON.stringify(node)}`);
      }
    });
  }

  async getAvailableNodesFull(targetNodes) {
    const getNodesPromises = [];
    const pendingNodes = [];
    this.getAvailableNodes(getNodesPromises, pendingNodes, targetNodes);
    await Promise.all(getNodesPromises);
    this.printNodesStatus();
  }

  static pushIfNotIn(targetNode, array) {
    if (!ConnectionHandler.isInArray(targetNode, array)) {
      array.push(targetNode);
    }
  }

  pushToAvailableNodes(node) {
    ConnectionHandler.pushIfNotIn(node, this.availableNodes);
  }

  pushToAllNodes(node) {
    ConnectionHandler.pushIfNotIn(node, this.allNodes);
  }

  static isInArray(targetNode, array) {
    return (array.some((node) => ConnectionHandler.isNodesEqual(node, targetNode)));
  }

  static isNodesEqual(node1, node2) {
    return (JSON.stringify(node1) === JSON.stringify(node2));
  }

  isNodeItself(node) {
    return ConnectionHandler.isNodesEqual(node, this.node);
  }


  setNodesFile() {
    [, , , , this.nodesFile] = process.argv;
  }

  loadNodesFromFile() {
    this.allNodes = JSON.parse(fs.readFileSync(this.nodesFile));
  }

  getNodes() {
    return this.allNodes;
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

  printNodesStatus() {
    console.log();
    console.log('Available nodes:');
    console.log(this.availableNodes);
    console.log('All nodes:');
    console.log(this.allNodes);
    console.log();
  }
};
