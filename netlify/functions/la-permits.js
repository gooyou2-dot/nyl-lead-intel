import { ok } from './_shared/respond.js';
import { nowISO } from './_shared/geo.js';

const DATASET = process.env.LA_PERMITS_DATASET || 'nbyu-2pyy';
const ROOT = 'https://data.lacity.org/resource/';

export async function handler() {
  try {
    const url = new URL(`${ROOT}${DATASET}.json`);
    url.searchParams.set('$limit', '30');
    url.searchParams.set('$order', 'issue_date DESC');

    const r = await fetch(url);
    if (!r.ok) return ok([]);
    const data = await r.json();

    const items = (data || []).map((row, i) => ({
      id: `lapermit_${i}_${row.permit_num || ''}`,
      name: `Permit ${row.permit_num || 'New'}`,
      apiSource: 'lapermits',
      source: 'LA City Permits',
      location: [row.house_no, row.street_name, row.zip_code].filter(Boolean).join(' ') || 'Los Angeles, CA',
      triggers: ['construction_permit', 'property_development'],
      consentStatus: 'public_record',
      behaviors: ['construction_permit'],
      distance: 0,
      capturedAt: nowISO(),
      contact: {},
      venue: '',
      categories: row.permit_type || row.work_description || '',
      url: `https://data.lacity.org/${DATASET}`,
      extra: { valuation: row.valuation || '' }
    }));
    return ok(items);
  } catch (e) {
    console.error('la-permits:', e);
    return ok([]);
  }
}