exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const key = process.env.SENDGRID_API_KEY;
    if (!key) return { statusCode: 200, body: JSON.stringify({ ok:false, note:'Missing SENDGRID_API_KEY' }) };

    const body = JSON.parse(event.body || '{}');
    const to = process.env.AGENT_EMAIL || body.to || 'example@example.com';
    const subject = body.subject || 'Draft outreach from NYL Lead Intelligence Platform';
    const text = body.text || 'Hello — personalize this draft before sending to a contact.';

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: to },
        subject,
        content: [{ type: 'text/plain', value: text }]
      })
    });
    const ok = res.status === 202;
    return { statusCode: 200, body: JSON.stringify({ ok }) };
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ ok:false, error:String(e) }) };
  }
};
