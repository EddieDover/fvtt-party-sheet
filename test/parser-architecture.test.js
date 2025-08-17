/**
 * Tests for the new parser architecture
 */
// @jest-environment node
import { ParserFactory } from "../src/module/parsing/parser-factory.js";

describe("Parser Architecture", () => {
  let parserEngine;
  let mockCharacter;

  beforeEach(() => {
    parserEngine = ParserFactory.createParserEngine();
    mockCharacter = {
      name: "Test Character",
      level: 5,
      system: {
        attributes: {
          str: { value: 16 },
          dex: { value: 14 },
        },
      },
      uuid: "test-actor-123",
      prototypeToken: {
        name: "Test Token",
        texture: { src: "/test.png" },
        rotation: 0,
      },
    };
  });

  describe("Parser Engine", () => {
    test("should be properly initialized", () => {
      expect(parserEngine).toBeDefined();
      expect(parserEngine.getRegisteredTypes()).toContain("direct");
      expect(parserEngine.getRegisteredTypes()).toContain("string");
      expect(parserEngine.getRegisteredTypes()).toContain("direct-complex");
    });

    test("should check if processors are registered", () => {
      expect(parserEngine.hasProcessor("direct")).toBe(true);
      expect(parserEngine.hasProcessor("nonexistent")).toBe(false);
    });
  });

  describe("String Processor", () => {
    test("should return value as-is", () => {
      const result = parserEngine.process(mockCharacter, "string", "Hello World");
      expect(result).toBe("Hello World");
    });
  });

  describe("Direct Processor", () => {
    test("should extract simple property", () => {
      const result = parserEngine.process(mockCharacter, "direct", "name");
      expect(result).toBe("Test Character");
    });

    test("should extract nested property", () => {
      const result = parserEngine.process(mockCharacter, "direct", "system.attributes.str.value");
      // The result might be a string representation of the number
      expect(result.toString()).toBe("16");
    });

    test("should handle text with formatting", () => {
      const result = parserEngine.process(mockCharacter, "direct", "Level: {b}5{/b}");
      // Should return a SafeString with HTML (toString handles both SafeString and mock objects)
      expect(result.toString()).toContain("Level: <b>5</b>");
    });

    test("should handle plus operations", () => {
      const result = parserEngine.process(mockCharacter, "direct", "5 {+} 3");
      expect(result.toString()).toBe("8");
    });
  });

  describe("Text Parser Chain", () => {
    test("should parse formatting tags", () => {
      const [isSafe, result] = parserEngine.parseText("Hello {b}World{/b}");
      expect(isSafe).toBe(true);
      expect(result).toBe("Hello <b>World</b>");
    });

    test("should parse plus operations", () => {
      const [isSafe, result] = parserEngine.parseText("Result: 5 {+} 3");
      expect(isSafe).toBe(false);
      expect(result).toBe("Result: 8");
    });

    test("should parse newlines", () => {
      const [isSafe, result] = parserEngine.parseText("Line 1{nl}Line 2");
      expect(isSafe).toBe(true);
      expect(result).toBe("Line 1<br>Line 2");
    });
  });

  describe("Error Handling", () => {
    test("should throw error for unknown processor type", () => {
      expect(() => {
        parserEngine.process(mockCharacter, "unknown-type", "test");
      }).toThrow("No processor registered for type: unknown-type");
    });

    test("should validate character parameter", () => {
      expect(() => {
        parserEngine.process(null, "string", "test");
      }).toThrow("Character parameter is required");
    });
  });
});
