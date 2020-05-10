exports.TransactionHelper = class TransactionHelper {
  constructor(elliptic) {
    this.elliptic = elliptic;
  }

  createTransaction(data) {
    let transaction = {};
    transaction.time = Date.now();
    transaction.type = 'data';
    transaction.data = data;
    transaction = this.elliptic.signTransaction(transaction);
    return transaction;
  }

  isTransactionValid(transaction) {
    return this.elliptic.verifyTransactionSign(transaction);
  }
};
