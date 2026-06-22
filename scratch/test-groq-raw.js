const https = require('https');
require('dotenv').config({ path: 'environments/qa.env' });

const options = {
  hostname: 'api.groq.com',
  port: 443,
  path: '/openai/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
  }
};

const req = https.request(options, (res) => {
  console.log('statusCode:', res.statusCode);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(JSON.stringify({
  model: 'llama-3.3-70b-versatile',
  messages: [{role: 'user', content: 'test'}],
  max_tokens: 10
}));
req.end();
