const crypto = require('crypto');

exports.BlockHelper = class BlockHelper {
  constructor(elliptic, transactionHelper) {
    this.elliptic = elliptic;
    this.transactionHelper = transactionHelper;
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

  isAllTransactionsValid(transactions) {
    let isBlockTransactionsValid = true;
    transactions.forEach((transaction) => {
      if (!this.transactionHelper.isTransactionValid(transaction)) {
        isBlockTransactionsValid = false;
      }
    });
    return isBlockTransactionsValid;
  }

  isBlockSignValid(block) {
    return this.elliptic.verifyBlockSign(block);
  }

  isBlockValid(previousBlock, block) {
    return (
      BlockHelper.isBlockHashValid(block)
      && this.isAllTransactionsValid(block.transactions)
      && this.isBlockSignValid(block)
      && BlockHelper.isBlockPreviousHashValid(previousBlock, block)
    );
  }

  static isBlockPreviousHashValid(previousBlock, block) {
    if (previousBlock.hash === block.previousHash) {
      return true;
    }
    return false;
  }

  createBlock(previousBlock, transactions) {
    const block = {};
    const validTransactions = [];
    transactions.forEach((transaction) => {
      if (this.transactionHelper.isTransactionValid(transaction)) {
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
