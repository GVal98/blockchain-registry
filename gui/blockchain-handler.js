const fs = require('fs');
const { BlockHelper } = require('./block-helper');
const { ConnectionHandler } = require('./connection-handler');
const { ipcMain } = require('electron');

exports.BlockchainHandler = class BlockchainHandler {
  constructor(transactionHelper, blockHelper, blockchainFile, electronApp) {
    this.transactionHelper = transactionHelper;
    this.blockHelper = blockHelper;
    this.blockchainFile = blockchainFile;
    this.electronApp = electronApp;
    this.loadBlockchainFromFile();
    this.setValidators();
    this.setSenders();
    ipcMain.on('windowReady', (event) => {
      event.reply('newBlock', this.getLastBlocks(5));
    })
    ipcMain.on('RequsetBlocks', (event, offset) => {
      event.reply('blocksResponse', this.getLastBlocksOffset(offset, 5));
    })
    ipcMain.on('sendTransaction', (event, senderKeyFile, senderKeyPassword, property, seller, buyer, price) => {
      event.reply('transactionCreated', this.createAndSendTransaction(senderKeyFile, senderKeyPassword, property, seller, buyer, price));
    })
    ipcMain.on('search', (event, property, anyParty, seller, buyer, minPrice, maxPrice, startDate, endDate) => {
      event.reply('searchDone', this.search(property, anyParty, seller, buyer, minPrice, maxPrice, startDate, endDate));
    })
  }

  getLastBlocksOffset(offset, count) {
    let start = offset+1 - count;
    let end = offset+1;
    if (start < 0) {
      start = 0;
    }
    // console.log(start, end);
    return { chain: this.blockchain.slice(start, end).reverse(), height: this.getHeight() };
  }

  setConnectionHandler(connectionHandler) {
    this.connectionHandler = connectionHandler;
  }

  init() {
    // const tx = this.transactionHelper.createTransaction('nodata');
    // this.sendTransaction(tx);
    setInterval(() => this.updateChain(), 2000);
    // setInterval(() => this.addNewBlockFromPendingTransactions(), 3000);
    // setInterval(() => // console.log(this.getPendingTransactions()), 1000);
  }

  createAndSendTransaction(senderKeyFile, senderKeyPassword, property, seller, buyer, price) {
    let data = {property, seller, buyer, price};
    let transaction = this.transactionHelper.createTransaction(senderKeyFile, senderKeyPassword, data);
    let isValid = this.transactionHelper.isTransactionValid(this.senders, this.getAllTransactions(), transaction);
    if (isValid) {
      this.sendTransaction(transaction);
    }
    return isValid;
  }

  search(property, anyParty, seller, buyer, minPrice, maxPrice, startDate, endDate) {
    let transactions = [];
    for (let i = 1; i < this.blockchain.length; i += 1) {
      this.blockchain[i].transactions.forEach(transaction => {
        if (!(transaction.data.price <= maxPrice || maxPrice == '')) return;
        if (!(transaction.data.price >= minPrice || minPrice == '')) return;
        if (!(transaction.data.property == property || property == '')) return;
        if (!(this.blockchain[i].time <= endDate || endDate == '')) return;
        if (!(this.blockchain[i].time >= startDate || startDate == '')) return;
        if (!(transaction.data.seller == seller || seller == '')) return;
        if (!(transaction.data.buyer == buyer || buyer == '')) return;
        if (!(transaction.data.buyer == anyParty || transaction.data.seller == anyParty || anyParty == '')) return;
        transaction.time = this.blockchain[i].time;
        transactions.push(transaction);
      });
    }
    return transactions.reverse();
  }

  isBlockValid(block) {
    return this.blockHelper.isBlockValid(
      this.senders,
      this.getAllTransactions(),
      this.validators,
      this.getLastBlock(),
      block,
    );
  }

  addNewBlockFromPendingTransactions() {
    const block = this.createNewBlockFromPendingTransactions();
    if (block) {
      this.addNewBlock(block, this.blockchain.length);
    }
  }

  getAllTransactions() {
    let transactions = [];
    for (let i = 1; i < this.blockchain.length; i += 1) {
      transactions = transactions.concat(this.blockchain[i].transactions);
    }
    return transactions;
  }

  getSenders() {
    return this.senders;
  }

  createNewBlockFromPendingTransactions() {
    return this.blockHelper.createBlockIfTime(
      this.senders,
      this.getAllTransactions(),
      this.validators,
      this.getLastBlock(),
      this.getPendingTransactions(),
    );
  }

  sendTransaction(transaction) {
    this.connectionHandler.sendTransaction(transaction);
  }

  getPendingTransactions() {
    return this.connectionHandler.getPendingTransactions();
  }

  setValidators() {
    this.validators = [];
    if (BlockHelper.isBlockHashValid(this.blockchain[0])) {
      this.blockchain[0].transactions[0].data.validators.forEach((validator) => {
        this.validators.push(validator);
      });
    }
  }

  setSenders() {
    this.senders = [];
    if (BlockHelper.isBlockHashValid(this.blockchain[0])) {
      this.blockchain[0].transactions[0].data.senders.forEach((sender) => {
        this.senders.push(sender);
      });
    }
  }

  getLastBlock() {
    return this.blockchain[this.blockchain.length - 1];
  }

  async updateChain() {
    // console.log('Updating chain');
    const maxNode = await this.connectionHandler.getHighestNode();
    if (maxNode === null) {
      // console.log('No nodes available');
      return;
    }

    if (this.getHeight() >= maxNode.height) {
      // console.log('Blockhain is already updated');
      return;
    }

    for (let i = this.blockchain.length; i <= maxNode.height; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const newBlock = await ConnectionHandler.getNewBlock(maxNode, i);
      // console.log(newBlock);
      if (newBlock === null) {
        this.updateChain();
        return;
      }
      if (!this.isBlockValid(newBlock)) {
        this.connectionHandler.addBadNode(maxNode);
        this.updateChain();
        // console.log('Block is invalid');
        return;
      }
      this.addNewBlock(newBlock, i);
    }
  }

  /* const newBlocks = await this.connectionHandler.getNewBlocks(this.getHeight());
    if (newBlocks === null) {
      return;
    }
    newBlocks.forEach((block) => {
      if (!this.isBlockValid(block)) {
        // console.log('Block is invalid');
        return;
      }
      this.addNewBlock(block);
    }); */
  // // console.log('Chain:');
  // // console.log(this.blockchain);

  addNewBlock(block, height) {
    this.connectionHandler.removePendingTransactions(block.transactions);
    this.blockchain[height] = block;
    this.electronApp.updateChain(this.getLastBlocks(5));
    // console.log('New block:');
    // console.log(JSON.stringify(block));
    //// console.log('Chain:');
    //// console.log(this.blockchain);
    this.saveChain();
  }

  getLastBlocks(count) {
    return { chain: this.blockchain.slice(this.blockchain.length - count, this.blockchain.length+1).reverse(), height: this.getHeight() };
  }

  loadBlockchainFromFile() {
    this.blockchain = JSON.parse(fs.readFileSync(this.blockchainFile));
  }

  saveChain() {
    // console.log('Saving chain');
    fs.writeFileSync(this.blockchainFile, JSON.stringify(this.blockchain));
    // console.log('Chain saved');
  }

  getBlocks(startBlock, endBlock) {
    return this.blockchain.slice(startBlock, endBlock + 1);
  }

  getBlock(blockHeight) {
    return this.blockchain[blockHeight];
  }

  getHeight() {
    return this.blockchain.length - 1;
  }
};
