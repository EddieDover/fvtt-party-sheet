// @ts-check
// eslint-disable-next-line no-shadow
import { test, expect } from "@playwright/test";

test.use({
  ignoreHTTPSErrors: true,
});

const doLogin = async (page) => {
  await page.goto("http://localhost:30000/join");

  await page.setViewportSize({ width: 1718, height: 1276 });

  await page.click("select");

  await page.selectOption('[name="userid"]', { label: "Gamemaster" });

  await page.click('[name="password"]');

  // eslint-disable-next-line no-undef
  await page.fill('[name="password"]', process.env.PW_PASSWORD);

  await Promise.all([page.click(".form-footer:nth-child(4) > .bright"), page.waitForLoadState("networkidle")]);
};

const clickPartySheet = async (page) => {
  await page.getByLabel("Show Party Sheet").click();
};

test("can see foundry login", async ({ page }) => {
  await page.goto("http://localhost:30000/");

  await expect(page).toHaveTitle(/West Coast Crew/);
});

test("can login", async ({ page }) => {
  await doLogin(page);
});

test("Verify party sheet opens", async ({ page }) => {
  await doLogin(page);
  await clickPartySheet(page);
  await expect(page.getByRole("heading", { name: "Party Sheet" })).toBeVisible();
});

test("Verify dialog works.", async ({ page }) => {
  await doLogin(page);
  await clickPartySheet(page);
  await page.locator("#fvtt-party-sheet-system-select").selectOption("dnd5e - with fails___Blerp");
  await expect(page.getByText("There was an error processing").first()).toBeVisible();
  await expect(page.getByText("The template you are using is")).toBeVisible();
});
