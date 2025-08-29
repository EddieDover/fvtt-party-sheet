import { jest } from "@jest/globals";
import {
  parseSpacing,
  parseNewlines,
  extractPropertyByString,
  addSign,
  compareSymVer,
  validateSystemTemplates,
  showVersionDifferenceNotifications,
  areTemplatesLoaded,
  setTemplatesLoaded,
  getModuleTemplates,
  isForgeVTT,
  getModuleTemplate,
  loadSystemTemplate,
  getAllSystemVersions,
  loadSystemTemplates,
  loadModuleTemplates,
  toProperCase,
  updateSelectedTemplate,
  getSelectedTemplate,
  addCustomTemplate,
  clearCustomTemplates,
  getCustomTemplates,
  trimIfString,
  parseFontAwesome,
  getFoundryVersion,
  isVersionAtLeast,
  TemplateProcessError,
} from "../src/module/utils";
import { setupFoundryMocks, cleanupFoundryMocks, mockTemplateData, versionTestCases } from "./test-mocks.js";

describe("Utils testing", () => {
  describe("Spacing parsing", () => {
    it("will parse a simple request", () => {
      const result = parseSpacing("Hello {s3} World", false);
      expect(result.value).toEqual("Hello &nbsp;&nbsp;&nbsp; World");
      expect(result.isSafeStringNeeded).toEqual(true);
    });

    it("will parse a request with zero spacing", () => {
      const result = parseSpacing("Hello {s0} World", false);
      expect(result.value).toEqual("HelloWorld");
      expect(result.isSafeStringNeeded).toEqual(true);
    });

    it("will parse a request with multiple spacings", () => {
      const result = parseSpacing("Hello {s2} beautiful {s4} World", false);
      expect(result.value).toEqual("Hello &nbsp;&nbsp; beautiful &nbsp;&nbsp;&nbsp;&nbsp; World");
      expect(result.isSafeStringNeeded).toEqual(true);
    });

    it("will fail to parse a request with negative spacing", () => {
      const result = parseSpacing("Hello {s-2} World", false);
      expect(result.value).toEqual("Hello {s-2} World");
      expect(result.isSafeStringNeeded).toEqual(false);
    });

    it("will parse a request with mixed spacings", () => {
      const result = parseSpacing("Hello {s2} {s0} beautiful {s-3} World", false);
      expect(result.value).toEqual("Hello &nbsp;&nbsp;beautiful {s-3} World");
      expect(result.isSafeStringNeeded).toEqual(true);
    });

    it("will parse a request with no spacings", () => {
      const result = parseSpacing("Hello World", false);
      expect(result.value).toEqual("Hello World");
      expect(result.isSafeStringNeeded).toEqual(false);
    });
  });

  describe("Newline parsing", () => {
    it("will parse a simple request", () => {
      const result = parseNewlines("Hello{nl}World", false);
      expect(result.value).toEqual("Hello<br/>World");
      expect(result.isSafeStringNeeded).toEqual(true);
    });

    it("will parse a request with multiple newlines", () => {
      const result = parseNewlines("Hello{nl}{nl}{nl}World", false);
      expect(result.value).toEqual("Hello<br/><br/><br/>World");
      expect(result.isSafeStringNeeded).toEqual(true);
    });

    it("will parse a request with mixed newlines and text", () => {
      const result = parseNewlines("Hello{nl}beautiful{nl}World", false);
      expect(result.value).toEqual("Hello<br/>beautiful<br/>World");
      expect(result.isSafeStringNeeded).toEqual(true);
    });

    it("will not parse a request without newlines", () => {
      const result = parseNewlines("Hello World", false);
      expect(result.value).toEqual("Hello World");
      expect(result.isSafeStringNeeded).toEqual(false);
    });
  });

  describe("addSign parsing", () => {
    it("will show a negative sign", () => {
      expect(addSign(-1)).toEqual("-1");
    });

    it("will show a positive sign", () => {
      expect(addSign(1)).toEqual("+1");
    });

    it("will show a positive sign for a string", () => {
      expect(addSign("1")).toEqual("+1");
    });

    it("will show a negative sign for a string", () => {
      expect(addSign("-1")).toEqual("-1");
    });

    it("will show a positive sign for a string with a plus sign", () => {
      expect(addSign("+1")).toEqual("+1");
    });

    it("will show a negative sign for a string with a minus sign", () => {
      expect(addSign("-1")).toEqual("-1");
    });

    it("will not show a sign for a zero", () => {
      expect(addSign(0)).toEqual("0");
    });

    it("will not show a sign for a string zero", () => {
      expect(addSign("0")).toEqual("0");
    });
  });

  describe("extractPropertyByString testing", () => {
    it("should return the property value when the path is valid", () => {
      const obj = {
        foo: {
          bar: {
            baz: "Hello World",
          },
        },
      };
      const result = extractPropertyByString(obj, "foo.bar.baz");
      expect(result).toEqual("Hello World");
    });

    it("should return undefined when the path is invalid", () => {
      const obj = {
        foo: {
          bar: {
            baz: "Hello World",
          },
        },
      };
      const result = extractPropertyByString(obj, "foo.bar.qux");
      expect(result).toBeUndefined();
    });

    it("should return the property value when the path contains numbers", () => {
      const obj = {
        foo: {
          1: {
            2: "Hello World",
          },
        },
      };
      const result = extractPropertyByString(obj, "foo.1.2");
      expect(result).toEqual("Hello World");
    });

    it("should return the property value when the path contains booleans", () => {
      const obj = {
        foo: {
          true: {
            false: "Hello World",
          },
        },
      };
      const result = extractPropertyByString(obj, "foo.true.false");
      expect(result).toEqual("Hello World");
    });

    it("should not return the property value when the path contains special characters", () => {
      const obj = {
        "foo.bar": {
          "baz.qux": "Hello World",
        },
      };
      const result = extractPropertyByString(obj, "foo.bar.baz.qux");
      expect(result).toEqual(undefined);
    });

    it("should return the property value when the path contains arrays", () => {
      const obj = {
        foo: [
          {
            bar: "Hello",
          },
          {
            bar: "World",
          },
        ],
      };
      const result = extractPropertyByString(obj, "foo.1.bar");
      expect(result).toEqual("World");
    });

    it("should return the property value when the path contains nested objects and arrays", () => {
      const obj = {
        foo: {
          bar: [
            {
              baz: "Hello",
            },
            {
              baz: "World",
            },
          ],
        },
      };
      const result = extractPropertyByString(obj, "foo.bar.1.baz");
      expect(result).toEqual("World");
    });

    it("should return the property value when the path contains null values", () => {
      const obj = {
        foo: {
          bar: null,
        },
      };
      const result = extractPropertyByString(obj, "foo.bar");
      expect(result).toBeNull();
    });

    it("should return the property value when the path contains undefined values", () => {
      const obj = {
        foo: {
          bar: undefined,
        },
      };
      const result = extractPropertyByString(obj, "foo.bar");
      expect(result).toBeUndefined();
    });

    it("should return the property value when the path contains empty strings", () => {
      const obj = {
        foo: {
          bar: "",
        },
      };
      const result = extractPropertyByString(obj, "foo.bar");
      expect(result).toEqual("");
    });
  });

  describe("Version Comparison and Validation", () => {
    describe("compareSymVer function", () => {
      it("should return 0 for identical versions", () => {
        versionTestCases.identical.forEach(([v1, v2, expected]) => {
          expect(compareSymVer(v1, v2)).toBe(expected);
        });
      });

      it("should return negative value when first version is lower", () => {
        versionTestCases.firstLower.forEach(([v1, v2]) => {
          expect(compareSymVer(v1, v2)).toBeLessThan(0);
        });
      });

      it("should return positive value when first version is higher", () => {
        versionTestCases.firstHigher.forEach(([v1, v2]) => {
          expect(compareSymVer(v1, v2)).toBeGreaterThan(0);
        });
      });

      it("should handle mixed version formats correctly", () => {
        expect(compareSymVer("1.0", "1.0.0")).toBe(0);
        expect(compareSymVer("1.0.0", "1.0")).toBe(0);
        expect(compareSymVer("1.1", "1.0.5")).toBeGreaterThan(0);
        expect(compareSymVer("1.0.5", "1.1")).toBeLessThan(0);
      });

      it("should handle version strings with leading zeros", () => {
        expect(compareSymVer("1.0.1", "1.0.01")).toBe(0);
        expect(compareSymVer("1.01.0", "1.1.0")).toBe(0);
        expect(compareSymVer("01.0.0", "1.0.0")).toBe(0);
      });

      it("should handle complex version comparisons", () => {
        expect(compareSymVer("1.9.9", "2.0.0")).toBeLessThan(0);
        expect(compareSymVer("2.0.0", "1.9.9")).toBeGreaterThan(0);
        expect(compareSymVer("1.10.0", "1.9.0")).toBeGreaterThan(0);
        expect(compareSymVer("1.9.0", "1.10.0")).toBeLessThan(0);
      });

      it("should handle invalid or malformed version strings gracefully", () => {
        // Should not throw errors
        expect(() => compareSymVer("", "1.0.0")).not.toThrow();
        expect(() => compareSymVer("1.0.0", "")).not.toThrow();
        expect(() => compareSymVer("abc", "1.0.0")).not.toThrow();
        expect(() => compareSymVer("1.0.0", "xyz")).not.toThrow();
      });
    });

    describe("System version filtering logic", () => {
      const mockTemplates = [
        mockTemplateData.withMaxVersion, // Template A: min 1.0, max 2.0
        mockTemplateData.basic, // Template B: min 1.5, no max
        mockTemplateData.highRequirements, // Template C: min 2.5, max 3.0
      ];

      it("should filter templates correctly based on system version range", () => {
        // Test current system version 1.8
        const currentVersion = "1.8";

        // Template A: min 1.0, max 2.0 - should be included (1.8 is within range)
        expect(compareSymVer(currentVersion, mockTemplates[0].minimumSystemVersion)).toBeGreaterThanOrEqual(0);
        expect(compareSymVer(currentVersion, mockTemplates[0].maximumSystemVersion)).toBeLessThanOrEqual(0);

        // Template B: min 1.5, no max - should be included (1.8 >= 1.5)
        expect(compareSymVer(currentVersion, mockTemplates[1].minimumSystemVersion)).toBeGreaterThanOrEqual(0);

        // Template C: min 2.5, max 3.0 - should be excluded (1.8 < 2.5)
        expect(compareSymVer(currentVersion, mockTemplates[2].minimumSystemVersion)).toBeLessThan(0);
      });

      it("should handle edge cases in version range filtering", () => {
        const currentVersion = "2.0";

        // Exactly at maximum version
        expect(compareSymVer(currentVersion, mockTemplates[0].maximumSystemVersion)).toBe(0);

        // Above minimum version with no maximum
        expect(compareSymVer(currentVersion, mockTemplates[1].minimumSystemVersion)).toBeGreaterThan(0);
      });

      it("should handle system version above maximum correctly", () => {
        const currentVersion = "2.5";

        // Template A: min 1.0, max 2.0 - should be excluded (2.5 > 2.0)
        expect(compareSymVer(currentVersion, mockTemplates[0].maximumSystemVersion)).toBeGreaterThan(0);

        // Template B: min 1.5, no max - should be included (2.5 >= 1.5, no upper limit)
        expect(compareSymVer(currentVersion, mockTemplates[1].minimumSystemVersion)).toBeGreaterThan(0);

        // Template C: min 2.5, max 3.0 - should be included (2.5 >= 2.5 and 2.5 <= 3.0)
        expect(compareSymVer(currentVersion, mockTemplates[2].minimumSystemVersion)).toBeGreaterThanOrEqual(0);
        expect(compareSymVer(currentVersion, mockTemplates[2].maximumSystemVersion)).toBeLessThanOrEqual(0);
      });
    });

    describe("Template version comparison logic", () => {
      const mockInstalledTemplate = {
        name: "Test Template",
        author: "Test Author",
        version: "1.5.0",
      };

      const mockModuleTemplate = {
        name: "Test Template",
        author: "Test Author",
        version: "1.6.0",
      };

      it("should detect when module template has newer version", () => {
        expect(compareSymVer(mockInstalledTemplate.version, mockModuleTemplate.version)).toBeLessThan(0);
      });

      it("should detect when versions are identical", () => {
        const identicalTemplate = { ...mockModuleTemplate, version: "1.5.0" };
        expect(compareSymVer(mockInstalledTemplate.version, identicalTemplate.version)).toBe(0);
      });

      it("should detect when installed template is newer", () => {
        const olderModuleTemplate = { ...mockModuleTemplate, version: "1.4.0" };
        expect(compareSymVer(mockInstalledTemplate.version, olderModuleTemplate.version)).toBeGreaterThan(0);
      });
    });

    describe("showVersionDifferenceNotifications", () => {
      let consoleSpy;

      beforeEach(() => {
        setupFoundryMocks();
        // Mock console.log to suppress the log function output during tests
        consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      });

      afterEach(() => {
        cleanupFoundryMocks();
        if (consoleSpy) {
          consoleSpy.mockRestore();
        }
      });

      it("should not show notification when no templates need updates", () => {
        const validationData = {
          outOfDateTemplates: [],
        };

        showVersionDifferenceNotifications(validationData);
        expect(global.ui.notifications.warn).not.toHaveBeenCalled();
      });

      it("should show notification when templates need updates", () => {
        const validationData = {
          outOfDateTemplates: [
            { name: "Template 1", author: "Author 1", system: "dnd5e" },
            { name: "Template 2", author: "Author 2", system: "dnd5e" },
          ],
        };

        showVersionDifferenceNotifications(validationData);
        expect(global.ui.notifications.warn).toHaveBeenCalledTimes(1);
      });

      it("should only count templates for current system", () => {
        const validationData = {
          outOfDateTemplates: [
            { name: "Template 1", author: "Author 1", system: "dnd5e" },
            { name: "Template 2", author: "Author 2", system: "pf2e" }, // Different system
            { name: "Template 3", author: "Author 3", system: "dnd5e" },
          ],
        };

        showVersionDifferenceNotifications(validationData);
        expect(global.ui.notifications.warn).toHaveBeenCalledTimes(1);

        const notificationCall = global.ui.notifications.warn.mock.calls[0][0];
        expect(notificationCall).toContain("2"); // Should only count dnd5e templates
      });

      it("should not show notification when user is not GM", () => {
        // Set user as non-GM
        global.game.user.isGM = false;

        const validationData = {
          outOfDateTemplates: [{ name: "Template 1", author: "Author 1", system: "dnd5e" }],
        };

        showVersionDifferenceNotifications(validationData);
        expect(global.ui.notifications.warn).not.toHaveBeenCalled();
      });

      it("should not show notification when showVersionNotifications setting is disabled", () => {
        // Disable the setting
        global.game.settings.get.mockReturnValue(false);

        const validationData = {
          outOfDateTemplates: [{ name: "Template 1", author: "Author 1", system: "dnd5e" }],
        };

        showVersionDifferenceNotifications(validationData);
        expect(global.ui.notifications.warn).not.toHaveBeenCalled();
      });
    });
  });

  describe("Handlebars Helper Version Logic", () => {
    beforeEach(() => {
      setupFoundryMocks({ system: { version: "2.0" } });
      // Mock the compareSymVer function being available globally
      global.utils = { compareSymVer };
    });

    afterEach(() => {
      cleanupFoundryMocks();
      delete global.utils;
    });

    describe("systemVersionInRange helper logic", () => {
      it("should return true when system version is within range", () => {
        const currentVersion = "2.0";
        const minVersion = "1.5";
        const maxVersion = "2.5";

        const aboveMin = compareSymVer(currentVersion, minVersion) >= 0;
        const belowMax = !maxVersion || compareSymVer(currentVersion, maxVersion) <= 0;
        const inRange = aboveMin && belowMax;

        expect(inRange).toBe(true);
      });

      it("should return false when system version is below minimum", () => {
        const currentVersion = "1.0";
        const minVersion = "1.5";
        const maxVersion = "2.5";

        const aboveMin = compareSymVer(currentVersion, minVersion) >= 0;
        const belowMax = !maxVersion || compareSymVer(currentVersion, maxVersion) <= 0;
        const inRange = aboveMin && belowMax;

        expect(inRange).toBe(false);
      });

      it("should return false when system version is above maximum", () => {
        const currentVersion = "3.0";
        const minVersion = "1.5";
        const maxVersion = "2.5";

        const aboveMin = compareSymVer(currentVersion, minVersion) >= 0;
        const belowMax = !maxVersion || compareSymVer(currentVersion, maxVersion) <= 0;
        const inRange = aboveMin && belowMax;

        expect(inRange).toBe(false);
      });

      it("should return true when no maximum version is specified", () => {
        const currentVersion = "3.0";
        const minVersion = "1.5";
        const maxVersion = null;

        const aboveMin = compareSymVer(currentVersion, minVersion) >= 0;
        const belowMax = !maxVersion || compareSymVer(currentVersion, maxVersion) <= 0;
        const inRange = aboveMin && belowMax;

        expect(inRange).toBe(true);
      });
    });

    describe("systemVersionAboveMax helper logic", () => {
      it("should return true when system version is above maximum", () => {
        const currentVersion = "3.0";
        const maxVersion = "2.5";

        const aboveMax = compareSymVer(currentVersion, maxVersion) > 0;
        expect(aboveMax).toBe(true);
      });

      it("should return false when system version is at maximum", () => {
        const currentVersion = "2.5";
        const maxVersion = "2.5";

        const aboveMax = compareSymVer(currentVersion, maxVersion) > 0;
        expect(aboveMax).toBe(false);
      });

      it("should return false when system version is below maximum", () => {
        const currentVersion = "2.0";
        const maxVersion = "2.5";

        const aboveMax = compareSymVer(currentVersion, maxVersion) > 0;
        expect(aboveMax).toBe(false);
      });

      it("should return false when no maximum version is specified", () => {
        const currentVersion = "3.0";
        const maxVersion = null;

        const aboveMax = maxVersion ? compareSymVer(currentVersion, maxVersion) > 0 : false;
        expect(aboveMax).toBe(false);
      });
    });

    describe("systemVersionBelowMin helper logic", () => {
      it("should return true when system version is below minimum", () => {
        const currentVersion = "1.0";
        const minVersion = "1.5";

        const belowMin = compareSymVer(currentVersion, minVersion) < 0;
        expect(belowMin).toBe(true);
      });

      it("should return false when system version is at minimum", () => {
        const currentVersion = "1.5";
        const minVersion = "1.5";

        const belowMin = compareSymVer(currentVersion, minVersion) < 0;
        expect(belowMin).toBe(false);
      });

      it("should return false when system version is above minimum", () => {
        const currentVersion = "2.0";
        const minVersion = "1.5";

        const belowMin = compareSymVer(currentVersion, minVersion) < 0;
        expect(belowMin).toBe(false);
      });
    });
  });

  describe("Template Loading and Management Functions", () => {
    describe("areTemplatesLoaded and setTemplatesLoaded", () => {
      it("should return false initially", () => {
        expect(areTemplatesLoaded()).toBe(false);
      });

      it("should set and get templates loaded status", () => {
        setTemplatesLoaded(true);
        expect(areTemplatesLoaded()).toBe(true);

        setTemplatesLoaded(false);
        expect(areTemplatesLoaded()).toBe(false);
      });
    });

    describe("getModuleTemplates", () => {
      it("should return the module templates array", () => {
        const templates = getModuleTemplates();
        expect(Array.isArray(templates)).toBe(true);
      });
    });

    describe("getModuleTemplate", () => {
      beforeEach(() => {
        global.fetch = jest.fn();
      });

      afterEach(() => {
        delete global.fetch;
      });

      it("should return null for invalid JSON", async () => {
        global.fetch.mockResolvedValue({
          text: () => Promise.resolve("invalid json"),
        });

        const result = await getModuleTemplate("test/path.json");
        expect(result).toBeNull();
      });

      it("should return null for incomplete template data", async () => {
        global.fetch.mockResolvedValue({
          text: () =>
            Promise.resolve(
              JSON.stringify({
                name: "Test",
                // Missing required fields
              }),
            ),
        });

        const result = await getModuleTemplate("test/path.json");
        expect(result).toBeNull();
      });

      it("should return template with path and preview for valid data", async () => {
        const validTemplate = {
          name: "Test Template",
          author: "Test Author",
          system: "dnd5e",
          rows: [],
        };

        global.fetch.mockResolvedValue({
          text: () => Promise.resolve(JSON.stringify(validTemplate)),
        });

        const result = await getModuleTemplate("example_templates/dnd5e/template.json");
        expect(result).toEqual({
          ...validTemplate,
          path: "example_templates/dnd5e/template.json",
          preview: "dnd5e/template.jpg",
        });
      });

      it("should return null when fetch fails", async () => {
        global.fetch.mockRejectedValue(new Error("Network error"));

        const result = await getModuleTemplate("test/path.json");
        expect(result).toBeNull();
      });
    });

    describe("loadSystemTemplate", () => {
      let consoleSpy;
      let consoleErrorSpy;

      beforeEach(() => {
        global.fetch = jest.fn();
        consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      });

      afterEach(() => {
        delete global.fetch;
        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
      });

      it("should load and process template successfully", async () => {
        const validTemplate = {
          name: "Test Template",
          author: "Test Author",
          system: "dnd5e",
          version: "1.0.0",
          minimumSystemVersion: "1.0",
          rows: [],
        };

        global.fetch.mockResolvedValue({
          text: () => Promise.resolve(JSON.stringify(validTemplate)),
        });

        await loadSystemTemplate("data/partysheets/template.json");
        expect(consoleSpy).toHaveBeenCalledWith("fvtt-party-sheet | ", "Loading template: template");
      });

      it("should handle fetch errors gracefully", async () => {
        global.fetch.mockRejectedValue(new Error("Network error"));

        await expect(loadSystemTemplate("invalid/path.json")).resolves.not.toThrow();
      });
    });

    describe("getAllSystemVersions", () => {
      let consoleLogSpy;
      let consoleErrorSpy;
      beforeEach(() => {
        setupFoundryMocks();
        consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        // Mock FilePicker for getAllSystemVersions tests
        global.FilePicker = {
          browse: jest.fn().mockResolvedValue({
            dirs: [],
            files: [],
          }),
        };
        global.fetch = jest.fn();
      });

      afterEach(() => {
        cleanupFoundryMocks();
        delete global.FilePicker;
        delete global.fetch;
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
      });

      it("should return system versions when FilePicker exists", async () => {
        const mockSystemData1 = { id: "dnd5e", version: "2.1.5" };
        const mockSystemData2 = { id: "pf2e", version: "4.2.3" };

        global.fetch
          .mockResolvedValueOnce({ text: () => Promise.resolve(JSON.stringify(mockSystemData1)) })
          .mockResolvedValueOnce({ text: () => Promise.resolve(JSON.stringify(mockSystemData2)) });

        // Override the default FilePicker mock for this specific test
        global.FilePicker.browse = jest
          .fn()
          .mockResolvedValueOnce({
            dirs: ["systems/dnd5e", "systems/pf2e"],
          })
          .mockResolvedValueOnce({
            files: ["systems/dnd5e/system.json"],
          })
          .mockResolvedValueOnce({
            files: ["systems/pf2e/system.json"],
          });

        const result = await getAllSystemVersions();
        expect(result).toEqual([
          { system: "dnd5e", version: "2.1.5" },
          { system: "pf2e", version: "4.2.3" },
        ]);
      });

      it("should return empty array when FilePicker fails", async () => {
        // Override the default FilePicker mock to simulate failure
        global.FilePicker.browse = jest.fn().mockRejectedValue(new Error("Browse failed"));

        const result = await getAllSystemVersions();
        expect(result).toEqual([]);
        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Utility Functions", () => {
    describe("toProperCase", () => {
      it("should convert first letter to uppercase", () => {
        expect(toProperCase("hello")).toBe("Hello");
        expect(toProperCase("HELLO")).toBe("Hello");
        expect(toProperCase("hELLO")).toBe("Hello");
      });

      it("should handle empty strings", () => {
        expect(toProperCase("")).toBe("");
      });

      it("should handle single characters", () => {
        expect(toProperCase("a")).toBe("A");
        expect(toProperCase("Z")).toBe("Z");
      });
    });

    describe("template selection functions", () => {
      it("should update and get selected template", () => {
        const template = mockTemplateData.basic;

        updateSelectedTemplate(template);
        expect(getSelectedTemplate()).toBe(template);

        updateSelectedTemplate(null);
        expect(getSelectedTemplate()).toBeNull();
      });
    });

    describe("custom template management", () => {
      beforeEach(() => {
        clearCustomTemplates();
      });

      it("should start with empty custom templates", () => {
        expect(getCustomTemplates()).toEqual([]);
      });

      it("should add custom templates for system", () => {
        const mockTemplate = {
          system: "dnd5e",
          name: "Custom Template",
          author: "Test Author",
        };
        addCustomTemplate(mockTemplate);
        const templates = getCustomTemplates();

        expect(templates).toHaveLength(1);
        expect(templates[0].system).toBe("dnd5e");
        expect(templates[0].name).toBe("Custom Template");
      });

      it("should clear custom templates", () => {
        addCustomTemplate("dnd5e");
        addCustomTemplate("pf2e");
        expect(getCustomTemplates()).toHaveLength(2);

        clearCustomTemplates();
        expect(getCustomTemplates()).toEqual([]);
      });
    });

    describe("trimIfString", () => {
      const mockDirectComplexTextObject = {
        type: "match",
        ifdata: "system.general.career",
        matches: "1",
        text: "Colonial Marine",
      };
      it("should trim strings", () => {
        expect(trimIfString(mockDirectComplexTextObject)).toBe(mockDirectComplexTextObject);
        expect(trimIfString({ ...mockDirectComplexTextObject, text: "   Colonial Super Marine    " })).toMatchObject({
          ...mockDirectComplexTextObject,
          text: "Colonial Super Marine",
        });
      });

      it("should not affect non-strings", () => {
        const badComplexObject = {
          ...mockDirectComplexTextObject,
          text: 123,
        };
        expect(trimIfString(badComplexObject)).toBe(badComplexObject);
      });
    });

    describe("parseFontAwesome", () => {
      it("should parse FontAwesome tags", () => {
        const result = parseFontAwesome("Click {fa fa-home} here", false);
        expect(result.value).toBe('Click <i class="fa fa-home"></i> here');
        expect(result.isSafeStringNeeded).toBe(true);
      });

      it("should handle multiple FontAwesome icons", () => {
        const result = parseFontAwesome("{fa fa-user} Profile {fa fa-settings}", false);
        expect(result.value).toBe('<i class="fa fa-user"></i> Profile <i class="fa fa-settings"></i>');
        expect(result.isSafeStringNeeded).toBe(true);
      });

      it("should return original when no FA tags", () => {
        const result = parseFontAwesome("No icons here", false);
        expect(result.value).toBe("No icons here");
        expect(result.isSafeStringNeeded).toBe(false);
      });

      it("should preserve existing isSafeStringNeeded flag", () => {
        const result = parseFontAwesome("No icons", true);
        expect(result.isSafeStringNeeded).toBe(true);
      });
    });

    describe("getFoundryVersion and isVersionAtLeast", () => {
      beforeEach(() => {
        setupFoundryMocks();
      });

      afterEach(() => {
        cleanupFoundryMocks();
      });

      it("should get Foundry version when game exists", () => {
        global.game.version = "11.315";
        expect(getFoundryVersion()).toMatchObject({
          major: 11,
          minor: 315,
          full: "11.315",
        });
      });

      it("should check if version is at least specified major version", () => {
        global.game.version = "11.315";
        expect(isVersionAtLeast(10)).toBe(true);
        expect(isVersionAtLeast(11)).toBe(true);
        expect(isVersionAtLeast(12)).toBe(false);
      });
    });
  });

  describe("Error Classes", () => {
    describe("TemplateProcessError", () => {
      it("should create error with correct name and data structure", () => {
        const error = new TemplateProcessError("Test error message");

        expect(error.name).toBe("TemplateProcessError");
        expect(error.message).toBe("Test error message");
        expect(error.data).toEqual({
          name: "",
          author: "",
        });
        expect(error instanceof Error).toBe(true);
      });
    });
  });

  describe("Async Template Loading Functions", () => {
    let consoleSpy;

    beforeEach(() => {
      setupFoundryMocks();
      global.fetch = jest.fn();
      consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // Mock FilePicker for all async template loading tests
      global.FilePicker = {
        browse: jest.fn().mockResolvedValue({
          dirs: [],
          files: [],
        }),
      };
    });

    afterEach(() => {
      cleanupFoundryMocks();
      delete global.fetch;
      delete global.FilePicker;
      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    describe("loadSystemTemplates", () => {
      it("should load system templates successfully", async () => {
        // Override the default FilePicker mock for this specific test
        global.FilePicker.browse = jest.fn().mockResolvedValue({
          files: ["template1.json", "template2.json"],
        });

        global.fetch
          .mockResolvedValueOnce({
            text: () =>
              Promise.resolve(
                JSON.stringify({
                  name: "Template 1",
                  author: "Author 1",
                  system: "dnd5e",
                  version: "1.0.0",
                  minimumSystemVersion: "1.0",
                  rows: [],
                }),
              ),
          })
          .mockResolvedValueOnce({
            text: () =>
              Promise.resolve(
                JSON.stringify({
                  name: "Template 2",
                  author: "Author 2",
                  system: "dnd5e",
                  version: "1.0.0",
                  minimumSystemVersion: "1.0",
                  rows: [],
                }),
              ),
          });

        await loadSystemTemplates();
        expect(consoleSpy).toHaveBeenCalledTimes(5);
        expect(consoleSpy).toHaveBeenCalledWith("Failed creating PartySheets directory. It probably already exists.");
        expect(consoleSpy).toHaveBeenCalledWith("fvtt-party-sheet | ", "Loading template: template1");
        expect(consoleSpy).toHaveBeenCalledWith("template1.json - Good Template - Min system: 1.0");
      });

      it("should load invalid templates gracefully", async () => {
        // Override the default FilePicker mock for this specific test
        global.FilePicker.browse = jest.fn().mockResolvedValue({
          files: ["template1.json"],
        });

        global.fetch.mockResolvedValueOnce({
          text: () =>
            Promise.resolve(
              JSON.stringify({
                name: "Template 3",
                author: "Author 3",
                system: "dnd5e",
                rows: [],
              }),
            ),
        });

        await loadSystemTemplates();
        expect(consoleSpy).toHaveBeenCalledTimes(2);
        expect(consoleSpy).toHaveBeenCalledWith("fvtt-party-sheet | ", "Loading template: template1");
        expect(consoleWarnSpy).toHaveBeenCalledWith("template1.json - Missing Version Information");
      });

      it("should handle bad templates", async () => {
        // Override the default FilePicker mock for this specific test
        global.FilePicker.browse = jest.fn().mockResolvedValue({
          files: ["template1.json"],
        });

        global.fetch.mockResolvedValueOnce({
          text: () =>
            Promise.resolve(
              JSON.stringify({
                name: "Template 3",
                author: "Author 3",
                system: "dnd5e",
                version: "1.0.0",
              }),
            ),
        });

        await loadSystemTemplates();
        expect(consoleSpy).toHaveBeenCalledTimes(2);
        expect(consoleSpy).toHaveBeenCalledWith("fvtt-party-sheet | ", "Loading template: template1");
        expect(consoleErrorSpy).toHaveBeenCalledWith("template1.json - Bad Template");
      });

      it("should detect duplicate templates", async () => {
        // Override the default FilePicker mock for this specific test
        global.FilePicker.browse = jest.fn().mockResolvedValue({
          files: ["template1.json", "template2.json"],
        });

        global.fetch
          .mockResolvedValueOnce({
            text: () =>
              Promise.resolve(
                JSON.stringify({
                  name: "Template 3",
                  author: "Author 3",
                  system: "dnd5e",
                  version: "1.0.0",
                  rows: [],
                }),
              ),
          })
          .mockResolvedValueOnce({
            text: () =>
              Promise.resolve(
                JSON.stringify({
                  name: "Template 3",
                  author: "Author 3",
                  system: "dnd5e",
                  version: "1.0.0",
                  rows: [],
                }),
              ),
          });

        await loadSystemTemplates();
        expect(consoleSpy).toHaveBeenCalledTimes(3);
        expect(consoleSpy).toHaveBeenCalledWith("fvtt-party-sheet | ", "Loading template: template1");
        expect(consoleWarnSpy).toHaveBeenCalledWith("template2.json - Duplicate Template");
      });

      it("should handle errors in template loading", async () => {
        // Override the default FilePicker mock to simulate failure
        global.FilePicker.browse = jest.fn().mockRejectedValue(new Error("Browse failed"));

        await expect(loadSystemTemplates()).rejects.toThrow("Browse failed");
      });
    });

    describe("loadModuleTemplates", () => {
      it("should load module templates from predefined paths", async () => {
        const validTemplate = {
          name: "Module Template",
          author: "Module Author",
          system: "dnd5e",
          version: "1.0.0",
          minimumSystemVersion: "1.0",
          rows: [],
        };

        // Override the default FilePicker mock for this specific test
        global.FilePicker.browse = jest
          .fn()
          .mockResolvedValueOnce({
            dirs: [
              "modules/fvtt-party-sheet/example_templates/dnd5e",
              "modules/fvtt-party-sheet/example_templates/pf2e",
            ],
          })
          .mockResolvedValueOnce({
            files: ["modules/fvtt-party-sheet/example_templates/dnd5e/template1.json"],
          })
          .mockResolvedValueOnce({
            files: ["modules/fvtt-party-sheet/example_templates/pf2e/template2.json"],
          });

        // Mock multiple fetch calls for different systems
        global.fetch.mockResolvedValue({
          text: () => Promise.resolve(JSON.stringify(validTemplate)),
        });

        await loadModuleTemplates();
        expect(global.fetch).toHaveBeenCalled();
      });

      it("should handle individual template loading failures", async () => {
        global.fetch.mockRejectedValue(new Error("Template not found"));

        await expect(loadModuleTemplates()).resolves.not.toThrow();
      });
    });

    describe("validateSystemTemplates edge cases", () => {
      it("should handle templates with missing system information", async () => {
        const templates = [
          {
            name: "Template without system info",
            author: "Author",
            version: "1.0.0",
            // Missing system and minimumSystemVersion
          },
        ];

        // Mock getCustomTemplates and getModuleTemplates to return test data
        jest.doMock("../src/module/utils", () => ({
          ...jest.requireActual("../src/module/utils"),
          getCustomTemplates: () => templates,
          getModuleTemplates: () => [],
        }));

        const result = await validateSystemTemplates();
        expect(result.noSystemInformation).toBeDefined();
      });
    });
  });

  describe("ForgeVTT", () => {
    let consoleLogSpy;

    beforeEach(() => {
      // Mock FilePicker for getAllSystemVersions tests
      global.FilePicker = {
        browse: jest.fn().mockResolvedValue({
          dirs: [],
          files: [],
        }),
      };
      global.fetch = jest.fn();
      global.ForgeVTT = {
        usingTheForge: true,
        ASSETS_LIBRARY_URL_PREFIX: "",
      };
      global.ForgeAPI = {
        getUserId: jest.fn().mockReturnValue(""),
      };
      consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      jest.clearAllMocks();
      delete global.ForgeVTT;
      delete global.ForgeAPI;
      delete global.fetch;
      delete global.FilePicker;
    });

    it("should recognize ForgeVTT", async () => {
      expect(isForgeVTT()).toBe(true);
    });

    it("should return true when ForgeVTT.usingTheForge is true", () => {
      global.ForgeVTT = { usingTheForge: true };
      expect(isForgeVTT()).toBe(true);
      delete global.ForgeVTT;
    });

    it("should return false when ForgeVTT.usingTheForge is false", () => {
      global.ForgeVTT = { usingTheForge: false };
      expect(isForgeVTT()).toBe(false);
      delete global.ForgeVTT;
    });

    it("loadSystemTemplates should handle if using ForgeVTT", async () => {
      await loadSystemTemplates();
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenCalledWith("Detected ForgeVTT");
    });

    it("getAllSystemVersions should handle if using ForgeVTT", async () => {
      global.ForgeVTT = {
        usingTheForge: true,
        ASSETS_LIBRARY_URL_PREFIX: "",
        getUserId: jest.fn().mockReturnValue(""),
      };
      const mockSystemData1 = { id: "dnd5e", version: "2.1.5" };
      global.fetch.mockResolvedValueOnce({ text: () => Promise.resolve(JSON.stringify(mockSystemData1)) });
      global.FilePicker.browse = jest
        .fn()
        .mockResolvedValueOnce({
          dirs: ["systems/dnd5e"],
        })
        .mockResolvedValueOnce({
          files: ["systems/dnd5e/system.json"],
        });
      await getAllSystemVersions();
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith("Detected ForgeVTT");
    });
  });
});
