import { ok, fail } from './_shared/respond.js';
import { nowISO } from './_shared/geo.js';

const TOKEN = process.env.EVENTBRITE_TOKEN;

export async function handler(req) {
  try {
    if (!TOKEN) return ok([]);
    const { searchParams } = new URL(req.url);
    const region = searchParams.get('region') || 'Orange County';

    const url = new URL('https://www.eventbriteapi.com/v3/events/search/');
    url.searchParams.set('location.address', `${region}, CA`);
    url.searchParams.set('expand', 'venue,category');
    url.searchParams.set('sort_by', 'date');

    const r = await fetch(url, { headers: { authorization: `Bearer ${TOKEN}` } });
    if (!r.ok) return fail(r.status, `Eventbrite error: ${r.statusText}`);
    const data = await r.json();

    const items = (data.events || []).map(ev => ({
      id: `eb_${ev.id}`,
      name: ev.name?.text || 'Event',
      apiSource: 'eventbrite', source: 'Eventbrite',
      location: ev.venue?.address?.localized_address_display || `${region}, CA`,
      triggers: ['event_attendance'], consentStatus: 'public_event_signup', behaviors: ['event_attendance'],
      distance: 0, capturedAt: nowISO(), contact: {},
      venue: ev.venue?.name || '',
      eventDate: ev.start?.utc || null,
      categories: ev.category?.name || '',
      url: ev.url || '#'
    }));
    return ok(items);
  } catch (e) {
    console.error('eventbrite-search:', e);
    return ok([]);
  }
}