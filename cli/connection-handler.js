const fs = require('fs');
const { Request } = require('./request');
const { TransactionHelper } = require('./transaction-helper');

exports.ConnectionHandler = class ConnectionHandler {
  constructor(transactionHelper) {
    this.setNodesFile();
    this.loadNodesFromFile();
    this.availableNodes = [];
    this.badNodes = [];
    this.transactionHelper = transactionHelper;
    this.pendingTransactions = [];
    [, , this.nodeIP] = process.argv;
    [, , , this.nodePort] = process.argv;
    this.node = { ip: this.nodeIP, port: parseInt(this.nodePort, 10) };
  }

  setBlockchainHandler(blockchainHandler) {
    this.blockchainHandler = blockchainHandler;
  }

  async init() {
    Promise.resolve(await this.getAvailableNodesFull(this.allNodes));
    setInterval(() => this.getAvailableNodesFull(this.allNodes), 5000);
  }

  addBadNode(badNode) {
    ConnectionHandler.pushIfNotIn(badNode, this.badNodes);
    console.log('BAD:');
    console.log(this.badNodes);
    this.availableNodes = this.availableNodes.filter(
      (node) => !ConnectionHandler.isNodesEqual(node, badNode),
    );
    console.log('AVAL:');
    console.log(this.availableNodes);
  }

  static async getNewBlocks(highestNode, currentHeight) {
    console.log(`Updating from: ${JSON.stringify(highestNode)}`);
    const newBlocks = await ConnectionHandler.downloadNewBlocks(highestNode, currentHeight);
    // console.log('New blocks:');
    // console.log(newBlocks);
    if (newBlocks !== null) {
      return newBlocks.result;
    }
    return null;
  }

  static async getNewBlock(highestNode, blockHeight) {
    console.log(`Updating from: ${JSON.stringify(highestNode)}`);
    const newBlock = await Request.getBlock(highestNode, blockHeight);
    // console.log('New blocks:');
    // console.log(newBlocks);
    if (newBlock !== null) {
      return newBlock.result;
    }
    return null;
  }


  static async downloadNewBlocks(node, currentHeight) {
    const newBlocks = await Request.getBlocks(node, currentHeight + 1, node.height);
    return newBlocks;
  }

  async getHighestNode() {
    if (this.availableNodes.length === 0) {
      return null;
    }
    const getHeightPromises = [];
    const updatedAvailableNodes = [];
    this.availableNodes.forEach(async (node) => {
      const requestgetHeight = Request.getPendingTransactions(node);
      getHeightPromises.push(requestgetHeight);
      // console.log(`Updating: ${JSON.stringify(node)}`);
      const response = await requestgetHeight;
      if (response !== null) {
        const updatedNode = ConnectionHandler.getFullNode(node, response.result.height);
        updatedAvailableNodes.push(updatedNode);
        this.addNewPendingTransactions(response.result.pendingTransactions);
        // console.log(`Updated: ${JSON.stringify(updatedNode)}`);
      }
    });
    await Promise.all(getHeightPromises);
    this.availableNodes = updatedAvailableNodes;
    // console.log('Updated nodes:');
    // console.log(this.availableNodes);
    return ConnectionHandler.findHighestNodeInArray(this.availableNodes);
  }

  addNewPendingTransactions(pendingTransactions) {
    if (pendingTransactions.length > 0) {
      pendingTransactions.forEach((transaction) => {
        // console.log(transaction);
        this.getNewTransaction(transaction);
      });
    }
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
        if (response.result == null) return;
        if (!ConnectionHandler.isNodeValid(node)) return;
        // console.log(`Available: ${JSON.stringify(node)}`);
        const fullNode = ConnectionHandler.getFullNode(node, response.result.height);
        if (!ConnectionHandler.isInArray(fullNode, availableNodes)
         && !ConnectionHandler.isInArray(fullNode, this.badNodes)) {
          availableNodes.push(fullNode);
          this.addNewPendingTransactions(response.result.pendingTransactions);
        }
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
    if (this.transactionHelper.isTransactionValid(
      this.blockchainHandler.getSenders(),
      this.blockchainHandler.getAllTransactions(),
      transaction,
    )) {
      ConnectionHandler.pushTransactionIfNotIn(transaction, this.pendingTransactions);
      return true;
    }
    console.log('Invallid transaction');
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
    if (!ConnectionHandler.isNodeValid(targetNode)) return;
    if (!ConnectionHandler.isInArray(targetNode, array)) {
      array.push(targetNode);
    }
  }

  removePendingTransactions(transactions) {
    this.pendingTransactions = this.pendingTransactions.filter(
      (transaction) => !TransactionHelper.isTransactionsInArray(transaction, transactions),
    );
  }

  getPendingTransactions() {
    // console.log('Pending transactions:');
    // console.log(this.pendingTransactions);
    return this.pendingTransactions;
  }

  pushToAllNodes(node) {
    ConnectionHandler.pushIfNotIn(node, this.allNodes);
    fs.writeFileSync(this.nodesFile, JSON.stringify(this.allNodes));
  }

  static isInArray(targetNode, array) {
    return (array.some((node) => ConnectionHandler.isNodesEqual(node, targetNode)));
  }

  static isNodesEqual(node1, node2) {
    return (node1.port === node2.port && node1.ip === node2.ip);
  }

  static isNodeValid(node) {
    return (('ip' in node) && ('port' in node));
  }

  static pushTransactionIfNotIn(transaction, array) {
    if (TransactionHelper.isTransactionsInArray(transaction, array)) {
      console.log('Transaction is already in pending');
      return false;
    }
    // console.log('ALL TRANSACTIONS:');
    // console.log(this.blockchainHandler.getAllTransactions());
    array.push(transaction);
    console.log('Transaction added to pending:');
    console.log(transaction);
    return true;
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
