import { ok, fail } from './_shared/respond.js';
import { nowISO } from './_shared/geo.js';

function parseCSV(text) { /* A simple parser */
  const rows = []; let row = [], val = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i+1];
    if (inQ) { if (c === '"' && n === '"') { val += '"'; i++; } else if (c === '"') inQ = false; else val += c; }
    else { if (c === '"') inQ = true; else if (c === ',') { row.push(val); val = ''; } else if (c === '\n') { row.push(val); rows.push(row); row = []; val = ''; } else if (c !== '\r') val += c; }
  }
  row.push(val); rows.push(row); return rows;
}

export async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    if (!url) return fail(400, 'Missing ?url');

    const r = await fetch(url);
    if (!r.ok) return fail(r.status, `CSV fetch error: ${r.statusText}`);
    const text = await r.text();
    const rows = parseCSV(text);
    if (rows.length < 2) return ok([]);

    const header = rows[0].map(h => h.toLowerCase().trim());
    const nameIdx = header.findIndex(h => /name|business|title/i.test(h));
    const addrIdx = header.findIndex(h => /address|location/i.test(h));
    
    const items = rows.slice(1).map((r, i) => ({
      id: `csv_${i}`, name: r[nameIdx] || `Row ${i+1}`,
      apiSource: 'csv', source: searchParams.get('label') || 'CSV Import',
      location: r[addrIdx] || '', triggers: ['public_record'], consentStatus: 'business_public_record',
      behaviors: [], distance: 0, capturedAt: nowISO(),
      contact: { email: r[header.findIndex(h=>/email/i.test(h))]||'', phone: r[header.findIndex(h=>/phone/i.test(h))]||'' },
      venue: '', categories: r[header.findIndex(h=>/category|type/i.test(h))]||'', url: '#'
    }));

    return ok(items);
  } catch (e) {
    console.error('sheet-import:', e);
    return ok([]);
  }
}