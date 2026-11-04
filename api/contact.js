const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body, status = 200) => Response.json(body, { status });
const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

export async function POST(request) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'invalid' }, 400);
  }

  // Honungsfälla: människor ser aldrig fältet, så bottar får ett tyst "ok".
  if (clean(data.website, 200)) return json({ ok: true });

  const name = clean(data.name, 100).replace(/\s+/g, ' ');
  const reach = clean(data.reach, 150);
  const message = clean(data.message, 3000);

  if (!name || !message) return json({ error: 'invalid' }, 400);

  const isEmail = EMAIL.test(reach);
  const isPhone = reach.replace(/\D/g, '').length >= 6;
  if (!isEmail && !isPhone) return json({ error: 'reach' }, 400);

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  const from = process.env.CONTACT_FROM;
  if (!apiKey || !to || !from) {
    console.error('Saknar RESEND_API_KEY, CONTACT_TO eller CONTACT_FROM');
    return json({ error: 'send' }, 500);
  }

  const response = await fetch(process.env.RESEND_API_URL ?? 'https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Meddelande från hemsidan: ${name}`,
      text: `Namn: ${name}\nKontakt: ${reach}\n\n${message}\n`,
      ...(isEmail ? { reply_to: reach } : {}),
    }),
  }).catch((error) => {
    console.error('Kunde inte nå Resend', error);
    return null;
  });

  if (!response?.ok) {
    if (response) console.error('Resend svarade', response.status, await response.text());
    return json({ error: 'send' }, 502);
  }

  return json({ ok: true });
}
