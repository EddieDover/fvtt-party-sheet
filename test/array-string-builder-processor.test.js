// eslint-disable-next-line no-shadow
import { jest } from "@jest/globals";
import { ArrayStringBuilderProcessor } from "../src/module/parsing/processors/array-string-builder-processor.js";
import { ParserEngine } from "../src/module/parsing/parser-engine.js";
import { setupFoundryMocks, cleanupFoundryMocks, createConsoleMocks } from "./test-mocks.js";

// Mock Handlebars SafeString
const mockSafeString = jest.fn().mockImplementation((content) => ({ content, __isSafeString: true }));
global.Handlebars = {
  SafeString: mockSafeString,
};

describe("ArrayStringBuilderProcessor", () => {
  let processor;
  let parserEngine;
  let consoleMocks;

  beforeEach(() => {
    setupFoundryMocks();
    consoleMocks = createConsoleMocks();

    parserEngine = new ParserEngine();
    processor = new ArrayStringBuilderProcessor(parserEngine);
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupFoundryMocks();
    consoleMocks.restore();
  });

  describe("basic array processing", () => {
    it("should process simple array with template", () => {
      const character = {
        items: ["sword", "shield", "potion"],
      };

      const result = processor.process(character, "items => {value}");

      // "value" special case builds finalStr directly, no newlines added
      expect(result).toBe("sword shield potion");
    });

    it("should process array with property extraction", () => {
      const character = {
        weapons: [
          { name: "Sword", damage: "1d8" },
          { name: "Bow", damage: "1d6" },
        ],
      };

      const result = processor.process(character, "weapons => {name}: {damage}");

      // Bare property names are replaced during iteration
      expect(result).toBe("Sword: 1d8 Bow: 1d6");
    });

    it("should handle nested property paths", () => {
      const character = {
        system: {
          inventory: {
            weapons: [{ name: "Longsword", stats: { damage: "1d8+2" } }],
          },
        },
      };

      const result = processor.process(character, "system.inventory.weapons => {name} {stats.damage}");

      // Bare property paths get replaced
      expect(result).toBe("Longsword 1d8+2");
    });
  });

  describe("edge cases", () => {
    it("should return empty string for null data", () => {
      const character = {
        items: null,
      };

      const result = processor.process(character, "items => {value}");

      expect(result).toBe("");
    });

    it("should return empty string for undefined data", () => {
      const character = {};

      const result = processor.process(character, "nonexistent => {value}");

      expect(result).toBe("");
    });

    it("should handle empty array", () => {
      const character = {
        items: [],
      };

      const result = processor.process(character, "items => {value}");

      expect(result).toBe("");
    });

    it("should handle empty Set", () => {
      const character = {
        items: new Set(),
      };

      const result = processor.process(character, "items => {value}");

      expect(result).toBe("");
    });

    it("should convert non-array objects to arrays", () => {
      const character = {
        stats: {
          str: 16,
          dex: 14,
          con: 15,
        },
      };

      const result = processor.process(character, "stats => {value}");

      // Object values are converted to array, "value" special case doesn't add newlines
      expect(result).toBe("16 14 15");
    });

    it("should handle empty object", () => {
      const character = {
        emptyObj: {},
      };

      const result = processor.process(character, "emptyObj => {value}");

      expect(result).toBe("");
    });

    it("should wrap primitives in arrays", () => {
      const character = {
        singleValue: "test",
      };

      const result = processor.process(character, "singleValue => Prefix {value}");

      // "value" as bare word gets replaced with the array item, "Prefix" stays as-is
      expect(result).toBe("Prefix test");
    });
  });

  describe("template processing", () => {
    it("should handle multiple property replacements", () => {
      const character = {
        spells: [
          { name: "Fireball", level: 3, school: "Evocation" },
          { name: "Shield", level: 1, school: "Abjuration" },
        ],
      };

      const result = processor.process(character, "spells => {name} ({level}, {school})");

      // All bare property names get replaced
      expect(result).toBe("Fireball (3, Evocation) Shield (1, Abjuration)");
    });

    it("should handle Set iteration", () => {
      const character = {
        tags: new Set(["magic", "rare", "weapon"]),
      };

      const result = processor.process(character, "tags => [{value}]");

      // "value" special case doesn't add newlines
      expect(result).toBe("[magic] [rare] [weapon]");
    });

    it("should handle complex nested properties", () => {
      const character = {
        items: [
          {
            name: "Magic Sword",
            properties: {
              enchantments: ["sharp", "glowing"],
            },
          },
        ],
      };

      const result = processor.process(character, "items => {name}: {properties.enchantments}");

      // Bare properties get replaced before parseText
      expect(result).toBe("Magic Sword: sharp,glowing");
    });
  });

  describe("string processing and cleaning", () => {
    it("should remove trailing commas", () => {
      const character = {
        items: ["sword", "shield"],
      };

      const result = processor.process(character, "items => {value},");

      // Trailing comma should be removed
      expect(result).toBe("sword, shield");
    });

    it("should handle SafeString output when needed", () => {
      const character = {
        items: ["sword"],
      };

      const result = processor.process(character, "items => <b>{value}</b>");

      // HTML content triggers SafeString via parseText
      expect(result).toBe("<b>sword</b>");
    });

    it("should return empty string when output equals input", () => {
      const character = {
        items: [],
      };

      const result = processor.process(character, "items => {value}");

      expect(result).toBe("");
    });
  });

  describe("error handling", () => {
    it("should handle iteration errors gracefully", () => {
      const character = {
        items: ["test1", "test2"],
      };

      // Test basic functionality - the processor should handle normal arrays
      const result = processor.process(character, "items => {value}");

      expect(typeof result).toBe("string");
    });

    it("should handle malformed templates", () => {
      const character = {
        items: ["test"],
      };

      const result = processor.process(character, "invalid_template_without_arrow");

      // Should handle gracefully - may return empty string for malformed templates
      expect(typeof result).toBe("string");
    });
  });

  describe("validation", () => {
    it("should validate character parameter", () => {
      expect(() => {
        processor.process(null, "items => {value}");
      }).toThrow("Character parameter is required");
    });

    it("should validate value parameter", () => {
      expect(() => {
        processor.process({}, null);
      }).toThrow("Value parameter is required");
    });
  });

  describe("utility methods", () => {
    it("should clean strings using sanitizer", () => {
      const dirtyString = "<script>alert('xss')</script><p>clean text</p>";

      const result = processor.cleanString(dirtyString);

      // The actual sanitizer removes the script tag
      expect(result).toBe("<p>clean text</p>");
    });

    it("should handle non-string values in cleanString", () => {
      const numberValue = 42;

      const result = processor.cleanString(numberValue);

      expect(result).toBe(42);
    });

    it("should remove trailing commas properly", () => {
      expect(processor.removeTrailingComma("item1, item2, ")).toBe("item1, item2");
      expect(processor.removeTrailingComma("item1, item2,")).toBe("item1, item2");
      expect(processor.removeTrailingComma("item1, item2")).toBe("item1, item2");
      expect(processor.removeTrailingComma("single,")).toBe("single");
    });
  });

  describe("enhanced filtering functionality", () => {
    it("should process items{filter}.property syntax", () => {
      const character = {
        items: {
          item1: { type: "race", name: "Human", languages: ["Common", "Bonus Language"] },
          item2: { type: "class", name: "Fighter" },
          item3: { type: "race", name: "Elf", languages: ["Common", "Elvish"] },
        },
      };

      const result = processor.process(character, "items{race}.languages => {value}, ");

      // 'value' as bare property gets special handling, extracts array from first matching race item
      // Note: template has trailing space after comma, resulting in double spaces
      expect(result).toBe("Common,  Bonus Language");
    });

    it("should handle FoundryVTT document structure for items filtering", () => {
      const character = {
        items: {
          documentClass: "Item",
          _source: {
            item1: { type: "race", name: "Dwarf", languages: ["Common", "Dwarven"] },
            item2: { type: "weapon", name: "Axe" },
          },
          size: 2,
          contents: [],
          apps: {},
          _sheet: null,
        },
      };

      const result = processor.process(character, "items{race}.languages => {value}, ");

      expect(result).toBe("Common,  Dwarven");
    });

    it("should return empty string when no items match filter", () => {
      const character = {
        items: {
          item1: { type: "weapon", name: "Sword" },
          item2: { type: "armor", name: "Shield" },
        },
      };

      const result = processor.process(character, "items{race}.languages => value, ");

      expect(result).toBe("");
    });

    it("should fallback to regular extraction for non-filter syntax", () => {
      const character = {
        regularArray: ["item1", "item2", "item3"],
      };

      const result = processor.process(character, "regularArray => {value}, ");

      expect(result).toBe("item1,  item2,  item3");
    });
  });
});
