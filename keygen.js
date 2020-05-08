const EdDSA = require('elliptic').eddsa;
const crypto = require('crypto');

const eddsa = new EdDSA('ed25519');
const keyPair = eddsa.keyFromSecret(crypto.randomBytes(16));
const publicKey = keyPair.getPublic('hex');
const privateKey = keyPair.getSecret('hex');
console.log(`Public key: ${publicKey}`);
console.log(`Private key: ${privateKey}`);
