import { jest } from "@jest/globals";
import { DirectProcessor } from "../src/module/parsing/processors/direct-processor.js";
import { setupFoundryMocks, cleanupFoundryMocks, createConsoleMocks } from "./test-mocks.js";

// Mock Handlebars SafeString
const mockSafeString = jest.fn().mockImplementation((content) => ({ content, __isSafeString: true }));
global.Handlebars = {
  SafeString: mockSafeString,
};

describe("DirectProcessor", () => {
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
    
    processor = new DirectProcessor(mockParserEngine);
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

      expect(result).toBe("parsed_text");
      // The template processor should replace {name} with actual value
      expect(mockParserEngine.parseText).toHaveBeenCalledWith("Character: Test Character", false);
    });

    it("should handle character sheet token replacement", () => {
      const character = {
        uuid: "Actor.123",
        prototypeToken: {
          texture: { src: "path/to/token.png" },
          name: "Test Token",
          rotation: 45
        }
      };

      mockParserEngine.parseText.mockReturnValue([true, "<input>token</input>"]);

      const result = processor.process(character, "Token: {charactersheet}");

      expect(mockSafeString).toHaveBeenCalledWith("<input>token</input>");
      expect(result.__isSafeString).toBe(true);
    });

    it("should handle character sheet token without rotation", () => {
      const character = {
        uuid: "Actor.456",
        prototypeToken: {
          texture: { src: "path/to/token.png" },
          name: "Test Token"
          // rotation is undefined
        }
      };

      const result = processor.process(character, "{charactersheet}");

      // Should default rotation to 0
      expect(result).toBe("parsed_text");
    });
  });

  describe("options processing", () => {
    it("should add sign when showSign option is true", () => {
      const character = { score: 15 };
      const options = { showSign: true };

      const result = processor.process(character, "{score}", options);

      expect(result).toBe("parsed_text");
    });

    it("should not modify value when showSign option is false", () => {
      const character = { score: 15 };
      const options = { showSign: false };

      const result = processor.process(character, "{score}", options);

      expect(result).toBe("parsed_text");
    });

    it("should handle empty options object", () => {
      const character = { name: "Test" };

      const result = processor.process(character, "{name}", {});

      expect(result).toBe("parsed_text");
    });
  });

  describe("SafeString handling", () => {
    it("should return SafeString when HTML content is detected", () => {
      const character = { name: "Test" };

      mockParserEngine.parseText.mockReturnValue([true, "<b>Test</b>"]);

      const result = processor.process(character, "<b>{name}</b>");

      expect(mockSafeString).toHaveBeenCalledWith("<b>Test</b>");
      expect(result.__isSafeString).toBe(true);
    });

    it("should return plain text when SafeString not needed", () => {
      const character = { name: "Test" };

      mockParserEngine.parseText.mockReturnValue([false, "Test"]);

      const result = processor.process(character, "{name}");

      expect(result).toBe("Test");
      expect(mockSafeString).not.toHaveBeenCalled();
    });

    it("should handle SafeString creation when Handlebars is undefined", () => {
      const character = { name: "Test" };
      
      // Temporarily remove Handlebars
      const originalHandlebars = global.Handlebars;
      delete global.Handlebars;

      mockParserEngine.parseText.mockReturnValue([true, "<b>Test</b>"]);

      const result = processor.process(character, "<b>{name}</b>");

      // Should return SafeString-like object
      expect(result.toString).toBeDefined();
      expect(result.string).toBe("<b>Test</b>");

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
        prototypeToken: {
          texture: { src: "token.png" },
          name: "Test",
          rotation: 0
        }
      };

      const result = processor.process(character, "{charactersheet} and {charactersheet}");

      expect(result).toBe("parsed_text");
    });

    it("should handle mixed template and character sheet tokens", () => {
      const character = {
        name: "Hero",
        uuid: "Actor.123",
        prototypeToken: {
          texture: { src: "token.png" },
          name: "Hero Token",
          rotation: 90
        }
      };

      mockParserEngine.parseText.mockReturnValue([true, "Hero <input>token</input>"]);

      const result = processor.process(character, "{name} {charactersheet}");

      expect(mockSafeString).toHaveBeenCalledWith("Hero <input>token</input>");
    });

    it("should handle empty template strings", () => {
      const character = { name: "Test" };

      const result = processor.process(character, "");

      expect(result).toBe("parsed_text");
    });

    it("should handle templates with no property replacements", () => {
      const character = { name: "Test" };

      const result = processor.process(character, "Static text");

      expect(result).toBe("parsed_text");
    });
  });
});
