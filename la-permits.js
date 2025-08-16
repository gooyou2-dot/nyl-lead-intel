export const handler = async (event) => {
  try {
    // You can swap datasetId if you prefer a different LADBS permits dataset.
    const datasetId = process.env.LADBSPERMIT_DATASET_ID || "hbkd-qubn"; // LADBS Permits (LA Open Data)
    const { days = "14", limit = "50" } = event.queryStringParameters || {};
    const since = new Date(Date.now() - Number(days)*24*60*60*1000).toISOString();

    const params = new URLSearchParams({
      "$limit": String(limit),
      "$order": "issue_date DESC",
      "$where": `issue_date >= '${since}'`
    });

    // Optional App Token for higher rate limits
    const appToken = process.env.SOCRATA_APP_TOKEN;
    const headers = appToken ? { "X-App-Token": appToken } : {};

    const url = `https://data.lacity.org/resource/${datasetId}.json?${params}`;
    const r = await fetch(url, { headers });
    if (!r.ok) return j(r.status, { error: "socrata_status", status: r.status });
    const data = await r.json();

    const items = (data || []).map(p => ({
      id: `ladbs_${p.permit_num || p.id || ""}`,
      description: p.work_desc || p.description || "",
      issue_date: p.issue_date || "",
      permit_type: p.permit_type || p.permit_type_desc || "",
      address: [p.house_no, p.street_dir, p.street_name, p.suffix].filter(Boolean).join(" ") || p.location || "",
      city: "Los Angeles",
      source: "la_permits"
    }));

    return j(200, { items, raw_count: items.length });
  } catch (e) {
    return j(500, { error: "ladbs_error", message: e.message });
  }
};
const j = (code, body) => ({ statusCode: code, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
