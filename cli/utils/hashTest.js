const crypto = require('crypto');
const SHA256 = require('crypto-js/sha256');
const SHA384 = require('crypto-js/sha384');
const SHA512 = require('crypto-js/sha512');

console.time('SHA256');
for (let i = 0; i < 1000000; i++) {
  SHA256(crypto.randomBytes(1024));
}
console.timeEnd('SHA256');

console.time('SHA384');
for (let i = 0; i < 1000000; i++) {
  SHA384(crypto.randomBytes(1024));
}
console.timeEnd('SHA384');

console.time('SHA512');
for (let i = 0; i < 1000000; i++) {
  SHA512(crypto.randomBytes(1024));
}
console.timeEnd('SHA512');