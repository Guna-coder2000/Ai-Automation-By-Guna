require('dotenv').config({ path: 'environments/qa.env' });
console.log('API KEY:', process.env.GROQ_API_KEY ? 'Set' : 'Missing');
