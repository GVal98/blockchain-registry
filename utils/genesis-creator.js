const fs = require('fs');
const crypto = require('crypto');

exports.GenesisCreator = class GenesisCreator {
  create() {
    const genesisTransaction = this.createGenesisTransaction();
    const genesisBlock = this.createGenesisBlock(genesisTransaction);
    const blockchain = [genesisBlock];
    fs.writeFileSync(this.getBlockchainFile(), JSON.stringify(blockchain));
  }

  createGenesisTransaction() {
    const transaction = {};
    transaction.type = 'genesis';
    transaction.data = {};
    transaction.data.validators = [];
    const validatorPublicKeys = JSON.parse(fs.readFileSync(this.getValidatorPublicKeysFile(), 'utf-8'));
    validatorPublicKeys.forEach((publicKey) => {
      transaction.data.validators.push(publicKey);
    });
    transaction.data.senders = [];
    const senderPublicKeys = JSON.parse(fs.readFileSync(this.getSenderPublicKeysFile(), 'utf-8'));
    senderPublicKeys.forEach((publicKey) => {
      transaction.data.senders.push(publicKey);
    });
    return transaction;
  }

  createGenesisBlock(genesisTransaction) {
    const block = {};
    block.time = Date.now();
    block.transactions = [genesisTransaction];
    block.hash = crypto.createHash('sha256').update(JSON.stringify(block)).digest('hex');
    return block;
  }

  getValidatorPublicKeysFile() {
    return process.argv[3];
  }

  getSenderPublicKeysFile() {
    return process.argv[4];
  }

  getBlockchainFile() {
    return process.argv[5];
  }
}