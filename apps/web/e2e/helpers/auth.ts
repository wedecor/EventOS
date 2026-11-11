import type { Page } from '@playwright/test';
import { requireE2eCredentials } from './env';

export async function loginAsAdmin(page: Page): Promise<void> {
  const { email, password } = requireE2eCredentials();
  await page.goto('/login/');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/app\//, { timeout: 30_000 });
}

export function idFromUrl(page: Page): string {
  const url = new URL(page.url());
  const id = url.searchParams.get('id');
  if (!id) {
    throw new Error(`Expected id query param on ${page.url()}`);
  }
  return id;
}
