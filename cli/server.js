const express = require('express');
const cors = require('cors');
const forge = require('node-forge');
const https = require('https');

exports.Server = class Server {
  constructor(blockchainHandler, connectionHandler) {
    this.blockchainHandler = blockchainHandler;
    this.connectionHandler = connectionHandler;
    this.setIP();
    this.setPort();
    this.server = express();
    this.certs = this.generateCerts();
    this.server.use(express.json());
    this.server.use(cors());
    this.addRoutes();
    this.addWeb();
  }

  start() {
    return new Promise((resolve) => {
      https.createServer(this.certs, this.server)
        .listen(this.port)
        .on('listening', resolve);
    });
  }

  addWeb() {
    this.server.use(express.static(__dirname + '/web/'));
    this.server.get('/web', (request, response) => response.sendFile(__dirname + '/web/index.html'));
  }

  addRoute(route, func) {
    this.server.post(route, (request, response) => Server.handleRequest(
      response,
      request,
      func,
    ));
  }

  static handleRequest(response, request, func) {
    response.send({ result: func(request.body) });
  }

  addRoutes() {
    this.addRoute('/getNodes', (json) => this.getNodes(json));
    this.addRoute('/getBlocks', (json) => this.getBlocks(json));
    this.addRoute('/getBlock', (json) => this.getBlock(json));
    this.addRoute('/sendTransaction', (json) => this.connectionHandler.getNewTransaction(json));
    this.addRoute('/getPendingTransactions', () => this.getPendingTransactions());
    this.addRoute('/search', (json) => this.search(json));
  }

  getBlocks(json) {
    return this.blockchainHandler.getBlocks(json.startBlock, json.endBlock);
  }

  search(json) {
    return { transactions: this.blockchainHandler.search(...Object.values(json)) };
  }

  getBlock(json) {
    return this.blockchainHandler.getBlock(json.blockHeight);
  }

  getNodes(json) {
    return {
      height: this.blockchainHandler.getHeight(),
      pendingTransactions: this.connectionHandler.getPendingTransactions(),
      nodes: this.connectionHandler.getNodes(json),
    };
  }

  getPendingTransactions() {
    return {
      height: this.blockchainHandler.getHeight(),
      pendingTransactions: this.connectionHandler.getPendingTransactions(),
    };
  }

  setPort() {
    [, , , this.port] = process.argv;
  }

  setIP() {
    [, , this.ip] = process.argv;
  }

  generateCerts() {
    var pki = forge.pki;
    var keys = pki.rsa.generateKeyPair(2048);
    var cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
    var attrs = [{
      name: 'commonName',
      value: 'example.org'
    }, {
      name: 'countryName',
      value: 'US'
    }, {
      shortName: 'ST',
      value: 'Virginia'
    }, {
      name: 'localityName',
      value: 'Blacksburg'
    }, {
      name: 'organizationName',
      value: 'Test'
    }, {
      shortName: 'OU',
      value: 'Test'
    }];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([{
      name: 'basicConstraints',
      cA: true
    }, {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    }, {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      emailProtection: true,
      timeStamping: true
    }, {
      name: 'nsCertType',
      client: true,
      server: true,
      email: true,
      objsign: true,
      sslCA: true,
      emailCA: true,
      objCA: true
    }, {
      name: 'subjectAltName',
      altNames: [{
        type: 6, // URI
        value: 'http://example.org/webid#me'
      }, {
        type: 7, // IP
        ip: '127.0.0.1'
      }]
    }, {
      name: 'subjectKeyIdentifier'
    }]);
    cert.sign(keys.privateKey);
 
  var result = {cert: pki.certificateToPem(cert), key: pki.privateKeyToPem(keys.privateKey)};
  return (result)
  }
};
