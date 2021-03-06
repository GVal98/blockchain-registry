const needle = require('needle');
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
exports.Request = class Request {
  static send(node, func, data) {
    return new Promise((resolve) => {
      needle.post(
        Request.getURL(node, func),
        data,
        { open_timeout: 1000, json: true },
        (error, response) => {
          if (error) {
            return resolve(null);
          }
          return resolve(response.body);
        },
      );
    });
  }

  static getURL(node, func) {
    return `https://${node.ip}:${node.port}/${func}`;
  }

  static getNodes(node, thisNode) {
    return Request.send(node, 'getNodes', thisNode);
  }

  static sendTransaction(node, transaction) {
    return Request.send(node, 'sendTransaction', transaction);
  }

  static getPendingTransactions(node) {
    return Request.send(node, 'getPendingTransactions');
  }

  static getHeight(node) {
    return Request.send(node, 'getHeight');
  }

  static getBlock(node, blockHeight) {
    return Request.send(node, 'getBlock', { blockHeight });
  }

  static getBlocks(node, startBlock, endBlock) {
    return Request.send(node, 'getBlocks', { startBlock, endBlock });
  }
};
