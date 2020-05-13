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

  isTransactionValid(senders, allTransactions, transaction) {
    return (this.elliptic.verifyTransactionSign(transaction)
     && !TransactionHelper.isTransactionsInArray(transaction, allTransactions)
     && TransactionHelper.isSenderValid(transaction.sender, senders));
  }

  static isSenderValid(sender, senders) {
    return senders.includes(sender);
  }

  static isTransactionsEqual(transaction1, transaction2) {
    return (transaction1.hash === transaction2.hash);
  }

  static isTransactionsInArray(transaction1, array) {
    return (array.some(
      (transaction2) => TransactionHelper.isTransactionsEqual(transaction1, transaction2),
    ));
  }
};