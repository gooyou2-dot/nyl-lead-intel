// netlify/functions/config.js
exports.handler = async () => {
  try {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        ok: true,
        eventbrite: !!process.env.EVENTBRITE_TOKEN,
        places: !!process.env.GOOGLE_PLACES_KEY,
        sendgrid: !!process.env.SENDGRID_API_KEY,
        ticketmaster: !!process.env.TICKETMASTER_API_KEY,
        seatgeek: !!process.env.SEATGEEK_CLIENT_ID
      })
    };
  } catch (e) {
    return { 
      statusCode: 200, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ok: false, 
        eventbrite: false, 
        places: false, 
        sendgrid: false,
        ticketmaster: false,
        seatgeek: false
      }) 
    };
  }
};