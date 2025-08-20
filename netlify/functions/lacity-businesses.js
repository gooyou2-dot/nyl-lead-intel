import { ok } from './_shared/respond.js';
import { nowISO } from './_shared/geo.js';

const DATASET = process.env.LA_BUSINESSES_DATASET || '6rrh-rzua';
const ROOT = 'https://data.lacity.org/resource/';

export async function handler() {
  try {
    const url = new URL(`${ROOT}${DATASET}.json`);
    url.searchParams.set('$limit', '30');
    url.searchParams.set('$order', 'location_start_date DESC');

    const r = await fetch(url);
    if (!r.ok) {
      console.warn(`LA City Businesses API error: ${r.status} ${r.statusText}`);
      return ok([]);
    }
    
    const data = await r.json();

    // Validate response is an array
    if (!Array.isArray(data)) {
      console.warn('LA City Businesses API returned non-array:', typeof data);
      return ok([]);
    }

    const items = data.map((row, i) => {
      // Skip invalid rows
      if (!row || typeof row !== 'object') {
        return null;
      }

      // Extract business name (matches your API response)
      const businessName = row.business_name || 'New Business';

      // Build location from actual field names in your response
      const address = row.street_address || '';
      const city = row.city || 'Los Angeles';
      const zipCode = row.zip_code || '';
      const location = [address, city, zipCode].filter(Boolean).join(', ') || 'Los Angeles, CA';

      return {
        id: `labiz_${Date.now()}_${i}_${row.location_account || ''}`,
        name: businessName.substring(0, 100), // Prevent overly long names
        apiSource: 'lacity',
        source: 'LA City Businesses',
        location: location.substring(0, 150), // Prevent overly long locations
        triggers: ['business_formation', 'new_registration', 'public_record'],
        consentStatus: 'business_public_record',
        behaviors: ['new_opening'],
        distance: 0,
        capturedAt: nowISO(),
        contact: {
          phone: row.business_phone || row.phone || ''
        },
        venue: '',
        categories: row.primary_naics_description || row.location_description || '',
        url: `https://data.lacity.org/resource/${DATASET}`,
        extra: { 
          locationAccount: row.location_account || '',
          startDate: row.location_start_date || '',
          councilDistrict: row.council_district || '',
          coordinates: row.location_1 ? {
            latitude: row.location_1.latitude,
            longitude: row.location_1.longitude
          } : null
        }
      };
    }).filter(Boolean); // Remove null entries

    console.log(`LA City Businesses: Successfully processed ${items.length} items from dataset ${DATASET}`);
    return ok(items);
    
  } catch (e) {
    console.error('lacity-businesses error:', e);
    return ok([]);
  }
}