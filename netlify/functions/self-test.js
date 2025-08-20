import { json } from './_shared/respond.js';

async function call(path) {
  try {
    const rootUrl = process.env.DEPLOY_PRIME_URL || 'https://example.com';
    const r = await fetch(rootUrl + path);
    if (!r.ok) return { ok:false, status:r.status, text: await r.text().catch(()=> '') };
    const body = await r.json().catch(()=> ({}));
    return { ok: body.ok ?? true, count: Array.isArray(body.items) ? body.items.length : (body.items ? 1 : 0), body };
  } catch (e) {
    return { ok:false, error:String(e) };
  }
}

export async function handler(req) {
  const region = 'Orange County';
  const results = {};
  results.config   = await call('/.netlify/functions/config');
  results.permits  = await call('/.netlify/functions/la-permits');
  results.lacity   = await call('/.netlify/functions/lacity-businesses');
  results.places   = await call(`/.netlify/functions/places-search?region=${encodeURIComponent(region)}`);
  results.yelp     = await call(`/.netlify/functions/yelp?region=${encodeURIComponent(region)}`);
  return json({ ok: true, results });
}