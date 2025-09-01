import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Perform authentication steps. Replace these actions with your own.
  await page.goto('http://localhost:30000/join');
  await page.getByRole('combobox').selectOption('sEBtKwK1znu4NYFG');
  await page.getByRole('textbox', { name: 'Password', exact: true }).click();
  await page.getByRole('button', { name: ' Join Game Session' }).click();
  // Wait until the page receives the cookies.
  //
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  await page.waitForURL('http://localhost:30000/game');

  // End of authentication steps.

  await page.context().storageState({ path: authFile });
});