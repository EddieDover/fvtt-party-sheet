import { jest } from "@jest/globals";
import {
  LargestFromArrayProcessor,
  SmallestFromArrayProcessor,
} from "../src/module/parsing/processors/array-math-processors.js";
import { CharacterSheetProcessor } from "../src/module/parsing/processors/charactersheet-processor.js";
import { SpanProcessor } from "../src/module/parsing/processors/span-processor.js";
import { StringProcessor } from "../src/module/parsing/processors/string-processor.js";
import { setupFoundryMocks, cleanupFoundryMocks, createConsoleMocks } from "./test-mocks.js";

// Mock Handlebars SafeString
const mockSafeString = jest.fn().mockImplementation((content) => ({ content, __isSafeString: true }));
global.Handlebars = {
  SafeString: mockSafeString,
};

describe("Data Processors", () => {
  let consoleMocks;

  beforeEach(() => {
    setupFoundryMocks();
    consoleMocks = createConsoleMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupFoundryMocks();
    consoleMocks.restore();
  });

  describe("LargestFromArrayProcessor", () => {
    let processor;

    beforeEach(() => {
      processor = new LargestFromArrayProcessor();
    });

    it("should find the largest numeric value in an array", () => {
      const character = {
        scores: [10, 15, 8, 20, 12],
      };

      const result = processor.process(character, "scores");
      expect(result).toBe(20);
    });

    it("should handle arrays with string numbers", () => {
      const character = {
        values: ["10", "25", "5", "30"],
      };

      const result = processor.process(character, "values");
      expect(result).toBe(30);
    });

    it("should handle empty arrays", () => {
      const character = {
        empty: [],
      };

      const result = processor.process(character, "empty");
      expect(result).toBe("");
    });

    it("should handle non-numeric values in array", () => {
      const character = {
        mixed: ["abc", 10, "def", 25, "ghi"],
      };

      const result = processor.process(character, "mixed");
      expect(result).toBe(25);
    });

    it("should handle all non-numeric values", () => {
      const character = {
        strings: ["abc", "def", "ghi"],
      };

      const result = processor.process(character, "strings");
      expect(result).toBe("");
    });

    it("should warn and return empty string for non-array input", () => {
      const character = {
        notArray: "not an array",
      };

      const result = processor.process(character, "notArray");
      expect(result).toBe("");
      expect(consoleMocks.warnSpy).toHaveBeenCalledWith("LargestFromArray requires an array, got:", "string");
    });

    it("should handle nested property paths", () => {
      const character = {
        system: {
          abilities: {
            scores: [8, 14, 16, 12],
          },
        },
      };

      const result = processor.process(character, "system.abilities.scores");
      expect(result).toBe(16);
    });

    it("should throw error for null character", () => {
      expect(() => processor.process(null, "scores")).toThrow("Character parameter is required");
    });

    it("should throw error for null value", () => {
      const character = { scores: [1, 2, 3] };
      expect(() => processor.process(character, null)).toThrow("Value parameter is required");
    });
  });

  describe("SmallestFromArrayProcessor", () => {
    let processor;

    beforeEach(() => {
      processor = new SmallestFromArrayProcessor();
    });

    it("should find the smallest numeric value in an array", () => {
      const character = {
        scores: [10, 15, 8, 20, 12],
      };

      const result = processor.process(character, "scores");
      expect(result).toBe(8);
    });

    it("should handle arrays with string numbers", () => {
      const character = {
        values: ["10", "25", "5", "30"],
      };

      const result = processor.process(character, "values");
      expect(result).toBe(5);
    });

    it("should handle empty arrays", () => {
      const character = {
        empty: [],
      };

      const result = processor.process(character, "empty");
      expect(result).toBe("");
    });

    it("should handle non-numeric values in array", () => {
      const character = {
        mixed: ["abc", 10, "def", 25, "ghi"],
      };

      const result = processor.process(character, "mixed");
      expect(result).toBe(10);
    });

    it("should handle all non-numeric values", () => {
      const character = {
        strings: ["abc", "def", "ghi"],
      };

      const result = processor.process(character, "strings");
      expect(result).toBe("");
    });

    it("should warn and return empty string for non-array input", () => {
      const character = {
        notArray: "not an array",
      };

      const result = processor.process(character, "notArray");
      expect(result).toBe("");
      expect(consoleMocks.warnSpy).toHaveBeenCalledWith("SmallestFromArray requires an array, got:", "string");
    });

    it("should handle nested property paths", () => {
      const character = {
        system: {
          abilities: {
            scores: [8, 14, 16, 12],
          },
        },
      };

      const result = processor.process(character, "system.abilities.scores");
      expect(result).toBe(8);
    });
  });

  describe("CharacterSheetProcessor", () => {
    let processor;

    beforeEach(() => {
      processor = new CharacterSheetProcessor();
    });

    it("should generate character sheet button HTML", () => {
      const character = {
        uuid: "Actor.123",
        prototypeToken: {
          texture: {
            src: "path/to/token.png",
          },
          name: "Test Character",
          rotation: 0,
        },
      };

      const result = processor.process(character, "unused");

      expect(mockSafeString).toHaveBeenCalledWith(
        `<input type="image" data-action="onOpenActorSheet" name="fvtt-party-sheet-actorimage" data-actorid="Actor.123" class="token-image" src="path/to/token.png" title="Test Character" width="36" height="36" style="transform: rotate(0deg);"/>`,
      );
      expect(result.__isSafeString).toBe(true);
    });

    it("should handle character with rotation", () => {
      const character = {
        uuid: "Actor.456",
        prototypeToken: {
          texture: {
            src: "path/to/rotated.png",
          },
          name: "Rotated Character",
          rotation: 90,
        },
      };

      const result = processor.process(character, "unused");

      expect(mockSafeString).toHaveBeenCalledWith(expect.stringContaining("rotate(90deg)"));
    });

    it("should handle character without rotation", () => {
      const character = {
        uuid: "Actor.789",
        prototypeToken: {
          texture: {
            src: "path/to/norotation.png",
          },
          name: "No Rotation Character",
          // rotation is undefined
        },
      };

      const result = processor.process(character, "unused");

      expect(mockSafeString).toHaveBeenCalledWith(expect.stringContaining("rotate(0deg)"));
    });
  });

  describe("SpanProcessor", () => {
    let processor;

    beforeEach(() => {
      processor = new SpanProcessor();
    });

    it("should always return empty string for span placeholders", () => {
      const character = { name: "Test" };

      const result = processor.process(character, "test-class", { content: "Test Content" });

      expect(result).toBe("");
    });

    it("should return empty string regardless of content", () => {
      const character = { name: "Test" };

      const result = processor.process(character, "empty-class", { content: "" });

      expect(result).toBe("");
    });

    it("should handle any parameters and return empty string", () => {
      const character = { name: "Test" };

      const result = processor.process(character, "test-class-name_123", { content: "Content" });

      expect(result).toBe("");
    });

    it("should handle null/undefined inputs and return empty string", () => {
      const result1 = processor.process(null, null, null);
      const result2 = processor.process(undefined, undefined, undefined);

      expect(result1).toBe("");
      expect(result2).toBe("");
    });

    it("should handle complex objects and return empty string", () => {
      const character = {
        complex: {
          nested: {
            deep: "value",
          },
        },
      };

      const result = processor.process(character, { complex: "object" }, { many: "options" });

      expect(result).toBe("");
    });
  });

  describe("StringProcessor", () => {
    let processor;

    beforeEach(() => {
      processor = new StringProcessor();
    });

    it("should return the string value directly", () => {
      const character = { name: "Test" };

      const result = processor.process(character, "Test String Value");

      expect(result).toBe("Test String Value");
    });

    it("should handle empty string", () => {
      const character = { name: "Test" };

      const result = processor.process(character, "");

      expect(result).toBe("");
    });

    it("should handle numeric string", () => {
      const character = { name: "Test" };

      const result = processor.process(character, "123");

      expect(result).toBe("123");
    });

    it("should handle null value without throwing", () => {
      const character = { name: "Test" };

      const result = processor.process(character, null);

      expect(result).toBeNull();
    });

    it("should handle undefined value without throwing", () => {
      const character = { name: "Test" };

      const result = processor.process(character, undefined);

      expect(result).toBeUndefined();
    });
  });

  describe("SmallestFromArrayProcessor", () => {
    let processor;

    beforeEach(() => {
      processor = new SmallestFromArrayProcessor();
    });

    it("should find the smallest numeric value in an array", () => {
      const character = {
        scores: [10, 15, 8, 20, 12],
      };

      const result = processor.process(character, "scores");
      expect(result).toBe(8);
    });

    it("should handle arrays with string numbers", () => {
      const character = {
        values: ["10", "25", "5", "30"],
      };

      const result = processor.process(character, "values");
      expect(result).toBe(5);
    });

    it("should handle empty arrays", () => {
      const character = {
        empty: [],
      };

      const result = processor.process(character, "empty");
      expect(result).toBe("");
    });

    it("should handle non-numeric values in array", () => {
      const character = {
        mixed: ["abc", 10, "def", 25, "ghi"],
      };

      const result = processor.process(character, "mixed");
      expect(result).toBe(10);
    });

    it("should handle all non-numeric values", () => {
      const character = {
        strings: ["abc", "def", "ghi"],
      };

      const result = processor.process(character, "strings");
      expect(result).toBe("");
    });

    it("should warn and return empty string for non-array input", () => {
      const character = {
        notArray: "not an array",
      };

      const result = processor.process(character, "notArray");
      expect(result).toBe("");
      expect(consoleMocks.warnSpy).toHaveBeenCalledWith("SmallestFromArray requires an array, got:", "string");
    });

    it("should handle nested property paths", () => {
      const character = {
        system: {
          abilities: {
            scores: [8, 14, 16, 12],
          },
        },
      };

      const result = processor.process(character, "system.abilities.scores");
      expect(result).toBe(8);
    });
  });

  describe("CharacterSheetProcessor", () => {
    let processor;

    beforeEach(() => {
      processor = new CharacterSheetProcessor();
    });

    it("should generate character sheet button HTML", () => {
      const character = {
        uuid: "Actor.123",
        prototypeToken: {
          texture: {
            src: "path/to/token.png",
          },
          name: "Test Character",
          rotation: 0,
        },
      };

      const result = processor.process(character, "unused");

      expect(mockSafeString).toHaveBeenCalledWith(
        `<input type="image" data-action="onOpenActorSheet" name="fvtt-party-sheet-actorimage" data-actorid="Actor.123" class="token-image" src="path/to/token.png" title="Test Character" width="36" height="36" style="transform: rotate(0deg);"/>`,
      );
      expect(result.__isSafeString).toBe(true);
    });

    it("should handle character with rotation", () => {
      const character = {
        uuid: "Actor.456",
        prototypeToken: {
          texture: {
            src: "path/to/rotated.png",
          },
          name: "Rotated Character",
          rotation: 90,
        },
      };

      const result = processor.process(character, "unused");

      expect(mockSafeString).toHaveBeenCalledWith(expect.stringContaining("rotate(90deg)"));
    });

    it("should handle character without rotation", () => {
      const character = {
        uuid: "Actor.789",
        prototypeToken: {
          texture: {
            src: "path/to/norotation.png",
          },
          name: "No Rotation Character",
          // rotation is undefined
        },
      };

      const result = processor.process(character, "unused");

      expect(mockSafeString).toHaveBeenCalledWith(expect.stringContaining("rotate(0deg)"));
    });
  });
});
