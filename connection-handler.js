const fs = require('fs');
const { Request } = require('./request');

exports.ConnectionHandler = class ConnectionHandler {
  constructor(transactionHelper) {
    this.setNodesFile();
    this.loadNodesFromFile();
    this.availableNodes = [];
    this.transactionHelper = transactionHelper;
    this.pendingTransactions = [];
    [, , this.nodeIP] = process.argv;
    [, , , this.nodePort] = process.argv;
    this.node = { ip: this.nodeIP, port: parseInt(this.nodePort, 10) };
  }

  async init() {
    Promise.resolve(await this.getAvailableNodesFull(this.allNodes));
    setInterval(() => this.getAvailableNodesFull(this.allNodes), 5000);
  }

  async getNewBlocks(currentHeight) {
    if (this.availableNodes.length === 0) {
      return null;
    }
    const highestNode = await this.getHighestNode();
    if (highestNode === null) {
      return null;
    }
    if (currentHeight >= highestNode.height) {
      console.log('Blockhain is already updated');
      return null;
    }
    console.log(`Updating from: ${JSON.stringify(highestNode)}`);
    const newBlocks = await ConnectionHandler.downloadNewBlocks(highestNode, currentHeight);
    // console.log('New blocks:');
    // console.log(newBlocks);
    return newBlocks;
  }

  static async downloadNewBlocks(node, currentHeight) {
    const newBlocks = await Request.getBlocks(node, currentHeight + 1, node.height);
    return newBlocks.result;
  }

  async getHighestNode() {
    const getHeightPromises = [];
    const updatedAvailableNodes = [];
    this.availableNodes.forEach(async (node) => {
      const requestgetHeight = Request.getHeight(node);
      getHeightPromises.push(requestgetHeight);
      // console.log(`Updating: ${JSON.stringify(node)}`);
      const response = await requestgetHeight;
      if (response !== null) {
        const updatedNode = ConnectionHandler.getFullNode(node, response.result);
        updatedAvailableNodes.push(updatedNode);
        // console.log(`Updated: ${JSON.stringify(updatedNode)}`);
      }
    });
    await Promise.all(getHeightPromises);
    this.availableNodes = updatedAvailableNodes;
    // console.log('Updated nodes:');
    // console.log(this.availableNodes);
    return ConnectionHandler.findHighestNodeInArray(this.availableNodes);
  }


  static findHighestNodeInArray(nodes) {
    if (nodes.length === 0) {
      return null;
    }
    return nodes.reduce((node1, node2) => ((node1.height > node2.height) ? node1 : node2));
  }

  getAvailableNodes(getNodesPromises, pendingNodes, targetNodes, availableNodes) {
    targetNodes.forEach(async (node) => {
      if (this.isNodeItself(node)) {
        // console.log(`Skipped: ${JSON.stringify(node)} (Self)`);
        return;
      }
      if (ConnectionHandler.isInArray(node, pendingNodes)) {
        // console.log(`Skipped: ${JSON.stringify(node)} (Already pending)`);
        return;
      }
      const getNodes = Request.getNodes(node, this.node);
      getNodesPromises.push(getNodes);
      pendingNodes.push(node);
      // console.log(`Checking: ${JSON.stringify(node)}`);
      const response = await getNodes;
      this.pushToAllNodes(node);
      if (response) {
        // console.log(`Available: ${JSON.stringify(node)}`);
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
        // console.log(`Not available: ${JSON.stringify(node)}`);
      }
    });
  }

  async sendTransaction(transaction) {
    if (!this.getNewTransaction(transaction)) {
      // console.log('Invalid transaction');
      return;
    }

    // console.log('Sending transaction:');
    // console.log(transaction);
    this.availableNodes.forEach(async (node) => {
      // console.log(`Sending transaction to: ${JSON.stringify(node)}`);
      const response = await Request.sendTransaction(node, transaction);
      if (response !== null) {
        if (response.result === true) {
          // console.log(`${JSON.stringify(node)}: Transaction added to pending`);
        } else {
          // console.log(`${JSON.stringify(node)}: Invalid transaction`);
        }
      }
    });
  }

  getNewTransaction(transaction) {
    // console.log('New transaction:');
    // console.log(transaction);
    if (this.transactionHelper.isTransactionValid(transaction)) {
      // console.log('Transaction added to pening');
      ConnectionHandler.pushTransactionIfNotIn(transaction, this.pendingTransactions);
      return true;
    }
    // console.log('Invallid transaction');
    return false;
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
    // this.printNodesStatus();
  }

  static pushIfNotIn(targetNode, array) {
    if (!ConnectionHandler.isInArray(targetNode, array)) {
      array.push(targetNode);
    }
  }

  async getPendingTransactionsFromNodes() {
    this.availableNodes.forEach(async (node) => {
      // console.log(`Getting new transactions from: ${JSON.stringify(node)}`);
      const response = await Request.getPendingTransactions(node);
      // /console.log(response);
      if (response !== null) {
        if (response.result.length > 0) {
          response.result.forEach((transaction) => {
            // console.log(transaction);
            this.getNewTransaction(transaction);
          });
        }
      }
    });
  }

  getPendingTransactions() {
    // console.log('Pending transactions:');
    // console.log(this.pendingTransactions);
    return this.pendingTransactions;
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

  static isTransactionsEqual(transaction1, transaction2) {
    return (JSON.stringify(transaction1) === JSON.stringify(transaction2));
  }

  static isTransactionsInArray(transaction1, array) {
    return (array.some(
      (transaction2) => ConnectionHandler.isTransactionsEqual(transaction1, transaction2),
    ));
  }

  static pushTransactionIfNotIn(transaction, array) {
    if (!ConnectionHandler.isTransactionsInArray(transaction, array)) {
      array.push(transaction);
    }
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
    // console.log(`Request by node: ${JSON.stringify(node)}`);
    this.pushToAllNodes(node);
    return this.allNodes;
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
