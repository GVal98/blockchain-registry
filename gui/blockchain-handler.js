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
    this.electronApp.updateChain(this.blockchain);
    this.setValidators();
    this.setSenders();
    ipcMain.on('windowReady', (event) => {
      event.reply('newBlock', this.blockchain);
    })
  }

  setConnectionHandler(connectionHandler) {
    this.connectionHandler = connectionHandler;
  }

  init() {
    // const tx = this.transactionHelper.createTransaction('nodata');
    // this.sendTransaction(tx);
    setInterval(() => this.updateChain(), 2000);
    // setInterval(() => this.addNewBlockFromPendingTransactions(), 3000);
    // setInterval(() => console.log(this.getPendingTransactions()), 1000);
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
    console.log('Updating chain');
    const maxNode = await this.connectionHandler.getHighestNode();
    if (maxNode === null) {
      console.log('No nodes available');
      return;
    }

    if (this.getHeight() >= maxNode.height) {
      console.log('Blockhain is already updated');
      return;
    }

    for (let i = this.blockchain.length; i <= maxNode.height; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const newBlock = await ConnectionHandler.getNewBlock(maxNode, i);
      console.log(newBlock);
      if (newBlock === null) {
        this.updateChain();
        return;
      }
      if (!this.isBlockValid(newBlock)) {
        this.connectionHandler.addBadNode(maxNode);
        this.updateChain();
        console.log('Block is invalid');
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
        console.log('Block is invalid');
        return;
      }
      this.addNewBlock(block);
    }); */
  // console.log('Chain:');
  // console.log(this.blockchain);

  addNewBlock(block, height) {
    this.connectionHandler.removePendingTransactions(block.transactions);
    this.blockchain[height] = block;
    this.electronApp.updateChain(this.blockchain);
    console.log('New block:');
    console.log(JSON.stringify(block));
    console.log('Chain:');
    console.log(this.blockchain);
  }

  loadBlockchainFromFile() {
    this.blockchain = JSON.parse(fs.readFileSync(this.blockchainFile));
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
