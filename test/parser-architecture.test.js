/**
 * Tests for the new parser architecture
 */
// @jest-environment jsdom
import { jest } from "@jest/globals";
import { ParserFactory } from "../src/module/parsing/parser-factory.js";
import { createConsoleMocks } from "./test-mocks.js";

describe("Parser Architecture", () => {
  // Set up global Handlebars mock for the processors
  beforeAll(() => {
    window.Handlebars = {
      SafeString: function (value) {
        this.string = value;
        this.toString = function () {
          return this.string;
        };
      },
    };
  });
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
      expect(parserEngine.getRegisteredTypes()).toContain("span");
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

  describe("Span Processor", () => {
    test("should return empty string for span type", () => {
      const result = parserEngine.process(mockCharacter, "span", "any value");
      expect(result).toBe("");
    });

    test("should return empty string regardless of input", () => {
      const result = parserEngine.process(mockCharacter, "span", "{name}");
      expect(result).toBe("");
    });
  });

  describe("Direct Processor", () => {
    test("should extract simple property with braces", () => {
      const result = parserEngine.process(mockCharacter, "direct", "{name}");
      expect(result).toBe("Test Character");
    });

    test("should extract nested property with braces", () => {
      const result = parserEngine.process(mockCharacter, "direct", "{system.attributes.str.value}");
      // The result might be a string representation of the number
      expect(result.toString()).toBe("16");
    });

    test("should handle text with property in braces", () => {
      const result = parserEngine.process(mockCharacter, "direct", "Name: {name}");
      expect(result.toString()).toBe("Name: Test Character");
    });

    test("should not process space-surrounded properties", () => {
      const result = parserEngine.process(mockCharacter, "direct", "Name: name");
      expect(result.toString()).toBe("Name: name");
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

    test("should handle multiple properties with braces", () => {
      const result = parserEngine.process(mockCharacter, "direct", "{name} has {system.attributes.str.value} STR");
      expect(result.toString()).toBe("Test Character has 16 STR");
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

  describe("Direct-Complex Processor", () => {
    test("should process exists condition with braces", () => {
      const config = [
        {
          type: "exists",
          value: "system.attributes.str.value",
          text: "STR: {system.attributes.str.value}",
        },
      ];
      const result = parserEngine.process(mockCharacter, "direct-complex", config);
      expect(result.toString()).toBe("STR: 16");
    });

    test("should handle missing property in exists condition", () => {
      const config = [
        {
          type: "exists",
          value: "system.attributes.missing",
          text: "Missing: {system.attributes.missing}",
          else: "Not found",
        },
      ];
      const result = parserEngine.process(mockCharacter, "direct-complex", config);
      expect(result.toString()).toBe("Not found");
    });

    test("should process match condition with braces", () => {
      const config = [
        {
          type: "match",
          ifdata: "system.attributes.str.value",
          matches: "16",
          text: "Strong character with {system.attributes.str.value} STR",
        },
      ];
      const result = parserEngine.process(mockCharacter, "direct-complex", config);
      expect(result.toString()).toBe("Strong character with 16 STR");
    });

    test("should handle non-matching match condition", () => {
      const config = [
        {
          type: "match",
          ifdata: "system.attributes.str.value",
          matches: "10",
          text: "Average STR",
          else: "High STR: {system.attributes.str.value}",
        },
      ];
      const result = parserEngine.process(mockCharacter, "direct-complex", config);
      expect(result.toString()).toBe("High STR: 16");
    });

    test("should process multiple conditions", () => {
      const config = [
        {
          type: "exists",
          value: "system.attributes.str.value",
          text: "STR: {system.attributes.str.value}, ",
        },
        {
          type: "exists",
          value: "system.attributes.dex.value",
          text: "DEX: {system.attributes.dex.value}",
        },
      ];
      const result = parserEngine.process(mockCharacter, "direct-complex", config);
      expect(result.toString()).toBe("STR: 16,DEX: 14");
    });

    test("should handle complex text with formatting and properties", () => {
      const config = [
        {
          type: "exists",
          value: "name",
          text: "{b}{name}{/b} has {system.attributes.str.value} STR",
        },
      ];
      const result = parserEngine.process(mockCharacter, "direct-complex", config);
      expect(result.toString()).toContain("<b>Test Character</b> has 16 STR");
    });

    test("should not process space-surrounded properties in direct-complex", () => {
      const config = [
        {
          type: "exists",
          value: "name",
          text: "name has system.attributes.str.value STR",
        },
      ];
      const result = parserEngine.process(mockCharacter, "direct-complex", config);
      expect(result.toString()).toBe("name has system.attributes.str.value STR");
    });
  });

  describe("Brace vs Space Property Handling", () => {
    test("should only process brace-wrapped properties in direct processor", () => {
      const result = parserEngine.process(mockCharacter, "direct", "STR: {system.attributes.str.value}");
      expect(result.toString()).toBe("STR: 16");
    });

    test("should not process space-surrounded properties in direct processor", () => {
      const result = parserEngine.process(mockCharacter, "direct", "STR: system.attributes.str.value");
      expect(result.toString()).toBe("STR: system.attributes.str.value");
    });

    test("should handle mixed braces and text correctly", () => {
      const result = parserEngine.process(
        mockCharacter,
        "direct",
        "Character {name} with level 5 has {system.attributes.str.value} STR",
      );
      expect(result.toString()).toBe("Character Test Character with level 5 has 16 STR");
    });
  });

  describe("Error Handling", () => {
    let consoleMocks;

    beforeEach(() => {
      // Use shared console mocking utilities
      consoleMocks = createConsoleMocks();
    });

    afterEach(() => {
      // Restore console methods after each test
      consoleMocks.restore();
    });

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
