<<<<<<< HEAD
import { ok } from './_shared/respond.js';
import { nowISO } from './_shared/geo.js';

const DATASET = process.env.LA_BUSINESSES_DATASET || 'vt5i-252k';
const ROOT = 'https://data.lacity.org/resource/';

export async function handler() {
  try {
    const url = new URL(`${ROOT}${DATASET}.json`);
    url.searchParams.set('$limit', '30');
    url.searchParams.set('$order', 'start_date DESC');

    const r = await fetch(url);
    if (!r.ok) return ok([]);
    const data = await r.json();

    const items = (data || []).map((row, i) => ({
      id: `labiz_${i}_${row.account_number || ''}`,
      name: row.legal_business_name || row.business_name || 'New Business',
      apiSource: 'lacity',
      source: 'LA City Businesses',
      location: [row.business_address, row.city, row.zip_code].filter(Boolean).join(', ') || 'Los Angeles, CA',
      triggers: ['business_formation', 'new_registration', 'public_record'],
      consentStatus: 'business_public_record',
      behaviors: ['new_opening'],
      distance: 0,
      capturedAt: nowISO(),
      contact: {},
      venue: '',
      categories: row.primary_naics_description || row.naics || '',
      url: `https://data.lacity.org/${DATASET}`,
      extra: { naics: row.primary_naics || row.naics_code || '' }
    }));
    return ok(items);
  } catch (e) {
    console.error('lacity-businesses:', e);
    return ok([]);
  }
}
=======
import { ok } from './_shared/respond.js';
import { nowISO } from './_shared/geo.js';

const DATASET = process.env.LA_BUSINESSES_DATASET || 'vt5i-252k';
const ROOT = 'https://data.lacity.org/resource/';

export async function handler() {
  try {
    const url = new URL(`${ROOT}${DATASET}.json`);
    url.searchParams.set('$limit', '30');
    url.searchParams.set('$order', 'start_date DESC');

    const r = await fetch(url);
    if (!r.ok) return ok([]);
    const data = await r.json();

    const items = (data || []).map((row, i) => ({
      id: `labiz_${i}_${row.account_number || ''}`,
      name: row.legal_business_name || row.business_name || 'New Business',
      apiSource: 'lacity',
      source: 'LA City Businesses',
      location: [row.business_address, row.city, row.zip_code].filter(Boolean).join(', ') || 'Los Angeles, CA',
      triggers: ['business_formation', 'new_registration', 'public_record'],
      consentStatus: 'business_public_record',
      behaviors: ['new_opening'],
      distance: 0,
      capturedAt: nowISO(),
      contact: {},
      venue: '',
      categories: row.primary_naics_description || row.naics || '',
      url: `https://data.lacity.org/${DATASET}`,
      extra: { naics: row.primary_naics || row.naics_code || '' }
    }));
    return ok(items);
  } catch (e) {
    console.error('lacity-businesses:', e);
    return ok([]);
  }
}
>>>>>>> db0c30696b3835e0688fb2026fc1dfc3ca520587
