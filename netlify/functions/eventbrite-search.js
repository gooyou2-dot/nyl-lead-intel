exports.handler = async (event) => {
  try {
    const token = process.env.EVENTBRITE_TOKEN;
    const orgId = process.env.EVENTBRITE_ORG_ID; // <- add this in Netlify for Option A

    if (!token) {
      return { statusCode: 200, body: JSON.stringify({ ok:false, items:[], note:"Missing EVENTBRITE_TOKEN" }) };
    }

    const region =
      (event.queryStringParameters && event.queryStringParameters.region) || "Orange County";

    // If we have an orgId, use the organizer-specific endpoint (works without partner access)
    if (orgId) {
      const base = `https://www.eventbriteapi.com/v3/organizations/${orgId}/events/`;
      const params = new URLSearchParams({
        status: "live",                            // live/upcoming events only
        "start_date.range_start": new Date().toISOString(),
        order_by: "start_asc",
        expand: "venue,organizer",
        page_size: "25"
      });
      const url = `${base}?${params.toString()}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const text = await res.text();
        return { statusCode: 200, body: JSON.stringify({ ok:false, items:[], error:`Eventbrite ${res.status}`, details:text }) };
      }
      const data = await res.json();

      const items = (data.events || []).map(ev => ({
        id: ev.id,
        name: ev.name?.text || "Event",
        source: "Eventbrite API (Live, org)",
        apiSource: "eventbrite",
        location: ev.venue?.address?.city || `${region}, CA`,
        eventDate: ev.start?.local || ev.start?.utc || new Date().toISOString(),
        triggers: ["business_formation"],
        consentStatus: "public_event_signup",
        behaviors: ["event_attendance"],
        distance: Math.round((Math.random() * 10 + 1) * 10) / 10,
        capturedAt: new Date().toISOString(),
        contact: { email: "" },
        complianceNotes: "Public event registration; ensure explicit consent before outreach.",
        apiDetails: { endpoint: `/v3/organizations/${orgId}/events/`, lastFetch: new Date().toISOString(), confidence: 95 }
      }));

      return { statusCode: 200, body: JSON.stringify({ ok:true, items }) };
    }

    // Otherwise, explain why global search won’t work
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: false,
        items: [],
        error: "Eventbrite search not available for this token",
        details: "Public access to /v3/events/search/ is restricted by Eventbrite; apply for partner/distribution access or set EVENTBRITE_ORG_ID to fetch your own org’s events."
      })
    };
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ ok:false, items:[], error:String(e) }) };
  }
};
