#!/usr/bin/env node

/**
 * Load .env file and run MonieCredit test
 * This script properly handles complex .env values
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read and parse .env file
const envPath = path.join(__dirname, '../.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

// Parse .env and set environment variables
envLines.forEach(line => {
  line = line.trim();
  
  // Skip comments and empty lines
  if (!line || line.startsWith('#')) return;
  
  // Find the first = sign
  const equalIndex = line.indexOf('=');
  if (equalIndex === -1) return;
  
  const key = line.substring(0, equalIndex).trim();
  let value = line.substring(equalIndex + 1).trim();
  
  // Remove quotes if present
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  
  process.env[key] = value;
});

console.log('✅ Environment variables loaded from .env');
console.log('');

// Run the test script
try {
  execSync('npx tsx scripts/test-monicredit-banks.ts', {
    stdio: 'inherit',
    env: process.env
  });
} catch (error) {
  process.exit(error.status || 1);
}
