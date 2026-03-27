/**
 * VacatAd VOA Property Lookup API — Cloudflare Worker
 *
 * Queries the Turso database for properties by postcode.
 * Returns matching properties with both 2023 and 2026 rateable values.
 *
 * Endpoints:
 *   GET /api/lookup?postcode=SW1A+1AA
 *   GET /api/lookup?q=search+term (address search)
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
    throw new Error(`Turso API error: ${response.status}`);
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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}
