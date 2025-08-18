import { ok, fail } from './_shared/respond.js';
import { regionCenter, nowISO } from './_shared/geo.js';

const KEY = process.env.GOOGLE_PLACES_KEY;
const URL = 'https://places.googleapis.com/v1/places:searchText';
const FIELD_MASK = 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.types';

export async function handler(req) {
  try {
    if (!KEY) return ok([]);
    const { searchParams } = new URL(req.url);
    const region = searchParams.get('region') || 'Orange County';
    const { lat, lng } = regionCenter(region);

    const textQuery = `grand opening OR new location near ${region}, CA`;

    const r = await fetch(URL, {
      method: 'POST',
      headers: { 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': FIELD_MASK, 'content-type': 'application/json' },
      body: JSON.stringify({ textQuery, locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 30000 } } })
    });
    if (!r.ok) return fail(r.status, `Places API error: ${r.statusText}`);
    const data = await r.json();

    const items = (data.places || []).map((p, i) => ({
      id: `places_${i}_${p.displayName?.text || 'place'}`,
      name: p.displayName?.text || 'Business',
      apiSource: 'places', source: 'Google Places',
      location: p.formattedAddress || `${region}, CA`,
      triggers: ['new_opening'], consentStatus: 'business_public_record', behaviors: ['new_opening'],
      distance: 0, capturedAt: nowISO(), contact: {}, venue: '',
      categories: (p.types || []).slice(0, 3).join(', '),
      url: p.websiteUri || '#',
      extra: { rating: p.rating, reviewCount: p.userRatingCount }
    }));
    return ok(items);
  } catch (e) {
    console.error('places-search:', e);
    return ok([]);
  }
}