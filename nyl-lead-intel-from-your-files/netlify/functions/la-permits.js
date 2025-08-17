// netlify/functions/la-permits.js
exports.handler = async (event) => {
  try {
    const region = (event.queryStringParameters && event.queryStringParameters.region) || 'Orange County';
    
    // Only run for LA County region
    if (!region.toLowerCase().includes('los angeles')) {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          ok: true, 
          items: [],
          note: "LA Permits only available for Los Angeles County region" 
        }) 
      };
    }

    const datasetId = "hbkd-qubn"; // LADBS Permits dataset
    const days = "30"; // Last 30 days
    const limit = "20";
    
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000).toISOString();
    
    const params = new URLSearchParams({
      "$limit": limit,
      "$order": "issue_date DESC",
      "$where": `issue_date >= '${since}' AND permit_type_desc IS NOT NULL`
    });

    const url = `https://data.lacity.org/resource/${datasetId}.json?${params.toString()}`;
    
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!res.ok) throw new Error(`LA Open Data API ${res.status}`);
    const data = await res.json();

    const items = (data || []).slice(0, 10).map(permit => ({
      id: `ladbs_${permit.permit_num || Date.now()}`,
      name: permit.work_desc || permit.description || 'Construction Project',
      location: `Los Angeles, CA`,
      eventDate: permit.issue_date || new Date().toISOString(),
      triggers: ['business_formation', 'property_development'],
      consentStatus: 'business_public_record',
      behaviors: ['construction_permit'],
      distance: Math.random() * 25,
      capturedAt: new Date().toISOString(),
      contact: { 
        email: '', 
        phone: '' 
      },
      complianceNotes: 'Public permit record - indicates potential new business opportunity.',
      venue: [permit.house_no, permit.street_dir, permit.street_name, permit.suffix]
        .filter(Boolean).join(' ') || 'Los Angeles',
      url: '',
      permitType: permit.permit_type_desc || permit.permit_type || 'Construction',
      contractor: permit.contractor_name || 'N/A'
    }));

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        ok: true, 
        items,
        source: 'LA City Permits' 
      }) 
    };
  } catch (e) {
    console.error('LA Permits error:', e);
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