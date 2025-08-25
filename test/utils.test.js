import { jest } from '@jest/globals';
import {
  parsePluses,
  parseSpacing,
  parseExtras,
  parseNewlines,
  extractPropertyByString,
  addSign,
  compareSymVer,
  validateSystemTemplates,
  showVersionDifferenceNotifications,
  log,
} from "../src/module/utils";
import { 
  setupFoundryMocks, 
  cleanupFoundryMocks, 
  mockTemplateData,
  versionTestCases
} from './test-mocks.js';

describe("Utils testing", () => {
  describe("Plus parsing", () => {
    it("will parse a simple request", () => {
      expect(parsePluses("1 {+} 2")).toEqual("3");
    });

    it("will parse a simple request with a space", () => {
      expect(parsePluses("1 {+} 2")).toEqual("3");
    });

    it("will parse a complex request", () => {
      expect(parsePluses("1 {+} 2 {+} 3")).toEqual("6");
    });

    it("will fail a complex request", () => {
      expect(parsePluses("1 {+} 2 {+} 3 {+}")).toEqual("6 {+}");
    });

    it("will fail a complex request again", () => {
      expect(parsePluses("1 {+} 2 {+} 3 {+} text")).toEqual("6 {+} text");
    });

    it("will parse a complex request again", () => {
      expect(parsePluses("1 {+} 2 {+} 3 {+} 10")).toEqual("16");
    });
  });

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

  describe("Extras parsing", () => {
    it("will parse a simple request with italics", () => {
      const result = parseExtras("Hello {i}World{/i}", false);
      expect(result[0]).toEqual(true);
      expect(result[1]).toEqual("Hello <i>World</i>");
    });

    it("will parse a simple request with bold", () => {
      const result = parseExtras("Hello {b}World{/b}", false);
      expect(result[0]).toEqual(true);
      expect(result[1]).toEqual("Hello <b>World</b>");
    });

    it("will parse a simple request with underline", () => {
      const result = parseExtras("Hello {u}World{/u}", false);
      expect(result[0]).toEqual(true);
      expect(result[1]).toEqual("Hello <u>World</u>");
    });

    it("will parse a complex request", () => {
      const result = parseExtras("Hello {i}beautiful {b}World{/b}{/i}", false);
      expect(result[0]).toEqual(true);
      expect(result[1]).toEqual("Hello <i>beautiful <b>World</b></i>");
    });

    it("will parse a request with multiple extras", () => {
      const result = parseExtras("Hello {i}beautiful {b}World{/b}{/i} with {u}underline{/u}", false);
      expect(result[0]).toEqual(true);
      expect(result[1]).toEqual("Hello <i>beautiful <b>World</b></i> with <u>underline</u>");
    });

    it("will parse a request with a font awesome icon", () => {
      const result = parseExtras("Hello {fa fa-solid fa-star} World", false);
      expect(result[0]).toEqual(true);
      expect(result[1]).toEqual('Hello <i class="fa fa-solid fa-star"></i> World');
    });

    it("will parse a request with no extras", () => {
      const result = parseExtras("Hello World", false);
      expect(result[0]).toEqual(false);
      expect(result[1]).toEqual("Hello World");
    });
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
      mockTemplateData.highRequirements // Template C: min 2.5, max 3.0
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
      version: "1.5.0"
    };

    const mockModuleTemplate = {
      name: "Test Template",
      author: "Test Author", 
      version: "1.6.0"
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
      consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      cleanupFoundryMocks();
      if (consoleSpy) {
        consoleSpy.mockRestore();
      }
    });

    it("should not show notification when no templates need updates", () => {
      const validationData = {
        outOfDateTemplates: []
      };

      showVersionDifferenceNotifications(validationData);
      expect(global.ui.notifications.warn).not.toHaveBeenCalled();
    });

    it("should show notification when templates need updates", () => {
      const validationData = {
        outOfDateTemplates: [
          { name: "Template 1", author: "Author 1", system: "dnd5e" },
          { name: "Template 2", author: "Author 2", system: "dnd5e" }
        ]
      };

      showVersionDifferenceNotifications(validationData);
      expect(global.ui.notifications.warn).toHaveBeenCalledTimes(1);
    });

    it("should only count templates for current system", () => {
      const validationData = {
        outOfDateTemplates: [
          { name: "Template 1", author: "Author 1", system: "dnd5e" },
          { name: "Template 2", author: "Author 2", system: "pf2e" }, // Different system
          { name: "Template 3", author: "Author 3", system: "dnd5e" }
        ]
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
        outOfDateTemplates: [
          { name: "Template 1", author: "Author 1", system: "dnd5e" }
        ]
      };

      showVersionDifferenceNotifications(validationData);
      expect(global.ui.notifications.warn).not.toHaveBeenCalled();
    });

    it("should not show notification when showVersionNotifications setting is disabled", () => {
      // Disable the setting
      global.game.settings.get.mockReturnValue(false);

      const validationData = {
        outOfDateTemplates: [
          { name: "Template 1", author: "Author 1", system: "dnd5e" }
        ]
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
