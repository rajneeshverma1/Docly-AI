/**
 * Verify content hash behavior: deterministic, different inputs => different hashes.
 * Run: npx tsx scripts/verify-hash.ts
 */

import { computeContentHash } from '../lib/hash';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// SHA-256 hex string length
const SHA256_HEX_LENGTH = 64;
const HEX_REGEX = /^[a-f0-9]+$/;

console.log('Verifying content hash...\n');

// 1. Same input => same hash (deterministic)
const buf1 = Buffer.from('hello world');
const hash1a = computeContentHash(buf1);
const hash1b = computeContentHash(buf1);
assert(hash1a === hash1b, 'Same buffer should produce the same hash');
console.log('✓ Same buffer produces the same hash');

// 2. Different input => different hash
const buf2 = Buffer.from('hello world!');
const hash2 = computeContentHash(buf2);
assert(hash1a !== hash2, 'Different buffers should produce different hashes');
console.log('✓ Different buffers produce different hashes');

// 3. Hash format: 64 hex chars (SHA-256)
assert(
  hash1a.length === SHA256_HEX_LENGTH && HEX_REGEX.test(hash1a),
  'Hash should be 64 lowercase hex characters'
);
console.log('✓ Hash format is 64 hex characters (SHA-256)');

// 4. Empty buffer => consistent hash
const emptyHash = computeContentHash(Buffer.alloc(0));
assert(
  computeContentHash(Buffer.alloc(0)) === emptyHash,
  'Empty buffer should be deterministic'
);
console.log('✓ Empty buffer produces consistent hash');

// 5. Order matters: "ab" vs "ba"
const hashAb = computeContentHash(Buffer.from('ab'));
const hashBa = computeContentHash(Buffer.from('ba'));
assert(hashAb !== hashBa, 'Byte order must affect hash');
console.log('✓ Byte order affects hash (no accidental collision)');

console.log('\nAll checks passed. Content hash is working correctly.');
console.log('\nExample: upload the same PDF twice in the app; the second response should have duplicate: true.\n');
