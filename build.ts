#!/usr/bin/env node

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🌟 Building grok-code terminal agent...');

// Step 1: Type check with bun
console.log('📝 Type checking...');
try {
  execSync('bunx tsc --noEmit', { cwd: __dirname, stdio: 'inherit' });
  console.log('✅ Type check passed');
} catch (error) {
  console.error('❌ Type check failed');
  process.exit(1);
}

// Step 2: Bundle into single executable
console.log('🔗 Bundling executable...');
try {
  execSync('bun build --compile --target bun index.ts --outfile grok-code-fast', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  console.log('✅ Build complete: grok-code-fast executable created');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

console.log('🎉 Build successful! Run with: ./grok-code-fast');

// Optional: Create npm-compatible package.json for publishing
console.log('📦 Preparing for publishing...');
try {
  // Create dist directory if it doesn't exist
  mkdirSync(join(__dirname, 'dist'), { recursive: true });

  // Copy package.json and modify for publishing
  const pkgContent = readFileSync(join(__dirname, 'package.json'), 'utf-8');
  const pkg = JSON.parse(pkgContent);

  // Ensure executable is available
  if (!pkg.bin) {
    pkg.bin = {};
  }
  pkg.bin['grok-code-fast'] = './index.ts';

  writeFileSync(join(__dirname, 'dist', 'package.json'), JSON.stringify(pkg, null, 2));
  console.log('✅ Package prepared for publishing');
} catch (error) {
  console.warn('⚠️  Package preparation skipped (expected in some environments)');
}
