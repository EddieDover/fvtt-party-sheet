// eslint-disable-next-line no-shadow
import { test, expect } from "@playwright/test";
import { FoundryTestUtils } from "../playwright/foundry-utils.js";
import fs from "fs";
import path from "path";

test.use({
  ignoreHTTPSErrors: true,
});

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:30000/game");
});

test.afterEach(async ({ page }, testInfo) => {
  // Extract coverage from the browser context
  const coverage = await page.evaluate(() => window.__coverage__);
  if (coverage) {
    // Save coverage for each test, e.g., using the test title for the filename
    const coverageDir = path.resolve("coverage", "playwright");
    if (!fs.existsSync(coverageDir)) fs.mkdirSync(coverageDir, { recursive: true });
    const fileName = path.join(coverageDir, `${testInfo.title.replace(/\s+/g, "_")}.json`);
    fs.writeFileSync(fileName, JSON.stringify(coverage));
  }
});

test("Verify party sheet shows no users online", async ({ page }) => {
  const utils = new FoundryTestUtils(page);
  await utils.openSettingsPanel();
  await utils.enableOnlyOnline();
  await utils.saveSettings();
  await utils.closeAndReopenPartySheet();
  await page.getByText("No players are currently").click();
});

test("Verify party sheet shows template render", async ({ page }) => {
  const utils = new FoundryTestUtils(page);
  await utils.openSettingsPanel();
  await utils.disableOnlyOnline();
  await utils.saveSettings();
  await utils.closeAndReopenPartySheet();
  await expect(page.getByRole("cell", { name: "Hunter" })).toBeVisible();
});
