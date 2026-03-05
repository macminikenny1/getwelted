#!/usr/bin/env node
/**
 * One-time migration script: Convert HEIC images stored with .jpg extension
 * in Supabase Storage to actual JPEG format.
 *
 * Usage: node scripts/migrate-heic.mjs
 */

import convert from 'heic-convert';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://phqptdqwkysrrghexkah.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY env var');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BUCKET = 'post-images';
const USER_FOLDER = '589b3ce7-fee9-4d9d-8730-8876106d4c8e';

// Files confirmed as HEIC via magic byte check
const HEIC_FILES = [
  '1772385191415.jpg',
  '1772385191593.jpg',
  '1772385191826.jpg',
  '1772385258652.jpg',
  '1772385258767.jpg',
  '1772385267783.jpg',
  '1772385279296.jpg',
  '1772385396401.jpg',
  '1772385397651.jpg',
  '1772385398779.jpg',
  '1772386291212.jpg',
  '1772386292332.jpg',
  '1772386293463.jpg',
  '1772386524261.jpg',
  '1772386525531.jpg',
  '1772386526533.jpg',
];

async function convertFile(filename) {
  const path = `${USER_FOLDER}/${filename}`;
  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;

  // Download
  console.log(`  Downloading ${filename}...`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  ✗ Failed to download: ${res.status}`);
    return false;
  }
  const heicBuffer = Buffer.from(await res.arrayBuffer());
  console.log(`  Downloaded ${(heicBuffer.length / 1024 / 1024).toFixed(1)}MB`);

  // Convert HEIC → JPEG using heic-convert (pure JS, no native deps)
  console.log(`  Converting to JPEG...`);
  const jpegResult = await convert({
    buffer: new Uint8Array(heicBuffer),
    format: 'JPEG',
    quality: 0.85,
  });
  const jpegBuffer = Buffer.from(jpegResult);
  console.log(`  Converted: ${(heicBuffer.length / 1024).toFixed(0)}KB → ${(jpegBuffer.length / 1024).toFixed(0)}KB`);

  // Re-upload with upsert to replace the HEIC file
  console.log(`  Uploading...`);
  const { error } = await supabase.storage
    .from(BUCKET)
    .update(path, jpegBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.error(`  ✗ Upload failed: ${error.message}`);
    return false;
  }

  console.log(`  ✓ Done`);
  return true;
}

async function main() {
  console.log(`\nMigrating ${HEIC_FILES.length} HEIC files to JPEG...\n`);

  let success = 0;
  let failed = 0;

  for (const file of HEIC_FILES) {
    console.log(`[${success + failed + 1}/${HEIC_FILES.length}] ${file}`);
    try {
      const ok = await convertFile(file);
      if (ok) success++;
      else failed++;
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
      failed++;
    }
    console.log('');
  }

  console.log(`\nDone: ${success} converted, ${failed} failed\n`);
}

main();
