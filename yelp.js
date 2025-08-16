// netlify/functions/yelp.js
exports.handler = async (event) => {
  try {
    const key = process.env.YELP_API_KEY;
    if (!key) {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          ok: false, 
          items: [], 
          note: "Missing YELP_API_KEY" 
        }) 
      };
    }

    const region = (event.queryStringParameters && event.queryStringParameters.region) || 'Orange County';
    const location = region.includes('County') ? region.replace(' County', '') + ', CA' : region + ', CA';
    
    const params = new URLSearchParams({
      attributes: 'hot_and_new',
      location: location,
      limit: '20',
      radius: '16000', // ~10 miles
      categories: 'restaurants,bars,retail,professional,health,financialservices'
    });

    const url = `https://api.yelp.com/v3/businesses/search?${params.toString()}`;
    
    const res = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!res.ok) throw new Error(`Yelp API ${res.status}`);
    const data = await res.json();

    const items = (data.businesses || []).slice(0, 10).map(business => ({
      id: `yelp_${business.id}`,
      name: business.name || 'Business',
      location: `${region}, CA`,
      triggers: ['business_formation', 'new_business'],
      consentStatus: 'business_public_record',
      behaviors: ['new_opening'],
      distance: business.distance ? (business.distance * 0.000621371).toFixed(1) : Math.random() * 15,
      capturedAt: new Date().toISOString(),
      contact: { 
        email: '', 
        phone: business.display_phone || '' 
      },
      complianceNotes: 'Public business listing - professional outreach appropriate.',
      venue: business.location?.display_address?.join(', ') || '',
      url: business.url || '',
      categories: (business.categories || []).map(c => c.title).join(', '),
      rating: business.rating || 0,
      reviewCount: business.review_count || 0
    }));

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        ok: true, 
        items,
        source: 'Yelp Hot & New' 
      }) 
    };
  } catch (e) {
    console.error('Yelp error:', e);
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        ok: false, 
        items: [], 
        error: String(e) 
      }) 
    };
  }
};