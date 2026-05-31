const https = require('https');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { prompt } = JSON.parse(event.body);

  const payload = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.9, maxOutputTokens: 400 }
  });

  const apiKey = process.env.GEMINI_API_KEY;
  const path = `/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const clean = text.replace(/```json|```/g, '').trim();
          const fortune = JSON.parse(clean);
          resolve({
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fortune)
          });
        } catch(e) {
          resolve({ statusCode: 500, body: JSON.stringify({ error: 'Parse error: ' + data }) });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) });
    });

    req.write(payload);
    req.end();
  });
};
