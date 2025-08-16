exports.handler = async () => ({
  statusCode: 200,
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ hasTicketmasterKey: !!process.env.TICKETMASTER_API_KEY })
});
