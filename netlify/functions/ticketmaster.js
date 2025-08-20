import { ok, fail } from './_shared/respond.js';
import { regionCenter, nowISO } from './_shared/geo.js';

export async function handler(event) {
  try {
    const KEY = process.env.TICKETMASTER_API_KEY;         // read at runtime
    if (!KEY) return ok([]);                               // fail closed w/o leaking

    const qs = event?.queryStringParameters || {};
    const region = qs.region || 'Orange County';
    const { city } = regionCenter(region);

    const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
    url.searchParams.set('apikey', KEY);
    url.searchParams.set('city', city);
    url.searchParams.set('size', qs.size || '30');
    url.searchParams.set('sort', qs.sort || 'date,asc');
    if (qs.keyword) url.searchParams.set('keyword', qs.keyword);
    if (qs.startDateTime) url.searchParams.set('startDateTime', qs.startDateTime);
    if (qs.endDateTime) url.searchParams.set('endDateTime', qs.endDateTime);

    const r = await fetch(url.toString());
    if (!r.ok) return fail(r.status, `Ticketmaster error: ${r.status} ${r.statusText}`);
    const data = await r.json();
    const list = data?._embedded?.events || [];

    const items = list.map(ev => ({
      id: `tm_${ev.id}`,
      name: ev.name,
      apiSource: 'ticketmaster',
      source: 'Ticketmaster',
      location: ev._embedded?.venues?.[0]?.address?.line1
        ? `${ev._embedded.venues[0].address.line1}, ${ev._embedded.venues[0].city?.name || ''}`
        : `${region}, CA`,
      triggers: ['event_attendance'],
      consentStatus: 'public_event_signup',
      behaviors: ['event_attendance'],
      distance: 0,
      capturedAt: nowISO(),
      contact: {},
      venue: ev._embedded?.venues?.[0]?.name || '',
      eventDate: ev.dates?.start?.dateTime || null,
      categories: (ev.classifications || [])
        .map(c => c.segment?.name)
        .filter(Boolean)
        .slice(0, 3)
        .join(', '),
      url: ev.url || '#'
    }));

    return ok(items);
  } catch (e) {
    console.error('ticketmaster:', e);
    return fail(500, 'ticketmaster exception');
  }
}
