// Map your UI "region" → best-guess centerpoint for searches
const centers = {
  'Orange County': { lat: 33.7175, lng: -117.8311, city: 'Irvine', state: 'CA' },
  'Los Angeles County': { lat: 34.0522, lng: -118.2437, city: 'Los Angeles', state: 'CA' },
  'San Diego County': { lat: 32.7157, lng: -117.1611, city: 'San Diego', state: 'CA' },
  'Santa Clara County': { lat: 37.3382, lng: -121.8863, city: 'San Jose', state: 'CA' },
  'Sacramento County': { lat: 38.5816, lng: -121.4944, city: 'Sacramento', state: 'CA' },
  'Riverside County': { lat: 33.9533, lng: -117.3962, city: 'Riverside', state: 'CA' },
};

export function regionCenter(region = 'Orange County') {
  return centers[region] || centers['Orange County'];
}

export function nowISO() { return new Date().toISOString(); }