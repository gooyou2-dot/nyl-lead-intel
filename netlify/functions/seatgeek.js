import { ok, fail } from './_shared/respond.js';
import { regionCenter, nowISO } from './_shared/geo.js';

const CLIENT_ID = process.env.SEATGEEK_CLIENT_ID;

export async function handler(req) {
  try {
    if (!CLIENT_ID) return ok([]);
    const { searchParams } = new URL(req.url);
    const region = searchParams.get('region') || 'Orange County';
    const { lat, lng } = regionCenter(region);

    const url = new URL('https://api.seatgeek.com/2/events');
    url.searchParams.set('client_id', CLIENT_ID);
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('range', '30mi');
    url.searchParams.set('per_page', '30');

    const r = await fetch(url);
    if (!r.ok) return fail(r.status, `SeatGeek error: ${r.statusText}`);
    const data = await r.json();

    const items = (data.events || []).map(ev => ({
      id: `sg_${ev.id}`, name: ev.title, apiSource: 'seatgeek', source: 'SeatGeek',
      location: ev.venue ? `${ev.venue.address || ''} ${ev.venue.extended_address || ''}`.trim() || `${region}, CA` : `${region}, CA`,
      triggers: ['event_attendance'], consentStatus: 'public_event_signup', behaviors: ['event_attendance'],
      distance: 0, capturedAt: nowISO(), contact: {},
      venue: ev.venue?.name || '',
      eventDate: ev.datetime_utc || null,
      categories: (ev.taxonomies || []).map(t => t.name).slice(0,3).join(', '),
      url: ev.url || '#'
    }));
    return ok(items);
  } catch (e) {
    console.error('seatgeek:', e);
    return ok([]);
  }
}