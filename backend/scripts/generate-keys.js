#!/usr/bin/env node

/**
 * Generate RS256 Key Pair for JWT Authentication
 * 
 * Usage:
 *   node scripts/generate-keys.js
 * 
 * This generates public and private keys for JWT signing/verification.
 * The keys will be added to your .env file automatically.
 * 
 * ⚠️ IMPORTANT: Run this ONCE in development and store keys securely in .env
 * Do NOT commit private keys to git.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENV_FILE = path.join(__dirname, '../.env');
const KEYS_DIR = path.join(__dirname, '../.keys');

console.log('\n🔐 EventHub JWT Key Pair Generator\n');
console.log('='.repeat(50));

try {
  // Create .keys directory if it doesn't exist
  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
  }

  const privateKeyPath = path.join(KEYS_DIR, 'private.pem');
  const publicKeyPath = path.join(KEYS_DIR, 'public.pem');

  // Generate private key
  console.log('\n📝 Generating RSA private key...');
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  console.log('✅ Private key generated');

  // Write keys to files
  console.log('\n📝 Writing keys to files...');
  fs.writeFileSync(privateKeyPath, privateKey);
  fs.writeFileSync(publicKeyPath, publicKey);
  console.log('✅ Public key generated');

  // Prepare keys for .env (escape newlines)
  const privateKeyEnv = privateKey.replace(/\n/g, '\\n');
  const publicKeyEnv = publicKey.replace(/\n/g, '\\n');

  // Check if .env exists and update it
  if (fs.existsSync(ENV_FILE)) {
    let envContent = fs.readFileSync(ENV_FILE, 'utf-8');

    // Remove existing keys if present
    envContent = envContent.replace(/JWT_PRIVATE_KEY=.*/s, '');
    envContent = envContent.replace(/JWT_PUBLIC_KEY=.*/s, '');

    // Add new keys
    const generatedDate = new Date().toISOString();
    envContent += `\n# JWT Keys (generated ${generatedDate})\n`;
    envContent += `JWT_PRIVATE_KEY="${privateKeyEnv}"\n`;
    envContent += `JWT_PUBLIC_KEY="${publicKeyEnv}"\n`;

    fs.writeFileSync(ENV_FILE, envContent);
    console.log('\n✅ Keys added to .env file');
  } else {
    console.log('\n⚠️  .env file not found. Create it with:');
    console.log(`\n    JWT_PRIVATE_KEY="${privateKeyEnv}"\n`);
    console.log(`    JWT_PUBLIC_KEY="${publicKeyEnv}"\n`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n✨ Key generation complete!\n');
  console.log('📌 Keys stored at:');
  console.log(`   Private: ${privateKeyPath}`);
  console.log(`   Public: ${publicKeyPath}`);
  console.log('\n⚠️  DO NOT commit these files or keys to git!');
  console.log('   They are already in .gitignore\n');

} catch (error) {
  console.error('\n❌ Error generating keys:', error.message);
  process.exit(1);
}
