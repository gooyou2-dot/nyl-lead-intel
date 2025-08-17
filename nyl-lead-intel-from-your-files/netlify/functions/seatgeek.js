// netlify/functions/seatgeek.js
exports.handler = async (event) => {
  try {
    const clientId = process.env.SEATGEEK_CLIENT_ID;
    if (!clientId) {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          ok: false, 
          items: [], 
          note: "Missing SEATGEEK_CLIENT_ID" 
        }) 
      };
    }

    const region = (event.queryStringParameters && event.queryStringParameters.region) || 'Orange County';
    const cityName = region.includes('County') ? region.replace(' County', '') : region;
    
    const params = new URLSearchParams({
      client_id: clientId,
      'venue.city': cityName,
      'venue.state': 'CA',
      per_page: '20',
      sort: 'datetime_local.asc'
    });

    const url = `https://api.seatgeek.com/2/events?${params.toString()}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SeatGeek API ${res.status}`);
    const data = await res.json();

    const items = (data.events || []).slice(0, 10).map(event => ({
      id: `sg_${event.id}`,
      name: event.title || 'Event',
      location: `${region}, CA`,
      eventDate: event.datetime_local,
      triggers: ['event_attendance', 'business_formation'],
      consentStatus: 'public_event_signup',
      behaviors: ['event_attendance'],
      distance: Math.random() * 20,
      capturedAt: new Date().toISOString(),
      contact: { 
        email: '', 
        phone: '' 
      },
      complianceNotes: 'Public event data - ensure attendee consent for follow-up.',
      venue: event.venue?.name || '',
      url: event.url || ''
    }));

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        ok: true, 
        items,
        source: 'SeatGeek API' 
      }) 
    };
  } catch (e) {
    console.error('SeatGeek error:', e);
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        ok: false, 
        items: [], 
        error: String(e) 
      }) 
    };
  }
};