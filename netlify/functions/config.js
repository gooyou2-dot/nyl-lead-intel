import { json } from './_shared/respond.js';

export async function handler() {
  return json({
    ok: true,
    places: !!process.env.GOOGLE_PLACES_KEY,
    eventbrite: !!process.env.EVENTBRITE_TOKEN,
    ticketmaster: !!process.env.TICKETMASTER_API_KEY,
    seatgeek: !!process.env.SEATGEEK_CLIENT_ID,
    yelp: !!process.env.YELP_API_KEY
  }, { headers: { 'cache-control': 'no-store' }});
}