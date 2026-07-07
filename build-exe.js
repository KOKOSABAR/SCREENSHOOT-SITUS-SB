const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('       AUTO SCREENSHOT DASHBOARD EXE BUILDER        ');
console.log('====================================================');

// Install pkg locally if not present
try {
  console.log('[1/3] Installing compiler (pkg)...');
  execSync('npm install -g pkg --silent', { stdio: 'inherit' });
} catch (e) {
  console.log('[INFO] Retrying local installation of pkg...');
  execSync('npm install pkg --save-dev --silent', { stdio: 'inherit' });
}

// Modify server.js to automatically open browser on launch when compiled
console.log('[2/3] Preparing build configurations...');

// Run pkg build
try {
  console.log('[3/3] Compiling application into Windows executable (.exe)...');
  console.log('Please wait, bundling assets...');
  
  // Package for windows target
  execSync('npx pkg . --targets node18-win-x64 --output "Auto-Screenshot-Dashboard.exe"', { stdio: 'inherit' });
  
  console.log('\n====================================================');
  console.log(' SUCCESS: Executable created successfully!');
  console.log(' Filename: Auto-Screenshot-Dashboard.exe');
  console.log('====================================================');
} catch (err) {
  console.error('\n[ERROR] Compilation failed:', err.message);
}
