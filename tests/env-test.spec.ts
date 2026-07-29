import { test } from '@playwright/test';

test('check env', async () => {
  console.log('Email loaded:', !!process.env.NBN_QA_EMAIL);
  console.log('Password loaded:', !!process.env.NBN_QA_PASSWORD);
});