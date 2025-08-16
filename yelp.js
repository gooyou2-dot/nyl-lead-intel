export const handler = async (event) => {
  try {
    const key = process.env.YELP_API_KEY;
    if (!key) return j(500, { error: "missing_env", var: "YELP_API_KEY" });

    const { q = "", location = "", lat = "", lon = "", radius = "8000", categories = "" } =
      event.queryStringParameters || {};

    const params = new URLSearchParams({
      attributes: "hot_and_new",
      limit: "50"
    });
    if (q) params.set("term", q);
    if (categories) params.set("categories", categories);
    if (lat && lon) { params.set("latitude", lat); params.set("longitude", lon); params.set("radius", radius); }
    else if (location) { params.set("location", location); }

    const resp = await fetch(`https://api.yelp.com/v3/businesses/search?${params}`, {
      headers: { Authorization: `Bearer ${key}` }
    });
    if (!resp.ok) return j(resp.status, { error: "yelp_status", status: resp.status });
    const data = await resp.json();

    const items = (data.businesses || []).map(b => ({
      id: `yelp_${b.id}`,
      name: b.name,
      categories: (b.categories || []).map(c => c.title).join(", "),
      phone: b.phone || "",
      address: (b.location?.display_address || []).join(", "),
      city: b.location?.city || "",
      state: b.location?.state || "",
      url: b.url,
      rating: b.rating,
      review_count: b.review_count,
      source: "yelp_hot_and_new"
    }));

    return j(200, { items, raw_count: items.length });
  } catch (e) {
    return j(500, { error: "yelp_error", message: e.message });
  }
};
const j = (code, body) => ({ statusCode: code, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
