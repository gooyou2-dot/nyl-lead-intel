export const json = (statusCode, data) => ({
  statusCode,
  headers: {
    'content-type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  },
  body: JSON.stringify(data),
});
