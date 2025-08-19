import { ok, fail } from './_shared/respond.js';
import { regionCenter, nowISO } from './_shared/geo.js';

const KEY = process.env.TICKETMASTER_API_KEY;

export async function handler(req) {
  try {
    if (!KEY) return ok([]);
    const { searchParams } = new URL(req.url);
    const region = searchParams.get('region') || 'Orange County';
    const { city } = regionCenter(region);

    const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
    url.searchParams.set('apikey', KEY);
    url.searchParams.set('city', city);
    url.searchParams.set('size', '30');
    url.searchParams.set('sort', 'date,asc');

    const r = await fetch(url);
    if (!r.ok) return fail(r.status, `Ticketmaster error: ${r.statusText}`);
    const data = await r.json();
    const list = data?._embedded?.events || [];

    const items = list.map(ev => ({
      id: `tm_${ev.id}`, name: ev.name, apiSource: 'ticketmaster', source: 'Ticketmaster',
      location: ev._embedded?.venues?.[0]?.address?.line1 ? `${ev._embedded.venues[0].address.line1}, ${ev._embedded.venues[0].city?.name || ''}` : `${region}, CA`,
      triggers: ['event_attendance'], consentStatus: 'public_event_signup', behaviors: ['event_attendance'],
      distance: 0, capturedAt: nowISO(), contact: {},
      venue: ev._embedded?.venues?.[0]?.name || '',
      eventDate: ev.dates?.start?.dateTime || null,
      categories: (ev.classifications || []).map(c => c.segment?.name).filter(Boolean).slice(0,3).join(', '),
      url: ev.url || '#'
    }));
    return ok(items);
  } catch (e) {
    console.error('ticketmaster:', e);
    return ok([]);
  }
}