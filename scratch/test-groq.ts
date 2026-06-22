import * as dotenv from 'dotenv';
import path from 'path';
import { LLMProviderFactory } from '../src/framework/LLMProvider';

async function test() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  dotenv.config({ path: path.resolve(process.cwd(), 'environments/qa.env'), override: true });
  
  const provider = LLMProviderFactory.getProvider();
  console.log('Provider:', provider.name);
  try {
    const res = await provider.generate('Say "API Key is valid!"');
    console.log('Result:', res);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
