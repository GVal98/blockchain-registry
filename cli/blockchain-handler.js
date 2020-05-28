const fs = require('fs');
const { BlockHelper } = require('./block-helper');
const { ConnectionHandler } = require('./connection-handler');

exports.BlockchainHandler = class BlockchainHandler {
  constructor(transactionHelper, blockHelper) {
    this.transactionHelper = transactionHelper;
    this.blockHelper = blockHelper;
    this.loadBlockchainFromFile();
    this.setValidators();
    this.setSenders();
  }

  setConnectionHandler(connectionHandler) {
    this.connectionHandler = connectionHandler;
  }

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  init() {
    setInterval(() => this.updateChain(), 500);
    setInterval(() => this.newTestTransaction(), 2000);
    if (this.blockHelper.getValidatorPublicKey() != null) {
      console.log('VALIDATION STARTED');
      setInterval(() => this.addNewBlockFromPendingTransactions(), 3000);
    }
  }

  search(property, anyParty, seller, buyer, minPrice, maxPrice, startDate, endDate) {
    let transactions = [];
    //console.log(property, anyParty, seller, buyer, minPrice, maxPrice, startDate, endDate);
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

  newTestTransaction() {
    const tx = this.transactionHelper.createTransaction({
      property: `${this.getRandomInt(40, 47)}:${this.getRandomInt(10, 14)}:${this.getRandomInt(100000, 120000)}:${this.getRandomInt(800, 814)}`,
      seller: this.getRandomInt(7707083893, 7710140679),
      buyer: this.getRandomInt(7707083893, 7710140679),
      price: this.getRandomInt(1000000, 10000000)
    });
    this.sendTransaction(tx);
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
    console.log('New block:');
    console.log(JSON.stringify(block));
    //console.log('Chain:');
    //console.log(JSON.stringify(this.blockchain));
    this.saveChain();
  }

  saveChain() {
    console.log('Saving chain');
    fs.writeFileSync(BlockchainHandler.getBlockchainFile(), JSON.stringify(this.blockchain));
    console.log('Chain saved');
  }

  static getBlockchainFile() {
    return process.argv[5];
  }

  loadBlockchainFromFile() {
    this.blockchain = JSON.parse(fs.readFileSync(BlockchainHandler.getBlockchainFile()));
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
