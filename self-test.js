import { json } from './_shared/respond.js';

function makeBase(req) {
  // Prefer Netlify runtime env vars
  const viaEnv = process.env.URL || process.env.DEPLOY_URL || process.env.DEPLOY_PRIME_URL;
  if (viaEnv) return viaEnv.replace(/\/$/, '');

  // Fall back to the request host (production) or local dev
  const host = req?.headers?.host;
  if (host) {
    const proto = host.includes('localhost') ? 'http' : 'https';
    return `${proto}://${host}`;
  }
  return 'http://localhost:8888'; // Netlify CLI default
}

async function call(base, path) {
  try {
    const r = await fetch(new URL(path, base));
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      return { ok: false, status: r.status, text };
    }
    const body = await r.json().catch(() => ({}));
    return {
      ok: body.ok ?? true,
      count: Array.isArray(body.items) ? body.items.length : (body.items ? 1 : 0),
      body
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handler(req) {
  const base = makeBase(req);
  const region = 'Orange County';
  const results = {};

  results.config = await call(base, '/.netlify/functions/config');

  // Only call endpoints you actually have in /netlify/functions
  results.places = await call(base, `/.netlify/functions/places-search?region=${encodeURIComponent(region)}`);
  results.yelp   = await call(base, `/.netlify/functions/yelp?region=${encodeURIComponent(region)}`);
  results.ticketmaster = await call(base, `/.netlify/functions/ticketmaster?region=${encodeURIComponent(region)}`);
  results.eventbrite   = await call(base, `/.netlify/functions/eventbrite-search?region=${encodeURIComponent(region)}`);

  // If/when you add these back, uncomment:
  // results.permits = await call(base, '/.netlify/functions/la-permits');
  // results.lacity  = await call(base, '/.netlify/functions/lacity-businesses');

  return json({ ok: true, base, results }, { headers: { 'cache-control': 'no-store' } });
}
