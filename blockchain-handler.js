const fs = require('fs');
const crypto = require('crypto');

exports.BlockchainHandler = class BlockchainHandler {
  constructor(connectionHandler, transactionHelper) {
    this.connectionHandler = connectionHandler;
    this.transactionHelper = transactionHelper;
    this.loadBlockchainFromFile();
    this.setValidators();
    const tx = this.transactionHelper.createTransaction('nodata');
    this.sendTransaction(tx);
    setInterval(() => this.updateChain(), 3500);
  }

  static isBlockHashValid(block) {
    const { hash, ...blockWithoutHash } = block;
    if (block.hash === crypto.createHash('sha256').update(JSON.stringify(blockWithoutHash)).digest('hex')) {
      return true;
    }
    return false;
  }

  sendTransaction(transaction) {
    this.connectionHandler.sendTransaction(transaction);
  }

  setValidators() {
    this.validators = [];
    if (BlockchainHandler.isBlockHashValid(this.blockchain[0])) {
      this.blockchain[0].transaction.data.validators.forEach((validator) => {
        this.validators.push(validator);
      });
    }
  }

  static isBlockPreviousHashValid(previousBlock, block) {
    if (previousBlock.hash === block.previousHash) {
      return true;
    }
    return false;
  }

  isBlockPreviousHashValid(block) {
    return BlockchainHandler.isBlockPreviousHashValid(this.getLastBlock(), block);
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
      if (!BlockchainHandler.isBlockHashValid(block)) {
        console.log('Wrong hash');
        return;
      }
      if (!this.isBlockPreviousHashValid(block)) {
        console.log('Wrong previous hash');
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
