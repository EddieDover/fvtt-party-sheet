// eslint-disable-next-line no-shadow
import { jest } from "@jest/globals";
import { UuidLinkProcessor } from "../src/module/parsing/processors/uuid-link-processor.js";
import { ParserEngine } from "../src/module/parsing/parser-engine.js";
import { setupFoundryMocks, cleanupFoundryMocks, createConsoleMocks } from "./test-mocks.js";

// Mock Handlebars SafeString
const mockSafeString = jest.fn().mockImplementation((content) => ({ content, __isSafeString: true }));
global.Handlebars = {
  SafeString: mockSafeString,
};

describe("UuidLinkProcessor", () => {
  let processor;
  let parserEngine;
  let consoleMocks;

  beforeEach(() => {
    setupFoundryMocks();
    consoleMocks = createConsoleMocks();

    parserEngine = new ParserEngine();
    processor = new UuidLinkProcessor(parserEngine);
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupFoundryMocks();
    consoleMocks.restore();
  });

  describe("basic UUID link processing", () => {
    it("should dereference a UUID and extract a property", () => {
      const mockDocument = {
        toObject: jest.fn().mockReturnValue({
          name: "Linked Document",
          type: "actor",
        }),
      };

      global.fromUuidSync = jest.fn().mockReturnValue(mockDocument);

      const character = {
        classUuid: "Actor.abc123",
      };

      const result = processor.process(character, "classUuid => {name}");

      expect(global.fromUuidSync).toHaveBeenCalledWith("Actor.abc123");
      expect(mockDocument.toObject).toHaveBeenCalled();
      expect(result).toBe("Linked Document");
    });

    it("should handle documents that don't have toObject method", () => {
      const mockDocument = {
        name: "Direct Object",
        type: "item",
      };

      global.fromUuidSync = jest.fn().mockReturnValue(mockDocument);

      const character = {
        itemUuid: "Item.xyz789",
      };

      const result = processor.process(character, "itemUuid => {name}");

      expect(result).toBe("Direct Object");
    });

    it("should extract nested properties from linked document", () => {
      const mockDocument = {
        toObject: jest.fn().mockReturnValue({
          system: {
            details: {
              biography: "A legendary hero",
            },
          },
        }),
      };

      global.fromUuidSync = jest.fn().mockReturnValue(mockDocument);

      const character = {
        heroUuid: "Actor.hero123",
      };

      const result = processor.process(character, "heroUuid => {system.details.biography}");

      expect(result).toBe("A legendary hero");
    });
  });

  describe("UUID extraction from character", () => {
    it("should extract UUID from nested character property", () => {
      const mockDocument = {
        toObject: jest.fn().mockReturnValue({
          name: "Class Name",
        }),
      };

      global.fromUuidSync = jest.fn().mockReturnValue(mockDocument);

      const character = {
        class: {
          uuid: "UUID.class123",
        },
      };

      const result = processor.process(character, "class.uuid => {name}");

      expect(global.fromUuidSync).toHaveBeenCalledWith("UUID.class123");
      expect(result).toBe("Class Name");
    });

    it("should return empty string when UUID path doesn't exist", () => {
      const character = {
        name: "Test Character",
      };

      const result = processor.process(character, "missingUuid => {name}");

      expect(result).toBe("");
    });

    it("should return empty string when UUID is not a string", () => {
      const character = {
        invalidUuid: 12345,
      };

      const result = processor.process(character, "invalidUuid => {name}");

      expect(result).toBe("");
    });

    it("should return empty string when UUID is null", () => {
      const character = {
        nullUuid: null,
      };

      const result = processor.process(character, "nullUuid => {name}");

      expect(result).toBe("");
    });
  });

  describe("document dereferencing", () => {
    it("should return empty string when fromUuidSync returns null", () => {
      global.fromUuidSync = jest.fn().mockReturnValue(null);

      const character = {
        classUuid: "Actor.notfound",
      };

      const result = processor.process(character, "classUuid => {name}");

      expect(result).toBe("");
    });

    it("should return empty string when fromUuidSync returns undefined", () => {
      global.fromUuidSync = jest.fn().mockReturnValue(undefined);

      const character = {
        classUuid: "Actor.notfound",
      };

      const result = processor.process(character, "classUuid => {name}");

      expect(result).toBe("");
    });

    it("should handle documents with complex data structures", () => {
      const mockDocument = {
        toObject: jest.fn().mockReturnValue({
          name: "Item",
          attributes: {
            damage: "2d6",
            bonus: 3,
          },
        }),
      };

      global.fromUuidSync = jest.fn().mockReturnValue(mockDocument);

      const character = {
        weaponUuid: "Item.weapon123",
      };

      const result = processor.process(character, "weaponUuid => {attributes.damage}");

      expect(result).toBe("2d6");
    });
  });

  describe("template processing", () => {
    it("should process multiple properties in template", () => {
      const mockDocument = {
        toObject: jest.fn().mockReturnValue({
          name: "Fire Spell",
          level: "3",
        }),
      };

      global.fromUuidSync = jest.fn().mockReturnValue(mockDocument);

      const character = {
        spellUuid: "Item.spell123",
      };

      const result = processor.process(character, "spellUuid => {name} (Level {level})");

      expect(result).toBe("Fire Spell (Level 3)");
    });

    it("should handle templates with only property replacements", () => {
      const mockDocument = {
        toObject: jest.fn().mockReturnValue({
          type: "weapon",
        }),
      };

      global.fromUuidSync = jest.fn().mockReturnValue(mockDocument);

      const character = {
        equipUuid: "Item.equip123",
      };

      const result = processor.process(character, "equipUuid => {type}");

      expect(result).toBe("weapon");
    });

    it("should leave undefined properties as placeholders in template", () => {
      const mockDocument = {
        toObject: jest.fn().mockReturnValue({
          name: "Item Name",
        }),
      };

      global.fromUuidSync = jest.fn().mockReturnValue(mockDocument);

      const character = {
        itemUuid: "Item.item123",
      };

      const result = processor.process(character, "itemUuid => {nonexistent}");

      // TemplateProcessor leaves unresolved properties as-is
      expect(result).toBe("{nonexistent}");
    });

    it("should handle mixed existing and non-existing properties", () => {
      const mockDocument = {
        toObject: jest.fn().mockReturnValue({
          name: "Sword",
        }),
      };

      global.fromUuidSync = jest.fn().mockReturnValue(mockDocument);

      const character = {
        itemUuid: "Item.item123",
      };

      const result = processor.process(character, "itemUuid => Name: {name}, Type: {type}");

      expect(result).toBe("Name: Sword, Type: {type}");
    });
  });

  describe("format validation", () => {
    it("should return empty string when format is missing arrow separator", () => {
      const character = {
        classUuid: "Actor.class123",
      };

      const result = processor.process(character, "classUuid");

      expect(result).toBe("");
      expect(consoleMocks.warnSpy).toHaveBeenCalledWith(expect.stringContaining("uuid-link processor requires format"));
    });

    it("should return empty string when format has multiple arrow separators", () => {
      const character = {
        classUuid: "Actor.class123",
      };

      const result = processor.process(character, "classUuid => {name} => extra");

      expect(result).toBe("");
      expect(consoleMocks.warnSpy).toHaveBeenCalledWith(expect.stringContaining("uuid-link processor requires format"));
    });

    it("should handle whitespace around arrow separator", () => {
      const mockDocument = {
        toObject: jest.fn().mockReturnValue({
          name: "Test Name",
        }),
      };

      global.fromUuidSync = jest.fn().mockReturnValue(mockDocument);

      const character = {
        classUuid: "Actor.class123",
      };

      const result = processor.process(character, "classUuid  =>  {name}");

      expect(result).toBe("Test Name");
    });
  });

  describe("SafeString handling", () => {
    it("should return SafeString when parser indicates it's needed", () => {
      const mockDocument = {
        toObject: jest.fn().mockReturnValue({
          description: "<b>Bold text</b>",
        }),
      };

      global.fromUuidSync = jest.fn().mockReturnValue(mockDocument);

      // Mock parseText to return SafeString needed
      parserEngine.parseText = jest.fn().mockReturnValue([true, "<b>Bold text</b>"]);

      const character = {
        descUuid: "Item.desc123",
      };

      const result = processor.process(character, "descUuid => {description}");

      expect(mockSafeString).toHaveBeenCalledWith("<b>Bold text</b>");
      expect(result.__isSafeString).toBe(true);
    });

    it("should return plain text when SafeString is not needed", () => {
      const mockDocument = {
        toObject: jest.fn().mockReturnValue({
          name: "Plain Name",
        }),
      };

      global.fromUuidSync = jest.fn().mockReturnValue(mockDocument);

      // Mock parseText to return SafeString not needed
      parserEngine.parseText = jest.fn().mockReturnValue([false, "Plain Name"]);

      const character = {
        nameUuid: "Item.name123",
      };

      const result = processor.process(character, "nameUuid => {name}");

      expect(result).toBe("Plain Name");
      expect(mockSafeString).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should catch errors during processing", () => {
      global.fromUuidSync = jest.fn().mockImplementation(() => {
        throw new Error("UUID lookup failed");
      });

      const character = {
        classUuid: "Actor.error123",
      };

      const result = processor.process(character, "classUuid => {name}");

      expect(result).toBe("");
      expect(consoleMocks.warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("UUID-link processor error"),
        expect.any(Error),
      );
    });

    it("should handle parser engine errors gracefully", () => {
      const mockDocument = {
        toObject: jest.fn().mockReturnValue({
          name: "Test",
        }),
      };

      global.fromUuidSync = jest.fn().mockReturnValue(mockDocument);
      parserEngine.parseText = jest.fn().mockImplementation(() => {
        throw new Error("Parse error");
      });

      const character = {
        classUuid: "Actor.class123",
      };

      const result = processor.process(character, "classUuid => {name}");

      expect(result).toBe("");
      expect(consoleMocks.warnSpy).toHaveBeenCalled();
    });
  });

  describe("validation", () => {
    it("should validate character parameter", () => {
      expect(() => {
        processor.process(null, "classUuid => {name}");
      }).toThrow("Character parameter is required");
    });

    it("should validate value parameter", () => {
      const character = { classUuid: "Actor.123" };

      expect(() => {
        processor.process(character, null);
      }).toThrow("Value parameter is required");
    });
  });

  describe("complex scenarios", () => {
    it("should handle chained property access on linked document", () => {
      const mockDocument = {
        toObject: jest.fn().mockReturnValue({
          system: {
            abilities: {
              str: {
                value: 18,
              },
            },
          },
        }),
      };

      global.fromUuidSync = jest.fn().mockReturnValue(mockDocument);

      const character = {
        classUuid: "Actor.class123",
      };

      const result = processor.process(character, "classUuid => {system.abilities.str.value}");

      expect(result).toBe("18");
    });

    it("should process UUID with mixed static and dynamic template content", () => {
      const mockDocument = {
        toObject: jest.fn().mockReturnValue({
          name: "Barbarian",
          hitDice: "d12",
        }),
      };

      global.fromUuidSync = jest.fn().mockReturnValue(mockDocument);

      const character = {
        classUuid: "Actor.class123",
      };

      const result = processor.process(character, "classUuid => Class: {name} with {hitDice} hit dice");

      expect(result).toBe("Class: Barbarian with d12 hit dice");
    });

    it("should handle multiple UUID properties in character", () => {
      const mockDocument1 = {
        toObject: jest.fn().mockReturnValue({
          name: "Fighter",
        }),
      };

      const mockDocument2 = {
        toObject: jest.fn().mockReturnValue({
          name: "Greatsword",
        }),
      };

      global.fromUuidSync = jest.fn().mockReturnValueOnce(mockDocument1).mockReturnValueOnce(mockDocument2);

      const character = {
        classUuid: "Actor.class123",
        weaponUuid: "Item.weapon456",
      };

      const result1 = processor.process(character, "classUuid => {name}");
      const result2 = processor.process(character, "weaponUuid => {name}");

      expect(result1).toBe("Fighter");
      expect(result2).toBe("Greatsword");
    });
  });
});
