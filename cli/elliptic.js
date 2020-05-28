const EdDSA = require('elliptic').eddsa;
const fs = require('fs');
const crypto = require('crypto');
const CryptoJS = require('crypto-js');

exports.Elliptic = class Elliptic {
  constructor() {
    this.eddsa = new EdDSA('ed25519');
    if (Elliptic.getValidatorPrivateKeyFile() != 0) {
      this.setValidatorPrivateKey();
      this.validatorKey = this.eddsa.keyFromSecret(this.validatorPrivateKey);
      this.validatorPublicKey = this.validatorKey.getPublic('hex');
    } else {
      this.validatorPublicKey = null;
    }
    this.setSenderPrivateKey();
    this.senderKey = this.eddsa.keyFromSecret(this.senderPrivateKey);
    this.senderPublicKey = this.senderKey.getPublic('hex');
  }

  signTransaction(transaction) {
    const signedTransaction = transaction;
    signedTransaction.sender = this.senderPublicKey;
    signedTransaction.hash = Elliptic.getUnsignedTransactionHash(transaction);
    signedTransaction.sign = this.senderKey.sign(signedTransaction.hash).toHex();
    return signedTransaction;
  }

  signBlock(block) {
    const signedBlock = block;
    signedBlock.sign = this.validatorKey.sign(block.hash).toHex();
    return signedBlock;
  }

  verifyBlockSign(block) {
    const validatorKey = this.eddsa.keyFromPublic(block.validator, 'hex');
    return validatorKey.verify(block.hash, block.sign);
  }

  static getUnsignedTransactionHash(transaction) {
    return crypto.createHash('sha256').update(JSON.stringify(transaction)).digest('hex');
  }

  static getUnsignedTransaction(transaction) {
    const unsignedTransaction = { ...transaction };
    delete unsignedTransaction.sign;
    delete unsignedTransaction.hash;
    return unsignedTransaction;
  }

  verifyTransactionSign(transaction) {
    const senderKey = this.eddsa.keyFromPublic(transaction.sender, 'hex');
    const transactionHash = Elliptic.getUnsignedTransactionHash(
      Elliptic.getUnsignedTransaction(transaction),
    );
    if (transaction.hash !== transactionHash) {
      return false;
    }
    return senderKey.verify(transactionHash, transaction.sign);
  }

  static getValidatorPrivateKeyFile() {
    return process.argv[6];
  }

  static getSenderPrivateKeyFile() {
    return process.argv[10];
  }

  static getValidatorPrivateKeyPassword() {
    return process.argv[7];
  }

  static getSenderPrivateKeyPassword() {
    return process.argv[11];
  }

  setValidatorPrivateKey() {
    this.validatorPrivateKey = CryptoJS.AES.decrypt(fs.readFileSync(Elliptic.getValidatorPrivateKeyFile(), 'utf-8'), Elliptic.getValidatorPrivateKeyPassword()).toString(CryptoJS.enc.Utf8);
  }

  setSenderPrivateKey() {
    this.senderPrivateKey = CryptoJS.AES.decrypt(fs.readFileSync(Elliptic.getSenderPrivateKeyFile(), 'utf-8'), Elliptic.getSenderPrivateKeyPassword()).toString(CryptoJS.enc.Utf8);
  }

  getValidatorPublicKey() {
    return this.validatorPublicKey;
  }
};
