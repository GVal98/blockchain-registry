const crypto = require('crypto');
const { TransactionHelper } = require('./transaction-helper');

exports.BlockHelper = class BlockHelper {
  constructor(elliptic, transactionHelper) {
    this.elliptic = elliptic;
    this.transactionHelper = transactionHelper;
  }

  getValidatorPublicKey() {
    return this.elliptic.getValidatorPublicKey();
  }

  static isBlockHashValid(block) {
    if (block.hash === BlockHelper.calculateBlockHash(block)) {
      return true;
    }
    return false;
  }

  static calculateBlockHash(block) {
    const { hash, sign, ...rawBlock } = block;
    return crypto.createHash('sha256').update(JSON.stringify(rawBlock)).digest('hex');
  }

  isAllTransactionsValid(senders, allTransactions, transactions) {
    if (transactions.length <= 0) {
      console.log('EMPTY TRANSACTION');
      return false;
    }
    const uniqTranasctions = [...new Set(transactions.map((transaction) => transaction.hash))];
    if (uniqTranasctions.length !== transactions.length) {
      console.log('TRANSACTION DUBLICATE IN BLOCK');
      console.log(`${uniqTranasctions.length} !== ${transactions.length}`);
      return false;
    }
    let isBlockTransactionsValid = true;
    transactions.forEach((transaction) => {
      if (!this.transactionHelper.isTransactionValid(senders, allTransactions, transaction)) {
        isBlockTransactionsValid = false;
      }
    });
    return isBlockTransactionsValid;
  }

  isBlockSignValid(block) {
    return this.elliptic.verifyBlockSign(block);
  }

  isBlockValid(senders, allTransactions, validators, previousBlock, block) {
    if (!BlockHelper.isBlockHashValid(block)) {
      console.log('BLOCK HASH INVALID');
      return false;
    }
    if (!this.isAllTransactionsValid(senders, allTransactions, block.transactions)) {
      console.log('TRANSACTIONS INVALID');
      return false;
    }
    if (!this.isBlockSignValid(block)) {
      console.log('BLOCK SIGN INVALID');
      return false;
    }
    if (!BlockHelper.isBlockPreviousHashValid(previousBlock, block)) {
      console.log('BLOCK PREVIOUS HASH INVALID');
      return false;
    }
    if (!BlockHelper.canValidatorSignBlockForTime(validators, block.validator, block.time)) {
      console.log('VALIDATOR INVALID');
      return false;
    }
    if (!BlockHelper.isBlockTimeValid(previousBlock, block)) {
      console.log('BLOCK TIME INVALID');
      return false;
    }
    return true;
  }

  static isBlockTimeValid(previousBlock, block) {
    if (block.time < previousBlock.time) {
      console.log('BLOCK TIME OLDER THAN PREVIOUS');
      return false;
    }
    if ((block.time-9000) > Date.now()) {
      console.log('BLOCK TIME NEWER THAN CURRENT TIME');
      return false;
    }
    return true;
  }

  static isBlockPreviousHashValid(previousBlock, block) {
    if (previousBlock.hash === block.previousHash) {
      return true;
    }
    return false;
  }

  static getValidatorForTime(validators, time) {
    return validators[Math.round(time / 1000 / 5) % validators.length];
  }

  canSignBlockNow(validators) {
    return BlockHelper.canValidatorSignBlockForTime(
      validators,
      this.getValidatorPublicKey(),
      Date.now(),
    );
  }

  static canValidatorSignBlockForTime(validators, validator, time) {
    return (BlockHelper.getValidatorForTime(validators, time) === validator);
  }

  createBlockIfTime(senders, allTransactions, validators, previousBlock, transactions) {
    if (!this.canSignBlockNow(validators)) {
      return false;
    }
    if (transactions.length <= 0) {
      return false;
    }
    const block = this.createBlock(senders, allTransactions, previousBlock, transactions);
    if (this.isBlockValid(senders, allTransactions, validators, previousBlock, block)) {
      return block;
    }
    return false;
  }

  createBlock(senders, allTransactions, previousBlock, transactions) {
    const block = {};
    const validTransactions = [];
    transactions.forEach((transaction) => {
      if (this.transactionHelper.isTransactionValid(senders, allTransactions, transaction)
      && !TransactionHelper.isTransactionsInArray(transaction, validTransactions)) {
        validTransactions.push(transaction);
      }
    });
    block.time = Date.now();
    block.transactions = validTransactions;
    block.validator = this.elliptic.getValidatorPublicKey();
    block.previousHash = previousBlock.hash;
    block.hash = BlockHelper.calculateBlockHash(block);
    return this.elliptic.signBlock(block);
  }
};
