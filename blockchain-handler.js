const fs = require('fs');
const crypto = require('crypto');

exports.BlockchainHandler = class BlockchainHandler {
  constructor(connectionHandler) {
    this.connectionHandler = connectionHandler;
    this.loadBlockchainFromFile();
    this.setValidatorPrivateKey();
    this.setValidators();
    setInterval(() => this.updateChain(), 3500);
  }

  static isBlockHashValid(block) {
    const { hash, ...blockWithoutHash } = block;
    if (block.hash === crypto.createHash('sha256').update(JSON.stringify(blockWithoutHash)).digest('hex')) {
      return true;
    }
    return false;
  }

  setValidators() {
    this.validators = [];
    if (BlockchainHandler.isBlockHashValid(this.blockchain[0])) {
      this.blockchain[0].transaction.data.validators.forEach((validator) => {
        this.validators.push(validator);
      });
    }
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
