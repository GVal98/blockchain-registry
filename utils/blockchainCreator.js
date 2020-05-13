const fs = require('fs');
const crypto = require('crypto');

class BlockchainCreator {
  static create() {
    const genesisTransaction = BlockchainCreator.createGenesisTransaction();
    const genesisBlock = BlockchainCreator.createGenesisBlock(genesisTransaction);
    const blockchain = [genesisBlock];
    fs.writeFileSync(BlockchainCreator.getBlockchainFile(), JSON.stringify(blockchain));
  }

  static createGenesisTransaction() {
    const transaction = {};
    transaction.type = 'genesis';
    transaction.data = {};
    transaction.data.validators = [];
    const validatorPublicKeys = JSON.parse(fs.readFileSync(BlockchainCreator.getValidatorPublicKeysFile(), 'utf-8'));
    validatorPublicKeys.forEach((publicKey) => {
      transaction.data.validators.push(publicKey);
    });
    transaction.data.senders = [];
    const senderPublicKeys = JSON.parse(fs.readFileSync(BlockchainCreator.getSenderPublicKeysFile(), 'utf-8'));
    senderPublicKeys.forEach((publicKey) => {
      transaction.data.senders.push(publicKey);
    });
    return transaction;
  }

  static createGenesisBlock(genesisTransaction) {
    const block = {};
    block.time = Date.now();
    block.transactions = [genesisTransaction];
    block.hash = crypto.createHash('sha256').update(JSON.stringify(block)).digest('hex');
    return block;
  }

  static getValidatorPublicKeysFile() {
    return process.argv[2];
  }

  static getSenderPublicKeysFile() {
    return process.argv[3];
  }

  static getBlockchainFile() {
    return process.argv[4];
  }
}

BlockchainCreator.create();
