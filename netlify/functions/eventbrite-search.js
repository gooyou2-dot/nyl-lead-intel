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
    const debug = event.queryStringParameters?.debug === "1";

    // Build Eventbrite search URL (v3)
    const base = "https://www.eventbriteapi.com/v3/events/search/";
    const params = new URLSearchParams({
      "location.address": `${region}, CA`,
      "location.within": "50mi",
      sort_by: "date",
      // The following are optional but helpful:
      // Only upcoming, public events:
      "start_date.range_start": new Date().toISOString(),
      expand: "venue,organizer",
      page_size: "25",
      // You can add a relevance query if desired:
      // q: "business OR startup OR finance"
    });
    const url = `${base}?${params.toString()}`;

    // Helper that runs a request and returns {ok, status, json/text}
    const run = async (u) => {
      const res = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
      const text = await res.text(); // capture raw text in case of errors
      let json;
      try { json = JSON.parse(text); } catch { /* keep text only */ }
      return { ok: res.ok, status: res.status, json, text };
    };

    // 1) Try the primary search
    let r = await run(url);

    // 2) Fallback: if 404, try a simpler query (no expand / page_size)
    if (!r.ok && r.status === 404) {
      const fallbackParams = new URLSearchParams({
        "location.address": `${region}, CA`,
        "location.within": "50mi",
        sort_by: "date",
        "start_date.range_start": new Date().toISOString()
      });
      const fallbackUrl = `${base}?${fallbackParams.toString()}`;
      r = await run(fallbackUrl);
    }

    if (!r.ok) {
      // Return detailed debug info so we can see exactly why
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: false,
          items: [],
          error: `Eventbrite ${r.status}`,
          details: r.json || r.text || "(no body)"
        })
      };
    }

    const data = r.json || {};
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
      distance: Math.round((Math.random() * 10 + 1) * 10) / 10, // mock distance
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

    // Optional: return the raw response if you hit with ?debug=1
    if (debug) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, count: items.length, raw: data, items })
      };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, items }) };
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, items: [], error: String(e) }) };
  }
};
