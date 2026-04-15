/**
 * Runs a SQL migration file directly against the Supabase Postgres database.
 *
 * Requires DATABASE_URL in .env.local (obtain from Supabase Dashboard →
 * Settings → Database → Connection string → URI mode).
 * The URL looks like: postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
 *
 * Usage:
 *   node scripts/run-migration.mjs supabase/migrations/20260415_rbac.sql
 *   npm run migrate supabase/migrations/20260415_rbac.sql
 */

import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// Load .env.local manually (dotenv may not be installed)
function loadEnv() {
  const envPath = resolve(projectRoot, '.env.local');
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const require = createRequire(import.meta.url);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error(`
ERROR: DATABASE_URL is not set.

Add it to .env.local:
  DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres

Get your database password from:
  Supabase Dashboard → Settings → Database → Database password
  (or Connection string → URI)
`);
  process.exit(1);
}

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('Usage: node scripts/run-migration.mjs <path/to/migration.sql>');
  process.exit(1);
}

const sqlPath = resolve(projectRoot, sqlFile);
if (!existsSync(sqlPath)) {
  console.error(`SQL file not found: ${sqlPath}`);
  process.exit(1);
}

const sql = readFileSync(sqlPath, 'utf-8');

console.log(`Running migration: ${sqlFile}`);
console.log(`Database: ${DATABASE_URL.replace(/:([^:@]+)@/, ':***@')}\n`);

let pg;
try {
  pg = require('pg');
} catch {
  console.error('pg package not found. Run: npm install pg --save-dev');
  process.exit(1);
}

const { Client } = pg;
const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log('Connected. Executing SQL...\n');
  await client.query(sql);
  console.log('Migration applied successfully.');

  // Quick verification query
  try {
    const res = await client.query(
      `SELECT id, user_id, display_name, role FROM reviewer_profiles ORDER BY display_name`
    );
    if (res.rows.length) {
      console.log('\nreviewer_profiles (post-migration):');
      console.table(res.rows);
    }
  } catch {
    // Table may not have role column yet if migration failed partway
  }
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
