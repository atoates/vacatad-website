#!/usr/bin/env node
/**
 * VOA Data Importer — bulk import list entries into Turso
 *
 * Usage:
 *   node import-voa.js <list-entries.csv> [--delete-missing]
 *
 * The CSV should be a * delimited VOA list entries file (epoch or update).
 * Processes rows in batches of 100 via the Turso HTTP API.
 *
 * Environment variables:
 *   TURSO_URL   — e.g. https://voa-combined-atoates.aws-eu-west-1.turso.io
 *   TURSO_TOKEN — your Turso auth token
 *
 * You can also create a .env file in this directory.
 */

const fs = require('fs');
const path = require('path');

// Load .env if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const match = line.match(/^(\w+)\s*=\s*(.+)/);
    if (match) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
  });
}

const TURSO_URL = process.env.TURSO_URL;
const TURSO_TOKEN = process.env.TURSO_TOKEN;
const BATCH_SIZE = 100;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('Missing TURSO_URL or TURSO_TOKEN. Set them in environment or .env file.');
  process.exit(1);
}

const csvFile = process.argv[2];
if (!csvFile) {
  console.error('Usage: node import-voa.js <list-entries.csv>');
  process.exit(1);
}

async function tursoPipeline(statements) {
  const requests = statements.map(s => ({ type: 'execute', stmt: { sql: s.sql, args: s.args } }));
  requests.push({ type: 'close' });

  const res = await fetch(`${TURSO_URL}/v2/pipeline`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TURSO_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Turso API error: ${res.status} — ${body}`);
  }

  return res.json();
}

function parseLine(line) {
  const f = line.split('*');
  if (f.length < 16) return null;

  const changeType = (f[15] || '').trim().toUpperCase();
  const uarn = (f[3] || '').trim();
  if (!uarn) return null;

  return {
    changeType,
    uarn,
    full_address: (f[4] || '').trim(),
    postcode: (f[5] || '').trim(),
    description_code: (f[6] || '').trim(),
    description_text: (f[7] || '').trim(),
    ba_code: (f[0] || '').trim(),
    rv_2026: parseInt(f[8]) || 0,
  };
}

async function main() {
  console.log(`Reading ${csvFile}...`);
  const text = fs.readFileSync(csvFile, 'utf8');
  const lines = text.split('\n').filter(l => l.trim());
  console.log(`${lines.length} lines found.`);

  const upserts = [];
  const deletes = [];

  for (const line of lines) {
    const row = parseLine(line);
    if (!row) continue;

    if (row.changeType.includes('DELETION')) {
      deletes.push(row.uarn);
    } else {
      upserts.push(row);
    }
  }

  console.log(`${upserts.length} to upsert, ${deletes.length} to delete.`);

  // Process upserts
  let upserted = 0;
  for (let i = 0; i < upserts.length; i += BATCH_SIZE) {
    const batch = upserts.slice(i, i + BATCH_SIZE);
    const statements = batch.map(r => ({
      sql: `INSERT INTO properties (uarn, full_address, description_code, description_text, firm_name, postcode, ba_code, rv_2023, rv_2026)
            VALUES (?, ?, ?, ?, '', ?, ?, 0, ?)
            ON CONFLICT(uarn) DO UPDATE SET
              full_address = excluded.full_address,
              description_code = excluded.description_code,
              description_text = excluded.description_text,
              postcode = excluded.postcode,
              ba_code = excluded.ba_code,
              rv_2026 = CASE WHEN excluded.rv_2026 > 0 THEN excluded.rv_2026 ELSE properties.rv_2026 END`,
      args: [
        { type: 'text', value: r.uarn },
        { type: 'text', value: r.full_address },
        { type: 'text', value: r.description_code },
        { type: 'text', value: r.description_text },
        { type: 'text', value: r.postcode },
        { type: 'text', value: r.ba_code },
        { type: 'text', value: String(r.rv_2026) },
      ],
    }));

    try {
      await tursoPipeline(statements);
      upserted += batch.length;
      process.stdout.write(`\rUpserted: ${upserted}/${upserts.length}`);
    } catch (err) {
      console.error(`\nBatch error at row ${i}: ${err.message}`);
    }
  }
  console.log();

  // Process deletes
  let deleted = 0;
  for (let i = 0; i < deletes.length; i += BATCH_SIZE) {
    const batch = deletes.slice(i, i + BATCH_SIZE);
    const statements = batch.map(uarn => ({
      sql: `DELETE FROM properties WHERE uarn = ?`,
      args: [{ type: 'text', value: uarn }],
    }));

    try {
      await tursoPipeline(statements);
      deleted += batch.length;
      process.stdout.write(`\rDeleted: ${deleted}/${deletes.length}`);
    } catch (err) {
      console.error(`\nDelete batch error at row ${i}: ${err.message}`);
    }
  }
  if (deletes.length) console.log();

  console.log(`\nDone! Upserted: ${upserted}, Deleted: ${deleted}`);
}

main().catch(err => { console.error(err); process.exit(1); });
