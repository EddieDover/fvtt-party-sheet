// eslint-disable-next-line no-shadow
import { jest } from "@jest/globals";
import { UuidLinkProcessor } from "../src/module/parsing/processors/uuid-link-processor.js";
import { setupFoundryMocks, cleanupFoundryMocks, createConsoleMocks } from "./test-mocks.js";

// Mock Handlebars SafeString
const mockSafeString = jest.fn().mockImplementation((content) => ({ content, __isSafeString: true }));
global.Handlebars = {
  SafeString: mockSafeString,
};

describe("UuidLinkProcessor", () => {
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

    processor = new UuidLinkProcessor(mockParserEngine);

    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupFoundryMocks();
    consoleMocks.restore();
    delete global.fromUuidSync;
  });

  describe("dereferenceUuids method", () => {
    it("should dereference a UUID string and call toObject()", () => {
      const mockDocument = {
        name: "Goblin",
        toObject: jest.fn().mockReturnValue({ name: "Goblin Data", hp: 10 }),
      };
      global.fromUuidSync = jest.fn().mockReturnValue(mockDocument);

      const result = processor.dereferenceUuids(["Actor.123"]);

      expect(global.fromUuidSync).toHaveBeenCalledWith("Actor.123", { strict: false });
      expect(mockDocument.toObject).toHaveBeenCalled();
      expect(result).toEqual([{ name: "Goblin Data", hp: 10 }]);
    });

    it("should dereference multiple UUIDs in order", () => {
      const mockDoc1 = { toObject: () => ({ name: "Sword" }) };
      const mockDoc2 = { toObject: () => ({ name: "Shield" }) };
      global.fromUuidSync = jest.fn().mockReturnValueOnce(mockDoc1).mockReturnValueOnce(mockDoc2);

      const result = processor.dereferenceUuids(["Item.1", "Item.2"]);

      expect(global.fromUuidSync).toHaveBeenCalledTimes(2);
      expect(result).toEqual([{ name: "Sword" }, { name: "Shield" }]);
    });

    it("should use documents without a toObject method as-is (compendium index entries)", () => {
      const indexEntry = { _id: "abc", name: "Fighter", type: "Class", img: "icons/fighter.png" };
      global.fromUuidSync = jest.fn().mockReturnValue(indexEntry);

      const result = processor.dereferenceUuids(["Compendium.shadowdark.classes.Item.abc"]);

      expect(result).toEqual([indexEntry]);
    });

    it("should skip UUIDs that cannot be resolved", () => {
      const mockDoc = { toObject: () => ({ name: "Sword" }) };
      global.fromUuidSync = jest
        .fn()
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(mockDoc)
        .mockReturnValueOnce(undefined);

      const result = processor.dereferenceUuids(["Item.Missing", "Item.1", "Item.AlsoMissing"]);

      expect(global.fromUuidSync).toHaveBeenCalledTimes(3);
      expect(result).toEqual([{ name: "Sword" }]);
      expect(consoleMocks.warnSpy).not.toHaveBeenCalled();
    });

    it("should catch errors thrown by fromUuidSync, warn, and keep the rest", () => {
      const mockDoc = { toObject: () => ({ name: "Sword" }) };
      const testError = new Error("Database error");
      global.fromUuidSync = jest
        .fn()
        .mockImplementationOnce(() => {
          throw testError;
        })
        .mockReturnValue(mockDoc);

      const result = processor.dereferenceUuids(["Scene.Corrupted", "Scene.Valid"]);

      expect(result).toEqual([{ name: "Sword" }]);
      expect(consoleMocks.warnSpy).toHaveBeenCalledWith("Failed to dereference UUID: Scene.Corrupted", testError);
    });

    it("should pass non-string entries through untouched", () => {
      global.fromUuidSync = jest.fn().mockReturnValue({ toObject: () => ({ name: "Sword" }) });
      const alreadyResolved = { name: "Shield" };

      const result = processor.dereferenceUuids(["Item.1", alreadyResolved, 42]);

      expect(global.fromUuidSync).toHaveBeenCalledTimes(1);
      expect(result).toEqual([{ name: "Sword" }, alreadyResolved, 42]);
    });

    it("should return an empty array for an empty input", () => {
      global.fromUuidSync = jest.fn();

      expect(processor.dereferenceUuids([])).toEqual([]);
      expect(global.fromUuidSync).not.toHaveBeenCalled();
    });
  });

  describe("normalizeObjectData method", () => {
    it("should dereference a single UUID string and normalize like the parent", () => {
      global.fromUuidSync = jest.fn().mockReturnValue({ toObject: () => ({ name: "Fighter" }) });

      const result = processor.normalizeObjectData("Item.abc");

      expect(result).toEqual([{ name: "Fighter", objectLoopKey: "0" }]);
    });

    it("should dereference an array of UUID strings and normalize like the parent", () => {
      global.fromUuidSync = jest
        .fn()
        .mockReturnValueOnce({ toObject: () => ({ name: "Common" }) })
        .mockReturnValueOnce({ toObject: () => ({ name: "Elvish" }) });

      const result = processor.normalizeObjectData(["Item.1", "Item.2"]);

      expect(result).toEqual([
        { name: "Common", objectLoopKey: "0" },
        { name: "Elvish", objectLoopKey: "1" },
      ]);
    });

    it("should return an empty array for a string that does not resolve", () => {
      global.fromUuidSync = jest.fn().mockReturnValue(null);

      const result = processor.normalizeObjectData("Fighter");

      expect(result).toEqual([]);
    });

    it("should fall back to the parent implementation for plain object data", () => {
      global.fromUuidSync = jest.fn();

      const result = processor.normalizeObjectData({
        acrobatics: { name: "Acrobatics", value: 5 },
        stealth: { name: "Stealth", value: 3 },
      });

      expect(global.fromUuidSync).not.toHaveBeenCalled();
      expect(result).toEqual([
        { name: "Acrobatics", value: 5, objectLoopKey: "Acrobatics" },
        { name: "Stealth", value: 3, objectLoopKey: "Stealth" },
      ]);
    });
  });

  describe("process integration", () => {
    it("should render a property of a single linked document", () => {
      global.fromUuidSync = jest.fn().mockReturnValue({ toObject: () => ({ name: "Fighter" }) });
      const character = { system: { class: "Compendium.shadowdark.classes.Item.abc" } };

      const result = processor.process(character, "system.class => {name}");

      expect(global.fromUuidSync).toHaveBeenCalledWith("Compendium.shadowdark.classes.Item.abc", { strict: false });
      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Fighter", false);
      expect(result).toBe("parsed_text");
    });

    it("should render each document of a UUID array with the template", () => {
      const docs = {
        "Item.a": { toObject: () => ({ name: "Common" }) },
        "Item.b": { toObject: () => ({ name: "Elvish" }) },
      };
      global.fromUuidSync = jest.fn((uuid) => docs[uuid] ?? null);
      const character = { system: { languages: ["Item.a", "Item.b"] } };

      processor.process(character, "system.languages => {name}, ");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Common, Elvish", false);
    });

    it("should support nested properties of the linked document", () => {
      global.fromUuidSync = jest.fn().mockReturnValue({
        toObject: () => ({ name: "Fighter", system: { hitPoints: "1d8" } }),
      });
      const character = { system: { class: "Item.abc" } };

      processor.process(character, "system.class => {name} ({system.hitPoints})");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Fighter (1d8)", false);
    });

    it("should support prefixes and filters inherited from object-loop", () => {
      const docs = {
        "Item.a": { toObject: () => ({ name: "Common", type: "language" }) },
        "Item.b": { toObject: () => ({ name: "Elvish", type: "language" }) },
      };
      global.fromUuidSync = jest.fn((uuid) => docs[uuid] ?? null);
      const character = { system: { languages: ["Item.a", "Item.b"] } };

      processor.process(character, "[Languages] system.languages{name == 'Elvish'} => {name}");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith("Languages Elvish", false);
    });

    it("should produce empty output when the UUID does not resolve", () => {
      global.fromUuidSync = jest.fn().mockReturnValue(null);
      const character = { system: { class: "Item.Missing" } };

      processor.process(character, "system.class => {name}");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith("", false);
    });

    it("should produce empty output when the property holds a non-UUID string", () => {
      global.fromUuidSync = jest.fn().mockReturnValue(null);
      const character = { system: { class: "Fighter" } };

      processor.process(character, "system.class => {name}");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith("", false);
    });

    it("should behave like object-loop when the property is plain object data", () => {
      global.fromUuidSync = jest.fn();
      const character = { system: { skills: { acrobatics: { name: "Acrobatics" } } } };

      processor.process(character, "system.skills => {name}");

      expect(global.fromUuidSync).not.toHaveBeenCalled();
      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Acrobatics", false);
    });

    it("should sanitize HTML in linked document data", () => {
      global.fromUuidSync = jest.fn().mockReturnValue({
        toObject: () => ({ name: '{b}<img src=x onerror="alert(1)">{/b}' }),
      });
      const character = { system: { class: "Item.abc" } };

      processor.process(character, "system.class => {name}");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" {b}{/b}", false);
    });
  });
});
