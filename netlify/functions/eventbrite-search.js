exports.handler = async (event) => {
  try {
    const token = process.env.EVENTBRITE_TOKEN;
    if (!token) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: false, items: [], note: "Missing EVENTBRITE_TOKEN" })
      };
    }

    const region =
      (event.queryStringParameters && event.queryStringParameters.region) ||
      "Orange County";

    // Build Eventbrite search URL with more detail & bigger page size
    const base = "https://www.eventbriteapi.com/v3/events/search/";
    const params = new URLSearchParams({
      "location.address": `${region}, CA`,
      "location.within": "50mi",  // widen radius
      sort_by: "date",
      expand: "venue,organizer",  // include venue/organizer objects
      page_size: "25"             // more results per page
    });
    const url = `${base}?${params.toString()}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Eventbrite ${res.status}`);
    const data = await res.json();

    const items = (data.events || []).map((ev) => ({
      id: ev.id,
      name: ev.name?.text || "Event",
      source: "Eventbrite API (Live)",
      apiSource: "eventbrite",
      location:
        ev.venue?.address?.localized_area ||
        ev.venue?.address?.city ||
        `${region}, CA`,
      eventDate: ev.start?.local || ev.start?.utc || new Date().toISOString(),
      triggers: ["business_formation"],
      consentStatus: "public_event_signup",
      behaviors: ["event_attendance"],
      distance: Math.round((Math.random() * 10 + 1) * 10) / 10, // fake distance for now
      capturedAt: new Date().toISOString(),
      contact: { email: "" },
      complianceNotes:
        "Public event registration; ensure explicit consent before direct marketing.",
      apiDetails: {
        endpoint: "/v3/events/search/",
        lastFetch: new Date().toISOString(),
        confidence: 95
      }
    }));

    return { statusCode: 200, body: JSON.stringify({ ok: true, items }) };
  } catch (e) {
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: false, items: [], error: String(e) })
    };
  }
};
