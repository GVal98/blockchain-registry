const EdDSA = require('elliptic').eddsa;
const CryptoJS = require("crypto-js");
const crypto = require('crypto');
const fs = require('fs');
const read = require('read');

exports.Keygen = class Keygen {
  createNewKey() {
    read({prompt: 'Enter new password:', silent: true, replace: '*'}, (error, password) => {
      read({prompt: 'Repeat password:', silent: true, replace: '*'}, (error, password2) => {
        if (password === password2) {
          const privateKeyFile = `${process.argv[3]}.key`;
          const eddsa = new EdDSA('ed25519');
          const key = eddsa.keyFromSecret(crypto.randomBytes(16));
          const publicKey = key.getPublic('hex');
          const privateKey = key.getSecret('hex');
          console.log(`Your public key: ${publicKey}`);
          const privateKeyEncrypted = CryptoJS.AES.encrypt(privateKey, password).toString();
          fs.writeFileSync(privateKeyFile, privateKeyEncrypted);
          console.log(`Your password encrypted private key saved to ${privateKeyFile}`);
        }
        else {
          console.log('Error: Password missmatch');
          this.createNewKey();
        }
      })
    })
    
  }
}