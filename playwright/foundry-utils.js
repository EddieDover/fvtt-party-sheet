/**
 * FoundryVTT Testing Utilities
 * Helper functions for consistent FoundryVTT testing
 */
export class FoundryTestUtils {
  constructor(page) {
    this.page = page;
  }

  /**
   * Wait for FoundryVTT to be fully loaded
   */
  async waitForFoundryReady() {
    // Wait for the game canvas to be ready
    await this.page.waitForSelector("#board", { timeout: 30000 });

    // Wait for the game object to be initialized
    await this.page.waitForFunction(
      () => {
        return window.game && window.game.ready;
      },
      { timeout: 30000 },
    );

    console.log("✅ FoundryVTT ready for testing");
  }

  /**
   * Open the party sheet and wait for it to be ready
   */
  async openPartySheet() {
    // Look for party sheet button in UI
    await this.page.click('[data-tooltip="Party Sheet"]', { timeout: 10000 });

    // Wait for party sheet to be rendered
    await this.page.waitForSelector(".fvtt-party-sheet", { timeout: 10000 });

    // Wait for dropdowns to be present (if any)
    await this.page.waitForTimeout(1000); // Allow for dynamic content loading

    console.log("✅ Party Sheet opened");
  }

  /**
   * Get current refresh rate setting
   */
  async getRefreshRate() {
    return await this.page.evaluate(() => {
      return window.game?.settings?.get("fvtt-party-sheet", "refreshRate") || 0;
    });
  }

  /**
   * Set refresh rate for testing
   */
  async setRefreshRate(seconds) {
    await this.page.evaluate((rate) => {
      window.game.settings.set("fvtt-party-sheet", "refreshRate", rate);
    }, seconds);

    console.log(`✅ Refresh rate set to ${seconds} seconds`);
  }

  /**
   * Take a proof screenshot with metadata
   */
  async takeProofScreenshot(testName, description = "") {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `proof-${testName}-${timestamp}.png`;

    // Add timestamp overlay to screenshot
    await this.page.addStyleTag({
      content: `
        .proof-overlay {
          position: fixed;
          top: 10px;
          right: 10px;
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 8px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          z-index: 10000;
        }
      `,
    });

    await this.page.evaluate((desc) => {
      const overlay = document.createElement("div");
      overlay.className = "proof-overlay";
      overlay.innerHTML = `
        <div>Test: ${document.title}</div>
        <div>Time: ${new Date().toLocaleString()}</div>
        ${desc ? `<div>Note: ${desc}</div>` : ""}
      `;
      document.body.appendChild(overlay);
    }, description);

    await this.page.screenshot({
      path: `test-results/proof-screenshots/${filename}`,
      fullPage: true,
    });

    console.log(`📸 Proof screenshot saved: ${filename}`);
    return filename;
  }

  /**
   * Wait for auto-refresh cycle
   */
  async waitForAutoRefresh(expectedRefreshRate = null) {
    const refreshRate = expectedRefreshRate || (await this.getRefreshRate());
    if (refreshRate <= 0) {
      console.log("⚠️  Auto-refresh disabled, skipping wait");
      return;
    }

    console.log(`⏱️  Waiting for auto-refresh cycle (${refreshRate}s)...`);
    await this.page.waitForTimeout((refreshRate + 1) * 1000); // Add 1s buffer
  }

  /**
   * Monitor console for specific messages
   */
  async waitForConsoleMessage(messagePattern, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Console message "${messagePattern}" not found within ${timeout}ms`));
      }, timeout);

      const handler = (msg) => {
        if (msg.text().includes(messagePattern)) {
          clearTimeout(timeoutId);
          this.page.off("console", handler);
          resolve(msg.text());
        }
      };

      this.page.on("console", handler);
    });
  }

  /**
   * Get all available dropdowns on the page
   */
  async getDropdowns() {
    return await this.page.$$(".fvtt-party-sheet-dropdown");
  }

  /**
   * Get dropdown current value
   */
  async getDropdownValue(selector) {
    return await this.page.$eval(selector, (el) => el.value);
  }

  /**
   * Get visible dropdown content
   */
  async getVisibleDropdownContent(dropdownSection) {
    return await this.page.$eval(
      `div[data-dropdownsection="${dropdownSection}"][style*="display: block"]`,
      (el) => el.textContent,
    );
  }

  /**
   * Click the Party Sheet button
   */
  async clickPartySheet() {
    await this.page.getByRole("button", { name: "Party Sheet", exact: true }).click();
  }

  /**
   * Enable the OnlyOnline setting
   */
  async enableOnlyOnline() {
    try {
      const checkbox = this.page.locator('input[name="fvtt-party-sheet.enableOnlyOnline"]');
      await checkbox.waitFor({ state: "visible", timeout: 5000 });
      if (!(await checkbox.isChecked())) {
        await checkbox.check();
      }
    } catch (error) {
      console.error("Failed to enable OnlyOnline:", error);
      throw error;
    }
  }

  /**
   * Disable the OnlyOnline setting
   */
  async disableOnlyOnline() {
    try {
      const checkbox = this.page.locator('input[name="fvtt-party-sheet.enableOnlyOnline"]');
      await checkbox.waitFor({ state: "visible", timeout: 5000 });
      if (await checkbox.isChecked()) {
        await checkbox.uncheck();
      }
    } catch (error) {
      console.error("Failed to disable OnlyOnline:", error);
      throw error;
    }
  }

  /**
   * Open the settings panel
   */
  async openSettingsPanel() {
    try {
      await this.page.getByRole("tab", { name: "Game Settings" }).click();
      await this.page.waitForTimeout(1000);

      await this.page.getByRole("button", { name: " Configure Settings" }).click();
      await this.page.waitForTimeout(1000);

      await this.page.getByRole("button", { name: "Party Sheet [7]" }).click();
      await this.page.waitForTimeout(1000);
    } catch (error) {
      console.error("Failed to open settings panel:", error);
      throw error;
    }
  }

  /**
   * Close and reopen the Party Sheet
   */
  async closeAndReopenPartySheet() {
    const isPartySheetOpen = await this.page.getByRole("dialog", { name: "Party Sheet" }).isVisible();
    if (isPartySheetOpen) {
      try {
        await this.page.getByRole("button", { name: "Close" }).click();
        await this.page.waitForTimeout(1000);
      } catch (error) {
        console.error("Failed to close and reopen party sheet:", error);
        throw error;
      }
    }
    await this.clickPartySheet();
  }

  /**
   * Modify the refresh timer setting
   */
  async modifyRefreshTimer(newInterval) {
    try {
      const inputField = this.page.getByRole("spinbutton");
      await inputField.waitFor({ state: "visible", timeout: 5000 });
      await inputField.fill(newInterval.toString());
      await inputField.press("Enter");
    } catch (error) {
      console.error("Failed to modify refresh timer:", error);
      throw error;
    }
  }

  /**
   * Save the settings
   */
  async saveSettings() {
    await this.page.locator('footer > button[type="submit"]').click();
  }
}
