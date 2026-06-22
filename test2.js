require('dotenv').config({ path: 'environments/qa.env' });
const fetch = require('node-fetch');
async function run() {
  console.log('Sending request to groq...');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'hello' }]
      }),
  });
  console.log('Status:', res.status, res.statusText);
  const text = await res.text();
  console.log('Body:', text);
}
run();
