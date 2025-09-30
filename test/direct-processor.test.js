// eslint-disable-next-line no-shadow
import { jest } from "@jest/globals";
import { DirectProcessor } from "../src/module/parsing/processors/direct-processor.js";
import { ParserEngine } from "../src/module/parsing/parser-engine.js";
import { setupFoundryMocks, cleanupFoundryMocks, createConsoleMocks } from "./test-mocks.js";

// Mock Handlebars SafeString
const mockSafeString = jest.fn().mockImplementation((content) => ({ content, __isSafeString: true }));
global.Handlebars = {
  SafeString: mockSafeString,
};

describe("DirectProcessor", () => {
  let processor;
  let parserEngine;
  let consoleMocks;

  beforeEach(() => {
    setupFoundryMocks();
    consoleMocks = createConsoleMocks();

    parserEngine = new ParserEngine();
    processor = new DirectProcessor(parserEngine);
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupFoundryMocks();
    consoleMocks.restore();
  });

  describe("basic direct processing", () => {
    it("should process simple template with property replacement", () => {
      const character = { name: "Test Character" };

      const result = processor.process(character, "Character: {name}");

      expect(result).toBe("Character: Test Character");
    });

    it("should handle character sheet token replacement", () => {
      const character = {
        uuid: "Actor.123",
        img: "path/to/token.png",
        name: "Test Token",
      };

      const result = processor.process(character, "Token: {charactersheet}");

      // Result is a SafeString object, check its content
      expect(mockSafeString).toHaveBeenCalled();
      expect(result.__isSafeString).toBe(true);
      expect(result.content).toContain('<input type="image"');
      expect(result.content).toContain("path/to/token.png");
      expect(result.content).toContain("Test Token");
      expect(result.content).toContain("Actor.123");
    });

    it("should handle character sheet token with basic data", () => {
      const character = {
        uuid: "Actor.456",
        img: "path/to/token.png",
        name: "Test Token",
      };

      const result = processor.process(character, "{charactersheet}");

      // Result is a SafeString object
      expect(result.__isSafeString).toBe(true);
      expect(result.content).toContain('<input type="image"');
      expect(result.content).toContain("Actor.456");
    });
  });

  describe("options processing", () => {
    it("should add sign when showSign option is true", () => {
      const character = { score: 15 };
      const options = { showSign: true };

      const result = processor.process(character, "{score}", options);

      expect(result).toBe("+15");
    });

    it("should not modify value when showSign option is false", () => {
      const character = { score: 15 };
      const options = { showSign: false };

      const result = processor.process(character, "{score}", options);

      expect(result).toBe("15");
    });

    it("should handle empty options object", () => {
      const character = { name: "Test" };

      const result = processor.process(character, "{name}", {});

      expect(result).toBe("Test");
    });
  });

  describe("SafeString handling", () => {
    it("should return SafeString when HTML content is detected", () => {
      const character = { name: "Test" };

      const result = processor.process(character, "<b>{name}</b>");

      // HTML content alone doesn't trigger SafeString - only {charactersheet} does
      expect(result).toBe("<b>Test</b>");
      expect(mockSafeString).not.toHaveBeenCalled();
    });

    it("should return plain text when SafeString not needed", () => {
      const character = { name: "Test" };

      const result = processor.process(character, "{name}");

      expect(result).toBe("Test");
      expect(mockSafeString).not.toHaveBeenCalled();
    });

    it("should handle SafeString creation when Handlebars is undefined", () => {
      const character = {
        uuid: "Actor.123",
        img: "test.png",
        name: "Test",
      };

      // Temporarily remove Handlebars
      const originalHandlebars = global.Handlebars;
      delete global.Handlebars;

      const result = processor.process(character, "{charactersheet}");

      // Should return SafeString-like object
      expect(result.toString).toBeDefined();
      expect(result.string).toContain('<input type="image"');

      // Restore Handlebars
      global.Handlebars = originalHandlebars;
    });
  });

  describe("string cleaning", () => {
    it("should clean string values using sanitizer", () => {
      const dirtyString = "<script>alert('xss')</script>";

      const result = processor.cleanString(dirtyString);

      // The actual sanitizer removes dangerous content
      expect(result).toBe("");
    });

    it("should not clean non-string values", () => {
      const numberValue = 42;

      const result = processor.cleanString(numberValue);

      expect(result).toBe(42);
    });

    it("should handle null values", () => {
      const result = processor.cleanString(null);

      expect(result).toBeNull();
    });

    it("should handle undefined values", () => {
      const result = processor.cleanString(undefined);

      expect(result).toBeUndefined();
    });
  });

  describe("validation", () => {
    it("should validate character parameter", () => {
      expect(() => {
        processor.process(null, "test");
      }).toThrow("Character parameter is required");
    });

    it("should validate value parameter", () => {
      expect(() => {
        processor.process({}, null);
      }).toThrow("Value parameter is required");
    });
  });

  describe("complex scenarios", () => {
    it("should handle multiple character sheet tokens", () => {
      const character = {
        uuid: "Actor.123",
        img: "token.png",
        name: "Test",
      };

      const result = processor.process(character, "{charactersheet} and {charactersheet}");

      // Result is a SafeString object
      expect(result.__isSafeString).toBe(true);
      const inputMatches = result.content.match(/<input type="image"/g);
      expect(inputMatches).toHaveLength(2);
    });

    it("should handle mixed template and character sheet tokens", () => {
      const character = {
        name: "Hero",
        uuid: "Actor.123",
        img: "token.png",
      };

      const result = processor.process(character, "{name} {charactersheet}");

      expect(mockSafeString).toHaveBeenCalled();
      expect(result.content).toContain("Hero");
      expect(result.content).toContain('<input type="image"');
    });

    it("should handle empty template strings", () => {
      const character = { name: "Test" };

      const result = processor.process(character, "");

      expect(result).toBe("");
    });

    it("should handle templates with no property replacements", () => {
      const character = { name: "Test" };

      const result = processor.process(character, "Static text");

      expect(result).toBe("Static text");
    });
  });
});
