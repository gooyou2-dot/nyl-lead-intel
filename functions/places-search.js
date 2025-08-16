exports.handler = async (event) => {
  try {
    const key = process.env.GOOGLE_PLACES_KEY;
    if (!key) return { statusCode: 200, body: JSON.stringify({ ok:false, items:[], note:"Missing GOOGLE_PLACES_KEY" }) };

    const region = (event.queryStringParameters && event.queryStringParameters.region) || 'Orange County';
    const query = `professional services in ${region} CA`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${key}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Places ${res.status}`);
    const data = await res.json();

    const items = (data.results || []).slice(0, 8).map((p, idx) => ({
      id: p.place_id || ('pl_'+idx),
      name: p.name || 'Business',
      location: p.formatted_address || (region + ', CA'),
      triggers: ['business_formation'],
      consentStatus: 'business_public_record',
      behaviors: ['website_visit'],
      distance: Math.random()*12,
      capturedAt: new Date().toISOString(),
      contact: { email: '', phone: '' },
      complianceNotes: 'Business listing; outreach should be professional and non-automated.'
    }));

    return { statusCode: 200, body: JSON.stringify({ ok:true, items }) };
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ ok:false, items:[], error: String(e) }) };
  }
};
