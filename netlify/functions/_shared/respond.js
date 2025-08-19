// Small helpers to respond consistently
export const json = (obj, init = {}) =>
  new Response(JSON.stringify(obj), {
    headers: { 'content-type': 'application/json', ...init.headers },
    ...init
  });

export const ok = (items = []) => json({ ok: true, items });

export const fail = (status = 500, message = 'Server error') =>
  json({ ok: false, error: message }, { status });