const fs = require('fs');

exports.BlockchainHandler = class BlockchainHandler {
  constructor(connectionHandler) {
    this.connectionHandler = connectionHandler;
    this.loadBlockchainFromFile();
    this.setValidatorPrivateKey();
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

  static getBlockchainFile() {
    return process.argv[5];
  }

  static getValidatorPrivateKeyFile() {
    return process.argv[6];
  }

  loadBlockchainFromFile() {
    this.blockchain = JSON.parse(fs.readFileSync(BlockchainHandler.getBlockchainFile()));
  }

  setValidatorPrivateKey() {
    this.validatorPrivateKey = fs.readFileSync(BlockchainHandler.getValidatorPrivateKeyFile());
  }

  getBlocks(startBlock, endBlock) {
    return this.blockchain.slice(startBlock, endBlock + 1);
  }

  getHeight() {
    return this.blockchain.length - 1;
  }
};
