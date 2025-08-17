exports.handler = async (event) => {
  try {
    const token = process.env.EVENTBRITE_TOKEN;
    if (!token) return { statusCode: 200, body: JSON.stringify({ ok:false, items:[], note:"Missing EVENTBRITE_TOKEN" }) };

    const region = (event.queryStringParameters && event.queryStringParameters.region) || 'Orange County';
    const url = `https://www.eventbriteapi.com/v3/events/search/?location.address=${encodeURIComponent(region + ', CA')}&sort_by=date`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Eventbrite ${res.status}`);
    const data = await res.json();

    const items = (data.events || []).slice(0, 8).map(ev => ({
      id: ev.id,
      name: ev.name?.text || 'Event',
      location: region + ', CA',
      eventDate: ev.start?.utc || new Date().toISOString(),
      triggers: ['business_formation'],
      consentStatus: 'public_event_signup',
      behaviors: ['event_attendance'],
      distance: Math.random() * 15,
      capturedAt: new Date().toISOString(),
      contact: { email: '' },
      complianceNotes: 'Public event; ensure explicit consent before direct marketing.'
    }));

    return { statusCode: 200, body: JSON.stringify({ ok:true, items }) };
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ ok:false, items:[], error: String(e) }) };
  }
};
