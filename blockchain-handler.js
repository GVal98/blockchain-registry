const fs = require('fs');

exports.BlockchainHandler = class BlockchainHandler {
  constructor(connectionHandler) {
    this.connectionHandler = connectionHandler;
    this.setBlockchainFile();
    this.loadBlockchainFromFile();
  }

  setBlockchainFile() {
    [, , , , , this.blockchainFile] = process.argv;
  }

  loadBlockchainFromFile() {
    this.blockchain = JSON.parse(fs.readFileSync(this.blockchainFile));
  }

  getHeight() {
    return this.blockchain.length;
  }
};
