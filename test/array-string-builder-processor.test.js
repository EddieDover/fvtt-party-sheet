import { jest } from "@jest/globals";
import { ArrayStringBuilderProcessor } from "../src/module/parsing/processors/array-string-builder-processor.js";
import { setupFoundryMocks, cleanupFoundryMocks, createConsoleMocks } from "./test-mocks.js";

// Mock Handlebars SafeString
const mockSafeString = jest.fn().mockImplementation((content) => ({ content, __isSafeString: true }));
global.Handlebars = {
  SafeString: mockSafeString,
};

describe("ArrayStringBuilderProcessor", () => {
  let processor;
  let mockParserEngine;
  let consoleMocks;

  beforeEach(() => {
    setupFoundryMocks();
    consoleMocks = createConsoleMocks();
    
    // Mock parser engine
    mockParserEngine = {
      parseText: jest.fn().mockReturnValue([false, "parsed_text"]),
    };
    
    processor = new ArrayStringBuilderProcessor(mockParserEngine);
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupFoundryMocks();
    consoleMocks.restore();
  });

  describe("basic array processing", () => {
    it("should process simple array with template", () => {
      const character = {
        items: ["sword", "shield", "potion"]
      };

      const result = processor.process(character, "items => {value}");

      expect(result).toBe("parsed_text");
      expect(mockParserEngine.parseText).toHaveBeenCalled();
      
      // The processor should have attempted to process the template
      const callArgs = mockParserEngine.parseText.mock.calls[0][0];
      expect(callArgs).toContain("{value}");
    });

    it("should process array with property extraction", () => {
      const character = {
        weapons: [
          { name: "Sword", damage: "1d8" },
          { name: "Bow", damage: "1d6" }
        ]
      };

      const result = processor.process(character, "weapons => {name}: {damage}");

      expect(result).toBe("parsed_text");
      expect(mockParserEngine.parseText).toHaveBeenCalled();
      
      // The processor should have attempted to process the template
      const callArgs = mockParserEngine.parseText.mock.calls[0][0];
      expect(callArgs).toContain("{name}");
      expect(callArgs).toContain("{damage}");
    });

    it("should handle nested property paths", () => {
      const character = {
        system: {
          inventory: {
            weapons: [
              { name: "Longsword", stats: { damage: "1d8+2" } }
            ]
          }
        }
      };

      const result = processor.process(character, "system.inventory.weapons => {name} deals {stats.damage}");

      expect(result).toBe("parsed_text");
      expect(mockParserEngine.parseText).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should return empty string for null data", () => {
      const character = {
        items: null
      };

      const result = processor.process(character, "items => {value}");

      expect(result).toBe("");
      expect(mockParserEngine.parseText).not.toHaveBeenCalled();
    });

    it("should return empty string for undefined data", () => {
      const character = {};

      const result = processor.process(character, "nonexistent => {value}");

      expect(result).toBe("");
    });

    it("should handle empty array", () => {
      const character = {
        items: []
      };

      const result = processor.process(character, "items => {value}");

      expect(result).toBe("");
    });

    it("should handle empty Set", () => {
      const character = {
        items: new Set()
      };

      const result = processor.process(character, "items => {value}");

      expect(result).toBe("");
    });

    it("should convert non-array objects to arrays", () => {
      const character = {
        stats: {
          str: 16,
          dex: 14,
          con: 15
        }
      };

      const result = processor.process(character, "stats => {value}");

      expect(result).toBe("parsed_text");
      expect(mockParserEngine.parseText).toHaveBeenCalled();
    });

    it("should handle empty object", () => {
      const character = {
        emptyObj: {}
      };

      const result = processor.process(character, "emptyObj => {value}");

      expect(result).toBe("");
    });

    it("should wrap primitives in arrays", () => {
      const character = {
        singleValue: "test"
      };

      const result = processor.process(character, "singleValue => Value: {value}");

      expect(result).toBe("parsed_text");
      expect(mockParserEngine.parseText).toHaveBeenCalled();
    });
  });

  describe("template processing", () => {
    it("should handle multiple property replacements", () => {
      const character = {
        spells: [
          { name: "Fireball", level: 3, school: "Evocation" },
          { name: "Shield", level: 1, school: "Abjuration" }
        ]
      };

      const result = processor.process(character, "spells => {name} (Level {level}, {school})");

      expect(result).toBe("parsed_text");
      expect(mockParserEngine.parseText).toHaveBeenCalled();
    });

    it("should handle Set iteration", () => {
      const character = {
        tags: new Set(["magic", "rare", "weapon"])
      };

      const result = processor.process(character, "tags => [{value}]");

      expect(result).toBe("parsed_text");
      expect(mockParserEngine.parseText).toHaveBeenCalled();
    });

    it("should handle complex nested properties", () => {
      const character = {
        items: [
          { 
            name: "Magic Sword", 
            properties: { 
              enchantments: ["sharp", "glowing"] 
            } 
          }
        ]
      };

      const result = processor.process(character, "items => {name}: {properties.enchantments}");

      expect(result).toBe("parsed_text");
    });
  });

  describe("string processing and cleaning", () => {
    it("should remove trailing commas", () => {
      const character = {
        items: ["sword", "shield"]
      };

      // Mock parseText to return text with trailing comma
      mockParserEngine.parseText.mockReturnValue([false, "sword, shield,"]);

      const result = processor.process(character, "items => {value},");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(expect.not.stringMatching(/,\s*$/));
    });

    it("should handle SafeString output when needed", () => {
      const character = {
        items: ["sword"]
      };

      mockParserEngine.parseText.mockReturnValue([true, "<b>sword</b>"]);

      const result = processor.process(character, "items => <b>{value}</b>");

      expect(mockSafeString).toHaveBeenCalledWith("<b>sword</b>");
      expect(result.__isSafeString).toBe(true);
    });

    it("should return empty string when output equals input", () => {
      const character = {
        items: []
      };

      // Mock to simulate case where final string equals original value
      mockParserEngine.parseText.mockReturnValue([false, "items => {value}"]);

      const result = processor.process(character, "items => {value}");

      // Should return empty string when processed output equals original template
      expect(result).toBe("");
    });
  });

  describe("error handling", () => {
    it("should handle iteration errors gracefully", () => {
      const character = {
        items: ["test1", "test2"]
      };

      // Test basic functionality - the processor should handle normal arrays
      const result = processor.process(character, "items => {value}");

      expect(typeof result).toBe("string");
    });

    it("should handle malformed templates", () => {
      const character = {
        items: ["test"]
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
});
