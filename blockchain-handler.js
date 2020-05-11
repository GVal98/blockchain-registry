const fs = require('fs');
const { BlockHelper } = require('./block-helper');

exports.BlockchainHandler = class BlockchainHandler {
  constructor(transactionHelper, blockHelper) {
    this.transactionHelper = transactionHelper;
    this.blockHelper = blockHelper;
    this.loadBlockchainFromFile();
    this.setValidators();
  }

  setConnectionHandler(connectionHandler) {
    this.connectionHandler = connectionHandler;
  }

  init() {
    const tx = this.transactionHelper.createTransaction('nodata');
    this.sendTransaction(tx);
    setInterval(() => this.updateChain(), 2000);
    setInterval(() => this.addNewBlockFromPendingTransactions(), 3000);
    // setInterval(() => console.log(this.getPendingTransactions()), 1000);
  }

  isBlockValid(block) {
    return this.blockHelper.isBlockValid(
      this.getAllTransactions(),
      this.validators,
      this.getLastBlock(),
      block,
    );
  }

  addNewBlockFromPendingTransactions() {
    const block = this.createNewBlockFromPendingTransactions();
    if (block) {
      this.addNewBlock(block);
    }
  }

  getAllTransactions() {
    let transactions = [];
    for (let i = 1; i < this.blockchain.length; i += 1) {
      transactions = transactions.concat(this.blockchain[i].transactions);
    }
    return transactions;
  }

  createNewBlockFromPendingTransactions() {
    return this.blockHelper.createBlockIfTime(
      this.getAllTransactions(),
      this.validators,
      this.getLastBlock(),
      this.getPendingTransactions(),
    );
  }

  sendTransaction(transaction) {
    this.connectionHandler.sendTransaction(transaction);
  }

  getPendingTransactions() {
    return this.connectionHandler.getPendingTransactions();
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

  async updateChain() {
    const newBlocks = await this.connectionHandler.getNewBlocks(this.getHeight());
    if (newBlocks === null) {
      return;
    }
    newBlocks.forEach((block) => {
      if (!this.isBlockValid(block)) {
        console.log('Block is invalid');
        return;
      }
      this.addNewBlock(block);
    });
    // console.log('Chain:');
    // console.log(this.blockchain);
  }

  addNewBlock(block) {
    this.connectionHandler.removePendingTransactions(block.transactions);
    this.blockchain.push(block);
    console.log('New block:');
    console.log(block);
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
