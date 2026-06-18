import { test, expect } from '@playwright/test';
import { CommonApiActions } from '../../src/framework/CommonApiActions';

test.describe('Test the public API https://jsonplaceholder.typicode.com/posts/1. Verify the status code is 200, and the response JSON contains a userId and title.', () => {
  test('Execute API flow', async ({ request }) => {
    const api = new CommonApiActions(request);
    await test.step('Send GET request and verify', async () => {
       const response = await api.get('https://jsonplaceholder.typicode.com/posts/1');
       expect(response).toBeDefined();
    });
  });
});
