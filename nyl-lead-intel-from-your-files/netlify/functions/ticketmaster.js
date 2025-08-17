// netlify/functions/ticketmaster.js
exports.handler = async (event) => {
  try {
    const token = process.env.TICKETMASTER_API_KEY;
    if (!token) {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          ok: false, 
          items: [], 
          note: "Missing TICKETMASTER_API_KEY" 
        }) 
      };
    }

    const region = (event.queryStringParameters && event.queryStringParameters.region) || 'Orange County';
    const params = new URLSearchParams({
      apikey: token,
      city: region.includes('County') ? region.replace(' County', '') : region,
      stateCode: 'CA',
      size: '20',
      sort: 'date,asc'
    });

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Ticketmaster API ${res.status}`);
    const data = await res.json();

    const items = (data._embedded?.events || []).slice(0, 10).map(event => ({
      id: `tm_${event.id}`,
      name: event.name || 'Event',
      location: `${region}, CA`,
      eventDate: event.dates?.start?.dateTime || event.dates?.start?.localDate,
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
      venue: event._embedded?.venues?.[0]?.name || '',
      url: event.url || ''
    }));

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        ok: true, 
        items,
        source: 'Ticketmaster API' 
      }) 
    };
  } catch (e) {
    console.error('Ticketmaster error:', e);
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