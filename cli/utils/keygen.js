const EdDSA = require('elliptic').eddsa;
const crypto = require('crypto');
const fs = require('fs');

class KeyGen {
  static createNewKey() {
    const privateKeyFile = process.argv[2];
    const eddsa = new EdDSA('ed25519');
    const key = eddsa.keyFromSecret(crypto.randomBytes(16));
    const publicKey = key.getPublic('hex');
    const privateKey = key.getSecret('hex');
    console.log(`Your public key: ${publicKey}`);
    fs.writeFileSync(privateKeyFile, privateKey);
    console.log(`Your private saved to ${privateKeyFile}`);
  }
}

KeyGen.createNewKey();
