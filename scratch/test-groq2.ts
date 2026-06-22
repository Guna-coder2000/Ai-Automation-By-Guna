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
  } catch (err: any) {
    console.error('Error name:', err?.name);
    console.error('Error message:', err?.message);
    console.error('Error stack:', err?.stack);
  }
}

test();
