import { ok, fail } from './_shared/respond.js';
import { regionCenter, nowISO } from './_shared/geo.js';

const KEY = process.env.YELP_API_KEY;

export async function handler(req) {
  try {
    if (!KEY) return ok([]);
    const { searchParams } = new URL(req.url);
    const region = searchParams.get('region') || 'Orange County';
    const { lat, lng } = regionCenter(region);

    const url = new URL('https://api.yelp.com/v3/businesses/search');
    url.searchParams.set('attributes', 'hot_and_new');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('radius', '30000');
    url.searchParams.set('limit', '30');

    const r = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
    if (!r.ok) return fail(r.status, `Yelp error: ${r.statusText}`);
    const data = await r.json();

    const items = (data.businesses || []).map(b => ({
      id: `yelp_${b.id}`,
      name: b.name,
      apiSource: 'yelp', source: 'Yelp Hot & New',
      location: b.location?.display_address?.join(', ') || `${region}, CA`,
      triggers: ['new_opening'], consentStatus: 'business_public_record', behaviors: ['new_opening'],
      distance: (b.distance || 0) / 1609.34, // meters to miles
      capturedAt: nowISO(),
      contact: { phone: b.display_phone || '' }, venue: '',
      categories: (b.categories || []).map(c => c.title).slice(0,3).join(', '),
      url: b.url || '#',
      rating: b.rating,
      reviewCount: b.review_count
    }));
    return ok(items);
  } catch (e) {
    console.error('yelp:', e);
    return ok([]);
  }
}