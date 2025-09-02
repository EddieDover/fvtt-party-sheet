import { test, expect } from "@playwright/test";
import { FoundryTestUtils } from "../playwright/foundry-utils.js";

test.use({
  ignoreHTTPSErrors: true,
});

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:30000/game");
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
  await expect(page.getByRole("cell", { name: "Fighter" })).toBeVisible();
});
