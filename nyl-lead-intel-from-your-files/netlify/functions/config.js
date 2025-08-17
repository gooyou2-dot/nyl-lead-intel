// netlify/functions/config.js

exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      
      // --- Lead Generation APIs ---
      // Checks if the environment variable for each API exists
      eventbrite: !!process.env.EVENTBRITE_TOKEN,
      places: !!process.env.GOOGLE_PLACES_KEY,
      ticketmaster: !!process.env.TICKETMASTER_API_KEY,
      seatgeek: !!process.env.SEATGEEK_CLIENT_ID,
      yelp: !!process.env.YELP_API_KEY,

      // These public records APIs don't need a key, so they are always considered "connected"
      lapermits: true,
      lacity: true,

      // --- Other Services ---
      sendgrid: !!process.env.SENDGRID_API_KEY,
    }),
  };
};