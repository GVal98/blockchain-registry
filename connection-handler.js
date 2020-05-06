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

  getAvailableNodes(getNodesPromises, pendingNodes, targetNodes, availableNodes) {
    targetNodes.forEach(async (node) => {
      if (this.isNodeItself(node)) {
        console.log(`Skipped: ${JSON.stringify(node)} (Self)`);
        return;
      }
      if (ConnectionHandler.isInArray(node, pendingNodes)) {
        console.log(`Skipped: ${JSON.stringify(node)} (Already pending)`);
        return;
      }
      const getNodes = this.requestGetNodes(node);
      getNodesPromises.push(getNodes);
      pendingNodes.push(node);
      console.log(`Checking: ${JSON.stringify(node)}`);
      const response = await getNodes;
      this.pushToAllNodes(node);
      if (response) {
        console.log(`Available: ${JSON.stringify(node)}`);
        ConnectionHandler.pushIfNotIn(
          ConnectionHandler.getFullNode(node, response.result.height), availableNodes,
        );
        getNodesPromises.push(
          this.getAvailableNodes(
            getNodesPromises,
            pendingNodes,
            response.result.nodes,
            availableNodes,
          ),
        );
      } else {
        console.log(`Not available: ${JSON.stringify(node)}`);
      }
    });
  }

  static getFullNode(node, height) {
    return { ...node, height };
  }

  async getAvailableNodesFull(targetNodes) {
    const availableNodes = [];
    const getNodesPromises = [];
    const pendingNodes = [];
    this.getAvailableNodes(getNodesPromises, pendingNodes, targetNodes, availableNodes);
    await Promise.all(getNodesPromises);
    this.availableNodes = availableNodes;
    this.printNodesStatus();
  }

  static pushIfNotIn(targetNode, array) {
    if (!ConnectionHandler.isInArray(targetNode, array)) {
      array.push(targetNode);
    }
  }


  pushToAllNodes(node) {
    ConnectionHandler.pushIfNotIn(node, this.allNodes);
  }

  static isInArray(targetNode, array) {
    return (array.some((node) => ConnectionHandler.isNodesEqual(node, targetNode)));
  }

  static isNodesEqual(node1, node2) {
    return (node1.port === node2.port && node1.ip === node2.ip);
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

  getNodes(node) {
    console.log(`Request by node: ${JSON.stringify(node)}`);
    this.pushToAllNodes(node);
    return this.allNodes;
  }

  static getURL(node, func) {
    return `http://${node.ip}:${node.port}/${func}`;
  }

  sendRequest(node, func) {
    return new Promise((resolve) => {
      needle.post(
        ConnectionHandler.getURL(node, func),
        this.node,
        { open_timeout: 3000, json: true },
        (error, response) => {
          if (error) {
            return resolve(null);
          }
          return resolve(response.body);
        },
      );
    });
  }

  requestGetNodes(node) {
    return this.sendRequest(node, 'getNodes');
  }

  requestgetHeight(node) {
    return this.sendRequest(node, 'getHeight');
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
