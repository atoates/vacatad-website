/**
 * VacatAd VOA Property Lookup API — Cloudflare Worker
 *
 * Queries the Turso database for properties by postcode.
 * Returns matching properties with both 2023 and 2026 rateable values.
 *
 * Endpoints:
 *   GET  /api/lookup?postcode=SW1A+1AA
 *   GET  /api/lookup?q=search+term (address search)
 *   POST /api/leads         — capture lead gate submissions (Turso + JotForm)
 *   POST /api/batch-report  — log batch PDF report generation data (Turso)
 *
 * Deploy: wrangler deploy
 *
 * Environment variables needed:
 *   TURSO_URL   — https://voa-combined-atoates.aws-eu-west-1.turso.io
 *   TURSO_TOKEN — your database auth token
 */

// RHL description codes (Retail, Hospitality, Leisure)
const RHL_CODES = new Set([
  'CS',   // Shop
  'CS1',  // Bank
  'CS3',  // Hairdressing salon
  'CS4',  // Kiosk
  'CS7',  // Showroom
  'CS10', // Retail warehouse
  'CL',   // Public house
  'CL2',  // Club
  'CR',   // Restaurant
  'CR1',  // Cafe
  'CH',   // Hotel
  'CH1',  // Self catering holiday unit
  'CH2',  // Guest house
  'LH1',  // Beach hut
  'LC',   // Community centre
  'LC3',  // Hall
  'LS',   // Sports centre
  'LS1',  // Gym / fitness
  'LT',   // Theatre
  'LT1',  // Cinema
]);

// Industrial description codes
const INDUSTRIAL_CODES = new Set([
  'IF',   // Factory
  'IF3',  // Workshop
  'IF4',  // Business unit
  'CW',   // Warehouse
  'CW1',  // Land used for storage
  'CW3',  // Store
  'IG',   // Industrial
]);

// Pub/venue codes (for the additional 15% relief)
const PUB_VENUE_CODES = new Set([
  'CL',   // Public house
  'LT',   // Theatre
]);

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/lookup' || path === '/lookup') {
      return handleLookup(url, env);
    }

    if (path === '/api/leads' || path === '/leads') {
      return handleLeads(request, env);
    }

    if (path === '/api/batch-report' || path === '/batch-report') {
      return handleBatchReport(request, env);
    }

    // Admin endpoints (require GitHub auth)
    if (path === '/api/admin/leads' || path === '/api/admin/batch-reports' || path === '/api/admin/stats') {
      const authError = await validateGitHubAuth(request);
      if (authError) return authError;

      if (path === '/api/admin/leads') return handleAdminLeads(url, env);
      if (path === '/api/admin/batch-reports') return handleAdminBatchReports(url, env);
      if (path === '/api/admin/stats') return handleAdminStats(env);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },
};

async function handleLookup(url, env) {
  const postcode = (url.searchParams.get('postcode') || '').trim().toUpperCase();
  const query = (url.searchParams.get('q') || '').trim().toUpperCase();

  if (!postcode && !query) {
    return jsonResponse({ error: 'Please provide a postcode or search query' }, 400);
  }

  let sql, args;

  if (postcode) {
    // Exact postcode match (normalised)
    // UK postcodes always have a 3-char inward code — strip all spaces then reinsert
    const stripped = postcode.replace(/\s+/g, '');
    const normalised = stripped.length > 3
      ? stripped.slice(0, -3) + ' ' + stripped.slice(-3)
      : stripped;
    sql = `SELECT uarn, full_address, description_code, description_text,
                  firm_name, postcode, ba_code, rv_2023, rv_2026
           FROM properties
           WHERE postcode = ?
             AND (rv_2026 >= 9000 OR rv_2023 >= 9000)
           ORDER BY full_address
           LIMIT 500`;
    args = [{ type: 'text', value: normalised }];
  } else {
    // Address search (partial match)
    sql = `SELECT uarn, full_address, description_code, description_text,
                  firm_name, postcode, rv_2023, rv_2026
           FROM properties
           WHERE full_address LIKE ? OR firm_name LIKE ?
           ORDER BY full_address
           LIMIT 30`;
    const searchTerm = `%${query}%`;
    args = [
      { type: 'text', value: searchTerm },
      { type: 'text', value: searchTerm },
    ];
  }

  try {
    const result = await tursoQuery(env.TURSO_URL, env.TURSO_TOKEN, sql, args);
    const rows = result.results[0].response.result.rows;
    const cols = result.results[0].response.result.cols;

    const properties = rows.map(row => {
      const obj = {};
      cols.forEach((col, i) => {
        obj[col.name] = row[i].type === 'null' ? null : row[i].value;
      });

      // Convert RVs to numbers
      obj.rv_2023 = obj.rv_2023 ? parseInt(obj.rv_2023, 10) : null;
      obj.rv_2026 = obj.rv_2026 ? parseInt(obj.rv_2026, 10) : null;

      // Auto-detect property type
      const code = obj.description_code || '';
      obj.is_rhl = RHL_CODES.has(code);
      obj.is_industrial = INDUSTRIAL_CODES.has(code);
      obj.is_pub_venue = PUB_VENUE_CODES.has(code);

      // Auto-detect London (BA codes 5030–5990 are London boroughs)
      const baNum = parseInt(obj.ba_code, 10) || 0;
      obj.is_london = baNum >= 5030 && baNum <= 5990;

      return obj;
    });

    return jsonResponse({
      count: properties.length,
      postcode: postcode || undefined,
      query: query || undefined,
      properties,
    });
  } catch (err) {
    return jsonResponse({ error: 'Database query failed', detail: err.message }, 500);
  }
}

async function handleLeads(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const name    = (body.name     || '').trim().slice(0, 200);
  const email   = (body.email    || '').trim().slice(0, 200);
  const company = (body.company  || '').trim().slice(0, 200);
  const pageUrl = (body.page_url || '').trim().slice(0, 500);

  if (!name || !email) {
    return jsonResponse({ error: 'Name and email are required' }, 400);
  }

  const createdAt = new Date().toISOString();

  // Split name into first / last for JotForm
  const nameParts = name.split(' ');
  const firstName = nameParts[0];
  const lastName  = nameParts.slice(1).join(' ');

  // Run Turso insert and JotForm submission in parallel
  const [tursoResult, jotformResult] = await Promise.allSettled([
    // 1. Store in Turso
    (async () => {
      await tursoQuery(env.TURSO_URL, env.TURSO_TOKEN, 'CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, page_url TEXT, created_at TEXT NOT NULL)', []);
      await tursoQuery(
        env.TURSO_URL,
        env.TURSO_TOKEN,
        'INSERT INTO leads (name, email, company, page_url, created_at) VALUES (?, ?, ?, ?, ?)',
        [
          { type: 'text', value: name },
          { type: 'text', value: email },
          { type: 'text', value: company },
          { type: 'text', value: pageUrl },
          { type: 'text', value: createdAt },
        ],
      );
    })(),

    // 2. Forward to JotForm EU API
    (async () => {
      if (!env.JOTFORM_API_KEY) return;
      const formData = new URLSearchParams();
      formData.append('submission[3_first]', firstName);
      formData.append('submission[3_last]',  lastName);
      formData.append('submission[4]',        email);
      formData.append('submission[5]',        company);
      const res = await fetch(
        `https://eu-api.jotform.com/form/260856747152060/submissions?apiKey=${env.JOTFORM_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        },
      );
      if (!res.ok) throw new Error(`JotForm API error: ${res.status}`);
    })(),
  ]);

  if (tursoResult.status === 'rejected') {
    return jsonResponse({ error: 'Database error', detail: tursoResult.reason?.message }, 500);
  }

  return jsonResponse({
    success: true,
    jotform: jotformResult.status === 'fulfilled' ? 'ok' : jotformResult.reason?.message,
  });
}

async function handleBatchReport(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const email   = (body.email   || '').trim().slice(0, 200);
  const name    = (body.name    || '').trim().slice(0, 200);
  const company = (body.company || '').trim().slice(0, 200);

  const properties = Array.isArray(body.properties) ? body.properties.slice(0, 200) : [];
  if (properties.length === 0) {
    return jsonResponse({ error: 'No properties provided' }, 400);
  }

  const totalRV   = Number(body.total_rv)   || 0;
  const totalBill = Number(body.total_bill)  || 0;
  const totalNet  = Number(body.total_net)   || 0;
  const createdAt = new Date().toISOString();

  // Serialise properties as JSON text for storage
  const propertiesJson = JSON.stringify(properties.map(p => ({
    address:          (p.address || '').slice(0, 300),
    postcode:         (p.postcode || '').slice(0, 12),
    description_code: (p.description_code || '').slice(0, 10),
    rv_2026:          Number(p.rv_2026) || 0,
    annual_bill:      Number(p.annual_bill) || 0,
    net_saving:       Number(p.net_saving) || 0,
  })));

  try {
    // Create table with quote_number column
    await tursoPipeline(env.TURSO_URL, env.TURSO_TOKEN, [
      {
        sql: `CREATE TABLE IF NOT EXISTS batch_reports (id INTEGER PRIMARY KEY AUTOINCREMENT, quote_number TEXT, email TEXT, name TEXT, company TEXT, property_count INTEGER NOT NULL, properties_json TEXT NOT NULL, total_rv REAL, total_bill REAL, total_net_saving REAL, created_at TEXT NOT NULL)`,
        args: [],
      },
    ]);

    // Add quote_number column if table already exists without it
    try {
      await tursoPipeline(env.TURSO_URL, env.TURSO_TOKEN, [
        { sql: `ALTER TABLE batch_reports ADD COLUMN quote_number TEXT`, args: [] },
      ]);
    } catch { /* column already exists — safe to ignore */ }

    // Insert the report
    await tursoPipeline(env.TURSO_URL, env.TURSO_TOKEN, [
      {
        sql: `INSERT INTO batch_reports (email, name, company, property_count, properties_json, total_rv, total_bill, total_net_saving, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          { type: 'text', value: email },
          { type: 'text', value: name },
          { type: 'text', value: company },
          { type: 'text', value: String(properties.length) },
          { type: 'text', value: propertiesJson },
          { type: 'text', value: String(totalRV) },
          { type: 'text', value: String(totalBill) },
          { type: 'text', value: String(totalNet) },
          { type: 'text', value: createdAt },
        ],
      },
    ]);

    // Get the last inserted ID and build the quotation number
    const idResult = await tursoPipeline(env.TURSO_URL, env.TURSO_TOKEN, [
      { sql: `SELECT last_insert_rowid() AS id`, args: [] },
    ]);

    const rowId = idResult.results[0].response.result.rows[0][0].value;
    const year = new Date().getFullYear();
    const quoteNumber = `VAC-${year}-${String(rowId).padStart(5, '0')}`;

    // Store the quote number back
    await tursoPipeline(env.TURSO_URL, env.TURSO_TOKEN, [
      {
        sql: `UPDATE batch_reports SET quote_number = ? WHERE id = ?`,
        args: [
          { type: 'text', value: quoteNumber },
          { type: 'text', value: String(rowId) },
        ],
      },
    ]);

    return jsonResponse({ success: true, quote_number: quoteNumber });
  } catch (err) {
    return jsonResponse({ error: 'Database error', detail: err.message }, 500);
  }
}

// ── Admin helpers ──────────────────────────────────────────────

const ALLOWED_GITHUB_USERS = new Set(['atoates']);

async function validateGitHubAuth(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return jsonResponse({ error: 'Unauthorised' }, 401);

  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'VacatAd-Worker',
      },
    });
    if (!res.ok) return jsonResponse({ error: 'Invalid token' }, 401);
    const user = await res.json();
    if (!ALLOWED_GITHUB_USERS.has(user.login)) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }
    return null; // auth OK
  } catch {
    return jsonResponse({ error: 'Auth check failed' }, 500);
  }
}

async function handleAdminLeads(url, env) {
  const limit  = Math.min(parseInt(url.searchParams.get('limit'))  || 100, 500);
  const offset = Math.max(parseInt(url.searchParams.get('offset')) || 0, 0);
  const search = (url.searchParams.get('q') || '').trim();

  try {
    let sql, args;
    if (search) {
      sql = `SELECT id, name, email, company, page_url, created_at FROM leads WHERE name LIKE ? OR email LIKE ? OR company LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?`;
      const term = `%${search}%`;
      args = [
        { type: 'text', value: term },
        { type: 'text', value: term },
        { type: 'text', value: term },
        { type: 'text', value: String(limit) },
        { type: 'text', value: String(offset) },
      ];
    } else {
      sql = `SELECT id, name, email, company, page_url, created_at FROM leads ORDER BY id DESC LIMIT ? OFFSET ?`;
      args = [
        { type: 'text', value: String(limit) },
        { type: 'text', value: String(offset) },
      ];
    }

    const result = await tursoQuery(env.TURSO_URL, env.TURSO_TOKEN, sql, args);
    const rows = result.results[0].response.result.rows;
    const cols = result.results[0].response.result.cols;

    const leads = rows.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col.name] = row[i].type === 'null' ? null : row[i].value; });
      return obj;
    });

    return jsonResponse({ leads, limit, offset });
  } catch (err) {
    return jsonResponse({ error: 'Database error', detail: err.message }, 500);
  }
}

async function handleAdminBatchReports(url, env) {
  const limit  = Math.min(parseInt(url.searchParams.get('limit'))  || 50, 200);
  const offset = Math.max(parseInt(url.searchParams.get('offset')) || 0, 0);
  const search = (url.searchParams.get('q') || '').trim();

  try {
    let sql, args;
    if (search) {
      sql = `SELECT id, quote_number, email, name, company, property_count, total_rv, total_bill, total_net_saving, created_at FROM batch_reports WHERE name LIKE ? OR email LIKE ? OR company LIKE ? OR quote_number LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?`;
      const term = `%${search}%`;
      args = [
        { type: 'text', value: term },
        { type: 'text', value: term },
        { type: 'text', value: term },
        { type: 'text', value: term },
        { type: 'text', value: String(limit) },
        { type: 'text', value: String(offset) },
      ];
    } else {
      sql = `SELECT id, quote_number, email, name, company, property_count, total_rv, total_bill, total_net_saving, created_at FROM batch_reports ORDER BY id DESC LIMIT ? OFFSET ?`;
      args = [
        { type: 'text', value: String(limit) },
        { type: 'text', value: String(offset) },
      ];
    }

    const result = await tursoQuery(env.TURSO_URL, env.TURSO_TOKEN, sql, args);
    const rows = result.results[0].response.result.rows;
    const cols = result.results[0].response.result.cols;

    const reports = rows.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col.name] = row[i].type === 'null' ? null : row[i].value; });
      return obj;
    });

    return jsonResponse({ reports, limit, offset });
  } catch (err) {
    return jsonResponse({ error: 'Database error', detail: err.message }, 500);
  }
}

async function handleAdminStats(env) {
  try {
    const leadsResult = await tursoQuery(
      env.TURSO_URL, env.TURSO_TOKEN,
      `SELECT COUNT(*) AS total, COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) AS last_7d, COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) AS last_30d FROM leads`, []
    );
    const reportsResult = await tursoQuery(
      env.TURSO_URL, env.TURSO_TOKEN,
      `SELECT COUNT(*) AS total, COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) AS last_7d, COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) AS last_30d, COALESCE(SUM(CAST(total_net_saving AS REAL)), 0) AS total_savings FROM batch_reports`, []
    );

    const lRow = leadsResult.results[0].response.result.rows[0];
    const rRow = reportsResult.results[0].response.result.rows[0];

    return jsonResponse({
      leads: {
        total:    parseInt(lRow[0].value) || 0,
        last_7d:  parseInt(lRow[1].value) || 0,
        last_30d: parseInt(lRow[2].value) || 0,
      },
      reports: {
        total:         parseInt(rRow[0].value) || 0,
        last_7d:       parseInt(rRow[1].value) || 0,
        last_30d:      parseInt(rRow[2].value) || 0,
        total_savings: parseFloat(rRow[3].value) || 0,
      },
    });
  } catch (err) {
    return jsonResponse({ error: 'Database error', detail: err.message }, 500);
  }
}

async function tursoPipeline(url, token, statements) {
  const requests = statements.map(s => ({ type: 'execute', stmt: { sql: s.sql, args: s.args } }));
  requests.push({ type: 'close' });

  const response = await fetch(`${url}/v2/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Turso API error: ${response.status} — ${body}`);
  }

  return response.json();
}

async function tursoQuery(url, token, sql, args) {
  const response = await fetch(`${url}/v2/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        { type: 'execute', stmt: { sql, args } },
        { type: 'close' },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Turso API error: ${response.status} — ${body}`);
  }

  return response.json();
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}
