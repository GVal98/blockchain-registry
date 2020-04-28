exports.Server = class Server {
  constructor(blockchainHandler, connectionHandler) {
    this.blockchainHandler = blockchainHandler;
    this.connectionHandler = connectionHandler;
  }

  getHeight() {
    return this.blockchainHandler.getHeight();
  }

  getNodes() {
    return this.connectionHandler.getNodes();
  }
};
