const fs = require('fs');
const { BlockHelper } = require('./block-helper');

exports.BlockchainHandler = class BlockchainHandler {
  constructor(connectionHandler, transactionHelper, blockHelper) {
    this.connectionHandler = connectionHandler;
    this.transactionHelper = transactionHelper;
    this.blockHelper = blockHelper;
    this.loadBlockchainFromFile();
    this.setValidators();
    const tx = this.transactionHelper.createTransaction('nodata');
    // this.sendTransaction(tx);
    const block = this.createBlock([tx]);
    console.log(JSON.stringify(block));
    console.log(this.isBlockValid(block));
    setInterval(() => this.updateChain(), 3500);
    setInterval(() => this.updatePendingTransactions(), 3500);
  }

  createBlock(transactions) {
    return this.blockHelper.createBlock(this.getLastBlock(), transactions);
  }

  isBlockValid(block) {
    return this.blockHelper.isBlockValid(this.getLastBlock(), block);
  }

  sendTransaction(transaction) {
    this.connectionHandler.sendTransaction(transaction);
  }

  setValidators() {
    this.validators = [];
    if (BlockHelper.isBlockHashValid(this.blockchain[0])) {
      this.blockchain[0].transaction.data.validators.forEach((validator) => {
        this.validators.push(validator);
      });
    }
  }

  getLastBlock() {
    return this.blockchain[this.blockchain.length - 1];
  }

  async updatePendingTransactions() {
    this.connectionHandler.getPendingTransactionsFromNodes();
  }

  async updateChain() {
    const newBlocks = await this.connectionHandler.getNewBlocks(this.getHeight());
    if (newBlocks === null) {
      return;
    }
    console.log(newBlocks);
    newBlocks.forEach((block) => {
      if (!this.isBlockValid(block)) {
        console.log('Block is invalid');
        return;
      }
      this.blockchain.push(block);
      console.log('New block:');
      console.log(block);
    });
    console.log('Chain:');
    console.log(this.blockchain);
  }

  static getBlockchainFile() {
    return process.argv[5];
  }

  loadBlockchainFromFile() {
    this.blockchain = JSON.parse(fs.readFileSync(BlockchainHandler.getBlockchainFile()));
  }

  getBlocks(startBlock, endBlock) {
    return this.blockchain.slice(startBlock, endBlock + 1);
  }

  getHeight() {
    return this.blockchain.length - 1;
  }
};
