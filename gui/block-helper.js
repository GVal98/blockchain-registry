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
      return false;
    }
    const uniqTranasctions = [...new Set(transactions.map((transaction) => transaction.hash))];
    if (uniqTranasctions.length !== transactions.length) {
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
    return (
      BlockHelper.isBlockHashValid(block)
      && this.isAllTransactionsValid(senders, allTransactions, block.transactions)
      && this.isBlockSignValid(block)
      && BlockHelper.isBlockPreviousHashValid(previousBlock, block)
      && BlockHelper.canValidatorSignBlockForTime(validators, block.validator, block.time)
      && BlockHelper.isBlockTimeValid(previousBlock, block)
    );
  }

  static isBlockTimeValid(previousBlock, block) {
    if (block.time > previousBlock.time && block.time < Date.now()) {
      return true;
    }
    console.log('Time invalid');
    return false;
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
