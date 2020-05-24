const EdDSA = require('elliptic').eddsa;
const EC = require('elliptic').ec;
const rsa = require('node-forge').pki.rsa;
const sha256 = require('node-forge').md.sha256;
const crypto = require('crypto');
const message = crypto.randomBytes(1024);

const eddsa = new EdDSA('ed25519');

const eddsaKey = eddsa.keyFromSecret(crypto.randomBytes(16));
const eddsaSign = eddsaKey.sign(message);

console.time('EdDSA');
for (let i = 0; i < 1000; i++) {
  eddsaKey.verify(message, eddsaSign);
}
console.timeEnd('EdDSA');

const rsaKey = rsa.generateKeyPair({bits: 3072, e: 0x10001});
const md = sha256.create();
const rsaSign = rsaKey.privateKey.sign(md);


console.time('RSA');
for (let i = 0; i < 1000; i++) {
  md.update(message, 'raw');
  rsaKey.publicKey.verify(md.digest().bytes(), rsaSign);
}
console.timeEnd('RSA');

const ec = new EC('secp256k1');
const ecKey = ec.genKeyPair();
const ecSign = ecKey.sign(message);

console.time('secp256k1');
for (let i = 0; i < 1000; i++) {
  ecKey.verify(message, ecSign);
}
console.timeEnd('secp256k1');