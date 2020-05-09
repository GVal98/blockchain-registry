const EdDSA = require('elliptic').eddsa;
const fs = require('fs');
const crypto = require('crypto');

exports.Elliptic = class Elliptic {
  constructor() {
    this.setValidatorPrivateKey();
    this.setSenderPrivateKey();
    this.eddsa = new EdDSA('ed25519');
    this.senderKey = this.eddsa.keyFromSecret(this.senderPrivateKey);
    this.senderPublicKey = this.senderKey.getPublic('hex');
    this.validatorKey = this.eddsa.keyFromSecret(this.senderPrivateKey);
  }

  signTransaction(transaction) {
    const signedTransaction = transaction;
    signedTransaction.sender = this.senderPublicKey;
    const transactionHash = crypto.createHash('sha256').update(JSON.stringify(signedTransaction)).digest('hex');
    signedTransaction.sign = this.senderKey.sign(transactionHash).toHex();
    return signedTransaction;
  }

  static getValidatorPrivateKeyFile() {
    return process.argv[6];
  }

  static getSenderPrivateKeyFile() {
    return process.argv[7];
  }

  setValidatorPrivateKey() {
    this.validatorPrivateKey = fs.readFileSync(Elliptic.getValidatorPrivateKeyFile());
  }

  setSenderPrivateKey() {
    this.senderPrivateKey = fs.readFileSync(Elliptic.getSenderPrivateKeyFile());
  }
};
