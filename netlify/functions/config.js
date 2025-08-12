exports.handler = async () => {
  try {
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        eventbrite: !!process.env.EVENTBRITE_TOKEN,
        places: !!process.env.GOOGLE_PLACES_KEY,
        sendgrid: !!process.env.SENDGRID_API_KEY
      })
    };
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ ok:false }) };
  }
};
