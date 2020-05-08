const fs = require('fs');

exports.BlockchainHandler = class BlockchainHandler {
  constructor(connectionHandler) {
    this.connectionHandler = connectionHandler;
    this.setBlockchainFile();
    this.setValidatorPrivateKeyFile();
    this.loadBlockchainFromFile();
    this.setValidatorPrivateKey();
    console.log(this.validatorPrivateKey);
    setInterval(() => this.updateChain(), 3500);
  }

  async updateChain() {
    const newBlocks = await this.connectionHandler.getNewBlocks(this.getHeight());
    if (newBlocks !== null) {
      this.blockchain = this.blockchain.concat(newBlocks);
    }
    console.log('Chain:');
    console.log(this.blockchain);
  }

  setBlockchainFile() {
    [, , , , , this.blockchainFile] = process.argv;
  }

  setValidatorPrivateKeyFile() {
    [, , , , , , this.validatorPrivateKeyFile] = process.argv;
  }

  loadBlockchainFromFile() {
    this.blockchain = JSON.parse(fs.readFileSync(this.blockchainFile));
  }

  getBlocks(startBlock, endBlock) {
    return this.blockchain.slice(startBlock, endBlock + 1);
  }

  getHeight() {
    return this.blockchain.length - 1;
  }

  setValidatorPrivateKey() {
    this.validatorPrivateKey = fs.readFileSync(this.validatorPrivateKeyFile);
  }
};
