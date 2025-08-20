// /netlify/functions/self-test.js
import { ok, fail } from './_shared/respond.js';

const mask = (v) => (v ? `${v.slice(0,2)}…${v.slice(-4)}` : null);

// Optional: super-lightweight test calls (safe + tiny)
async function pingTicketmaster(key) {
  if (!key) return { ok: false, reason: 'missing_key' };
  const u = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
  u.searchParams.set('size', '1');
  u.searchParams.set('countryCode', 'US');
  u.searchParams.set('apikey', key);
  const r = await fetch(u);
  return r.ok ? { ok: true } : { ok: false, status: r.status };
}

async function pingYelp(key) {
  if (!key) return { ok: false, reason: 'missing_key' };
  const u = new URL('https://api.yelp.com/v3/businesses/search');
  u.searchParams.set('latitude', '33.6603');   // OC center-ish
  u.searchParams.set('longitude', '-117.9992');
  u.searchParams.set('limit', '1');
  const r = await fetch(u, { headers: { Authorization: `Bearer ${key}` } });
  return r.ok ? { ok: true } : { ok: false, status: r.status };
}

async function pingPlaces(key) {
  if (!key) return { ok: false, reason: 'missing_key' };
  const u = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  u.searchParams.set('query', 'coffee');
  u.searchParams.set('location', '33.6603,-117.9992');
  u.searchParams.set('radius', '1000');
  u.searchParams.set('key', key);
  const r = await fetch(u);
  return r.ok ? { ok: true } : { ok: false, status: r.status };
}

export async function handler(req) {
  try {
    const env = {
      TICKETMASTER_API_KEY: !!process.env.TICKETMASTER_API_KEY,
      YELP_API_KEY: !!process.env.YELP_API_KEY,
      GOOGLE_PLACES_KEY: !!process.env.GOOGLE_PLACES_KEY,
      EVENTBRITE_TOKEN: !!process.env.EVENTBRITE_TOKEN,
      SEATGEEK_CLIENT_ID: !!process.env.SEATGEEK_CLIENT_ID,
      SENDGRID_API_KEY: !!process.env.SENDGRID_API_KEY,
    };

    // Optional live pings (fast + 1 item only)
    const [tm, yelp, places] = await Promise.all([
      pingTicketmaster(process.env.TICKETMASTER_API_KEY),
      pingYelp(process.env.YELP_API_KEY),
      pingPlaces(process.env.GOOGLE_PLACES_KEY),
    ]);

    // Never return raw secrets; include masked preview for debugging
    const masked = {
      TICKETMASTER_API_KEY: mask(process.env.TICKETMASTER_API_KEY || ''),
      YELP_API_KEY: mask(process.env.YELP_API_KEY || ''),
      GOOGLE_PLACES_KEY: mask(process.env.GOOGLE_PLACES_KEY || ''),
    };

    return ok({
      env,                     // booleans: present/missing
      maskedKeys: masked,      // safe masked view
      pings: { ticketmaster: tm, yelp, places }, // live connectivity status
      note: 'Keys are masked; only presence and ping results are shown.',
    });
  } catch (e) {
    console.error('self-test error', e);
    return fail(500, 'Self test failed');
  }
}
