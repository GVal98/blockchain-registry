const crypto = require('crypto');

exports.BlockHelper = class BlockHelper {
  constructor(elliptic, transactionHelper) {
    this.elliptic = elliptic;
    this.transactionHelper = transactionHelper;
  }

  static isBlockHashValid(block) {
    const { hash, ...blockWithoutHash } = block;
    if (block.hash === crypto.createHash('sha256').update(JSON.stringify(blockWithoutHash)).digest('hex')) {
      return true;
    }
    return false;
  }

  static isBlockPreviousHashValid(previousBlock, block) {
    if (previousBlock.hash === block.previousHash) {
      return true;
    }
    return false;
  }
};
