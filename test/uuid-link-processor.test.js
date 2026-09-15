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

      expect(global.fromUuidSync).toHaveBeenCalledWith("Item.xyz789");
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

      expect(global.fromUuidSync).toHaveBeenCalledWith("Actor.hero123");
      expect(result).toBe("A legendary hero");
    });
  });

  describe("UUID extraction error handling", () => {
    it("should return empty string when UUID path doesn't exist", () => {
      const character = {
        name: "Test Character",
      };

      const result = processor.process(character, "missingUuid => {name}");

      expect(result).toBe("");
    });

    it("should return empty string when UUID is not a string or array", () => {
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

      expect(global.fromUuidSync).toHaveBeenCalledWith("Item.spell123");
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

  describe("array of UUID handling", () => {
    it("should process array of UUIDs and extract properties from each", () => {
      const mockDocument1 = {
        toObject: jest.fn().mockReturnValue({ name: "Language 1" }),
      };
      const mockDocument2 = {
        toObject: jest.fn().mockReturnValue({ name: "Language 2" }),
      };
      const mockDocument3 = {
        toObject: jest.fn().mockReturnValue({ name: "Language 3" }),
      };

      global.fromUuidSync = jest
        .fn()
        .mockReturnValueOnce(mockDocument1)
        .mockReturnValueOnce(mockDocument2)
        .mockReturnValueOnce(mockDocument3);

      const character = {
        system: {
          languages: ["languages.DQzHvoMWSZ0eiRWP", "languages.GVbmj6D47b9lbOHz", "languages.NN9wFGgwk49oOQeN"],
        },
      };

      const result = processor.process(character, "system.languages => {name}, ");

      expect(global.fromUuidSync).toHaveBeenCalledWith("languages.DQzHvoMWSZ0eiRWP");
      expect(global.fromUuidSync).toHaveBeenCalledWith("languages.GVbmj6D47b9lbOHz");
      expect(global.fromUuidSync).toHaveBeenCalledWith("languages.NN9wFGgwk49oOQeN");
      expect(result).toBe("Language 1, Language 2, Language 3");
    });

    it("should handle empty array of UUIDs", () => {
      const character = {
        languages: [],
      };

      const result = processor.process(character, "languages => {name}, ");

      expect(result).toBe("");
    });

    it("should skip null or undefined items in UUID array", () => {
      const mockDocument = {
        toObject: jest.fn().mockReturnValue({ name: "Valid Language" }),
      };

      global.fromUuidSync = jest
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(mockDocument)
        .mockReturnValueOnce(null);

      const character = {
        languages: ["languages.invalid1", "languages.valid", "languages.invalid2"],
      };

      const result = processor.process(character, "languages => {name}, ");

      expect(global.fromUuidSync).toHaveBeenCalledWith("languages.invalid1");
      expect(global.fromUuidSync).toHaveBeenCalledWith("languages.valid");
      expect(global.fromUuidSync).toHaveBeenCalledWith("languages.invalid2");
      expect(result).toBe("Valid Language");
    });

    it("should handle array with single UUID", () => {
      const mockDocument = {
        toObject: jest.fn().mockReturnValue({ name: "Single Language" }),
      };

      global.fromUuidSync = jest.fn().mockReturnValue(mockDocument);

      const character = {
        languages: ["languages.single"],
      };

      const result = processor.process(character, "languages => {name}");

      expect(global.fromUuidSync).toHaveBeenCalledWith("languages.single");
      expect(result).toBe("Single Language");
    });

    it("should process array with multiple properties in template", () => {
      const mockDocument1 = {
        toObject: jest.fn().mockReturnValue({ name: "Common", type: "common" }),
      };
      const mockDocument2 = {
        toObject: jest.fn().mockReturnValue({ name: "Elvish", type: "uncommon" }),
      };

      global.fromUuidSync = jest.fn().mockReturnValueOnce(mockDocument1).mockReturnValueOnce(mockDocument2);

      const character = {
        languages: ["languages.lang1", "languages.lang2"],
      };

      const result = processor.process(character, "languages => {name} ({type}), ");

      expect(global.fromUuidSync).toHaveBeenCalledWith("languages.lang1");
      expect(global.fromUuidSync).toHaveBeenCalledWith("languages.lang2");
      expect(result).toBe("Common (common), Elvish (uncommon)");
    });

    it("should handle array with nested property access", () => {
      const mockDocument1 = {
        toObject: jest.fn().mockReturnValue({
          name: "Fireball",
          system: { level: "3" },
        }),
      };
      const mockDocument2 = {
        toObject: jest.fn().mockReturnValue({
          name: "Magic Missile",
          system: { level: "1" },
        }),
      };

      global.fromUuidSync = jest.fn().mockReturnValueOnce(mockDocument1).mockReturnValueOnce(mockDocument2);

      const character = {
        spells: ["spells.spell1", "spells.spell2"],
      };

      const result = processor.process(character, "spells => {name} (Level {system.level}), ");

      expect(global.fromUuidSync).toHaveBeenCalledWith("spells.spell1");
      expect(global.fromUuidSync).toHaveBeenCalledWith("spells.spell2");
      expect(result).toBe("Fireball (Level 3), Magic Missile (Level 1)");
    });

    it("should handle array with documents without toObject method", () => {
      const mockDocument1 = { name: "Direct 1", type: "item" };
      const mockDocument2 = { name: "Direct 2", type: "item" };

      global.fromUuidSync = jest.fn().mockReturnValueOnce(mockDocument1).mockReturnValueOnce(mockDocument2);

      const character = {
        items: ["Item.item1", "Item.item2"],
      };

      const result = processor.process(character, "items => {name}, ");

      expect(global.fromUuidSync).toHaveBeenCalledWith("Item.item1");
      expect(global.fromUuidSync).toHaveBeenCalledWith("Item.item2");
      expect(result).toBe("Direct 1, Direct 2");
    });

    it("should handle array with mixed toObject and direct objects", () => {
      const mockDocument1 = {
        toObject: jest.fn().mockReturnValue({ name: "With toObject" }),
      };
      const mockDocument2 = { name: "Without toObject" };

      global.fromUuidSync = jest.fn().mockReturnValueOnce(mockDocument1).mockReturnValueOnce(mockDocument2);

      const character = {
        items: ["Item.item1", "Item.item2"],
      };

      const result = processor.process(character, "items => {name}, ");

      expect(global.fromUuidSync).toHaveBeenCalledWith("Item.item1");
      expect(global.fromUuidSync).toHaveBeenCalledWith("Item.item2");
      expect(result).toBe("With toObject, Without toObject");
    });

    it("should filter out non-string items from array", () => {
      const mockDocument = {
        toObject: jest.fn().mockReturnValue({ name: "Valid" }),
      };

      global.fromUuidSync = jest.fn().mockReturnValue(mockDocument);

      const character = {
        mixed: ["ValidUUID", 123, null, undefined, "AnotherValidUUID"],
      };

      const result = processor.process(character, "mixed => {name}, ");

      // Should only process the string UUIDs
      expect(global.fromUuidSync).toHaveBeenCalledWith("ValidUUID");
      expect(global.fromUuidSync).toHaveBeenCalledWith("AnotherValidUUID");
      expect(global.fromUuidSync).toHaveBeenCalledTimes(2);
      expect(result).toBe("Valid, Valid");
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

    it("should handle SafeString for array results", () => {
      const mockDocument1 = {
        toObject: jest.fn().mockReturnValue({ name: "Item 1" }),
      };
      const mockDocument2 = {
        toObject: jest.fn().mockReturnValue({ name: "Item 2" }),
      };

      global.fromUuidSync = jest.fn().mockReturnValueOnce(mockDocument1).mockReturnValueOnce(mockDocument2);

      // Mock parseText to return SafeString needed
      parserEngine.parseText = jest.fn().mockReturnValue([true, "Item 1, Item 2"]);

      const character = {
        items: ["Item.item1", "Item.item2"],
      };

      const result = processor.process(character, "items => {name}, ");

      expect(mockSafeString).toHaveBeenCalledWith("Item 1, Item 2");
      expect(result.__isSafeString).toBe(true);
    });
  });

  describe("string cleaning and sanitization", () => {
    it("should remove trailing commas from result", () => {
      const mockDocument1 = {
        toObject: jest.fn().mockReturnValue({ name: "Item 1" }),
      };
      const mockDocument2 = {
        toObject: jest.fn().mockReturnValue({ name: "Item 2" }),
      };

      global.fromUuidSync = jest.fn().mockReturnValueOnce(mockDocument1).mockReturnValueOnce(mockDocument2);

      const character = {
        items: ["Item.item1", "Item.item2"],
      };

      const result = processor.process(character, "items => {name}, ");

      expect(result).toBe("Item 1, Item 2");
    });

    it("should handle trailing whitespace correctly", () => {
      const mockDocument = {
        toObject: jest.fn().mockReturnValue({ name: "Test" }),
      };

      global.fromUuidSync = jest.fn().mockReturnValue(mockDocument);

      const character = {
        itemUuid: "Item.item123",
      };

      const result = processor.process(character, "itemUuid => {name}  ");

      expect(result).toBe("Test");
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

    it("should handle array processing errors gracefully", () => {
      const mockDocument = {
        toObject: jest.fn().mockReturnValue({
          name: "Test",
        }),
      };

      global.fromUuidSync = jest
        .fn()
        .mockReturnValueOnce(mockDocument)
        .mockImplementationOnce(() => {
          throw new Error("Array item error");
        });

      const character = {
        items: ["Item.item1", "Item.item2"],
      };

      const result = processor.process(character, "items => {name}, ");

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

    it("should handle real-world languages array example", () => {
      const languages = [{ name: "Common" }, { name: "Elvish" }, { name: "Draconic" }];

      global.fromUuidSync = jest
        .fn()
        .mockReturnValueOnce({ toObject: () => languages[0] })
        .mockReturnValueOnce({ toObject: () => languages[1] })
        .mockReturnValueOnce({ toObject: () => languages[2] });

      const character = {
        system: {
          languages: [
            "Compendium.shadowdark.languages.Item.DQzHvoMWSZ0eiRWP",
            "Compendium.shadowdark.languages.Item.GVbmj6D47b9lbOHz",
            "Compendium.shadowdark.languages.Item.NN9wFGgwk49oOQeN",
          ],
        },
      };

      const result = processor.process(character, "system.languages => {name}, ");

      expect(result).toBe("Common, Elvish, Draconic");
    });
  });
});
