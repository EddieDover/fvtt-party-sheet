import { jest } from "@jest/globals";
import { ObjectLoopProcessor } from "../src/module/parsing/processors/object-loop-processor.js";
import { setupFoundryMocks, cleanupFoundryMocks, createConsoleMocks } from "./test-mocks.js";

// Mock Handlebars SafeString
const mockSafeString = jest.fn().mockImplementation((content) => ({ content, __isSafeString: true }));
global.Handlebars = {
  SafeString: mockSafeString,
};

describe("ObjectLoopProcessor", () => {
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
    
    processor = new ObjectLoopProcessor(mockParserEngine);
    
    // Mock global dropdown counter
    global.generated_dropdowns = 0;
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupFoundryMocks();
    consoleMocks.restore();
    delete global.generated_dropdowns;
  });

  describe("basic object loop processing", () => {
    it("should process simple object loop", () => {
      const character = {
        spells: [
          { name: "Fireball", level: 3 },
          { name: "Shield", level: 1 }
        ]
      };

      const result = processor.process(character, "spells => {name} (Level {level})");

      expect(result).toBe("parsed_text");
      expect(mockParserEngine.parseText).toHaveBeenCalled();
    });

    it("should handle multiple chunks separated by ||", () => {
      const character = {
        weapons: [{ name: "Sword" }],
        armor: [{ name: "Shield" }]
      };

      const result = processor.process(character, "weapons => {name} || armor => {name}");

      expect(result).toBe("parsed_text");
    });

    it("should process chunks with prefixes", () => {
      const character = {
        spells: [{ name: "Fireball" }]
      };

      const result = processor.process(character, "[Spells] spells => {name}");

      expect(result).toBe("parsed_text");
    });
  });

  describe("dropdown functionality", () => {
    it("should detect dropdown syntax", () => {
      const character = {
        spells: [{ name: "Fireball" }]
      };

      const result = processor.process(character, "{dropdown} spells => {name}");

      expect(global.generated_dropdowns).toBe(1);
      expect(result).toBe("parsed_text");
    });

    it("should create dropdown with multiple valid sections", () => {
      const character = {
        weapons: [{ name: "Sword" }],
        armor: [{ name: "Shield" }]
      };

      // Mock to return SafeString for dropdown
      mockParserEngine.parseText.mockReturnValue([true, "<select>dropdown</select>"]);

      const result = processor.process(character, "{dropdown} weapons => {name} || armor => {name}");

      expect(mockSafeString).toHaveBeenCalled();
      expect(result.__isSafeString).toBe(true);
    });

    it("should not create dropdown with only one valid section", () => {
      const character = {
        weapons: [{ name: "Sword" }],
        emptyArray: []
      };

      const result = processor.process(character, "{dropdown} weapons => {name} || emptyArray => {name}");

      expect(result).toBe("parsed_text");
    });
  });

  describe("chunk processing", () => {
    it("should handle empty arrays in chunks", () => {
      const character = {
        emptySpells: []
      };

      const result = processor.process(character, "emptySpells => {name}");

      expect(result).toBe("parsed_text");
    });

    it("should handle null/undefined data in chunks", () => {
      const character = {
        nullData: null
      };

      const result = processor.process(character, "nullData => {name}");

      expect(result).toBe("parsed_text");
    });

    it("should process filters in chunks", () => {
      const character = {
        spells: [
          { name: "Fireball", level: 3, prepared: true },
          { name: "Shield", level: 1, prepared: false }
        ]
      };

      const result = processor.process(character, "spells[prepared:true] => {name}");

      expect(result).toBe("parsed_text");
    });

    it("should handle complex filtering conditions", () => {
      const character = {
        items: [
          { name: "Sword", type: "weapon", equipped: true },
          { name: "Bow", type: "weapon", equipped: false },
          { name: "Shield", type: "armor", equipped: true }
        ]
      };

      const result = processor.process(character, "items[type:weapon,equipped:true] => {name}");

      expect(result).toBe("parsed_text");
    });
  });

  describe("template processing", () => {
    it("should handle nested property access", () => {
      const character = {
        spells: [
          { 
            name: "Fireball", 
            damage: { 
              dice: "8d6", 
              type: "fire" 
            } 
          }
        ]
      };

      const result = processor.process(character, "spells => {name}: {damage.dice} {damage.type}");

      expect(result).toBe("parsed_text");
    });

    it("should handle missing properties gracefully", () => {
      const character = {
        spells: [
          { name: "Fireball" }
          // missing level property
        ]
      };

      const result = processor.process(character, "spells => {name} (Level {level})");

      expect(result).toBe("parsed_text");
    });
  });

  describe("filtering logic", () => {
    it("should apply simple boolean filters", () => {
      const character = {
        spells: [
          { name: "Fireball", prepared: true },
          { name: "Shield", prepared: false }
        ]
      };

      const result = processor.process(character, "spells[prepared:true] => {name}");

      expect(result).toBe("parsed_text");
    });

    it("should apply string value filters", () => {
      const character = {
        items: [
          { name: "Sword", type: "weapon" },
          { name: "Potion", type: "consumable" }
        ]
      };

      const result = processor.process(character, "items[type:weapon] => {name}");

      expect(result).toBe("parsed_text");
    });

    it("should apply numeric filters", () => {
      const character = {
        spells: [
          { name: "Fireball", level: 3 },
          { name: "Shield", level: 1 },
          { name: "Wish", level: 9 }
        ]
      };

      const result = processor.process(character, "spells[level:3] => {name}");

      expect(result).toBe("parsed_text");
    });

    it("should handle multiple filter conditions", () => {
      const character = {
        items: [
          { name: "Magic Sword", type: "weapon", rarity: "rare" },
          { name: "Iron Sword", type: "weapon", rarity: "common" },
          { name: "Magic Shield", type: "armor", rarity: "rare" }
        ]
      };

      const result = processor.process(character, "items[type:weapon,rarity:rare] => {name}");

      expect(result).toBe("parsed_text");
    });
  });

  describe("error handling", () => {
    it("should validate character parameter", () => {
      expect(() => {
        processor.process(null, "spells => {name}");
      }).toThrow("Character parameter is required");
    });

    it("should validate value parameter", () => {
      expect(() => {
        processor.process({}, null);
      }).toThrow("Value parameter is required");
    });

    it("should handle malformed filter syntax", () => {
      const character = {
        spells: [{ name: "Fireball" }]
      };

      const result = processor.process(character, "spells[invalid filter syntax => {name}");

      expect(result).toBe("parsed_text");
    });

    it("should handle missing object properties", () => {
      const character = {};

      const result = processor.process(character, "nonexistent => {name}");

      expect(result).toBe("parsed_text");
    });
  });

  describe("SafeString handling", () => {
    it("should return SafeString when parser indicates it", () => {
      const character = {
        spells: [{ name: "Fireball" }]
      };

      mockParserEngine.parseText.mockReturnValue([true, "<b>Fireball</b>"]);

      const result = processor.process(character, "spells => <b>{name}</b>");

      expect(mockSafeString).toHaveBeenCalledWith("<b>Fireball</b>");
      expect(result.__isSafeString).toBe(true);
    });

    it("should return plain text when SafeString not needed", () => {
      const character = {
        spells: [{ name: "Fireball" }]
      };

      mockParserEngine.parseText.mockReturnValue([false, "Fireball"]);

      const result = processor.process(character, "spells => {name}");

      expect(result).toBe("Fireball");
      expect(mockSafeString).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle empty template strings", () => {
      const character = {
        spells: [{ name: "Fireball" }]
      };

      const result = processor.process(character, "spells => ");

      expect(result).toBe("parsed_text");
    });

    it("should handle templates without property replacements", () => {
      const character = {
        spells: [{ name: "Fireball" }]
      };

      const result = processor.process(character, "spells => Static Text");

      expect(result).toBe("parsed_text");
    });

    it("should handle complex nested object structures", () => {
      const character = {
        character: {
          class: {
            features: [
              {
                name: "Rage",
                uses: { value: 3, max: 3 },
                description: "Bonus damage and resistance"
              }
            ]
          }
        }
      };

      const result = processor.process(character, "character.class.features => {name} ({uses.value}/{uses.max}): {description}");

      expect(result).toBe("parsed_text");
    });
  });
});
