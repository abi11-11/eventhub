const crypto = require('crypto');

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// Escape newlines for env file
const privEscaped = privateKey.replace(/\n/g, '\\n');
const pubEscaped = publicKey.replace(/\n/g, '\\n');

console.log('Add these to your .env file:');
console.log('');
console.log('JWT_PRIVATE_KEY="' + privEscaped + '"');
console.log('');
console.log('JWT_PUBLIC_KEY="' + pubEscaped + '"');
