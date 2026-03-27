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
const { execSync } = require('child_process');

const ENV_FILE = path.join(__dirname, '../.env');
const KEYS_DIR = path.join(__dirname, '../.keys');

console.log('\n🔐 EventHub JWT Key Pair Generator\n');
console.log('=' .repeat(50));

try {
  // Create .keys directory if it doesn't exist
  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
  }

  const privateKeyPath = path.join(KEYS_DIR, 'private.pem');
  const publicKeyPath = path.join(KEYS_DIR, 'public.pem');

  // Generate private key
  console.log('\n📝 Generating RSA private key...');
  execSync(
    `openssl genrsa -out "${privateKeyPath}" 2048`,
    { stdio: 'inherit' }
  );
  console.log('✅ Private key generated');

  // Generate public key from private key
  console.log('\n📝 Generating RSA public key from private key...');
  execSync(
    `openssl rsa -in "${privateKeyPath}" -pubout -out "${publicKeyPath}"`,
    { stdio: 'inherit' }
  );
  console.log('✅ Public key generated');

  // Read the keys
  const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');
  const publicKey = fs.readFileSync(publicKeyPath, 'utf-8');

  // Escape the keys for use in .env (handle newlines)
  const privateKeyEnv = privateKey.replace(/\n/g, '\\n');
  const publicKeyEnv = publicKey.replace(/\n/g, '\\n');

  // Check if .env exists and update it
  if (fs.existsSync(ENV_FILE)) {
    let envContent = fs.readFileSync(ENV_FILE, 'utf-8');

    // Remove existing keys if present
    envContent = envContent.replace(/JWT_PRIVATE_KEY=.*/s, '');
    envContent = envContent.replace(/JWT_PUBLIC_KEY=.*/s, '');

    // Add new keys
    envContent += `\n# JWT Keys (generated $(date))\n`;
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
  console.error('\n💡 Make sure you have OpenSSL installed:');
  console.error('   macOS: brew install openssl');
  console.error('   Linux: sudo apt-get install openssl');
  console.error('   Windows: Download from https://slproweb.com/products/Win32OpenSSL.html\n');
  process.exit(1);
}
