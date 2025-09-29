/**
 * Tests for the new parser architecture
 */
// @jest-environment jsdom
import { jest } from "@jest/globals";
import { ParserFactory } from "../src/module/parsing/parser-factory.js";
import { createConsoleMocks } from "./test-mocks.js";
import { PlusParser, MinusParser, MultiplyParser, DivideParser } from "../src/module/parsing/text-parsers";

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

    describe("Dropdown State Management", () => {
      test("should initialize with null dropdown states provider", () => {
        expect(parserEngine.dropdownStatesProvider).toBeNull();
      });

      test("should set dropdown states provider", () => {
        const mockProvider = { dropdownStates: new Map() };
        parserEngine.setDropdownStatesProvider(mockProvider);
        expect(parserEngine.dropdownStatesProvider).toBe(mockProvider);
      });

      test("should get saved dropdown state when provider is set", () => {
        const mockProvider = {
          dropdownStates: new Map([
            ["dropdown-1-test", "option1"],
            ["dropdown-2-example", "option2"],
          ]),
        };
        parserEngine.setDropdownStatesProvider(mockProvider);

        expect(parserEngine.getSavedDropdownState("dropdown-1-test")).toBe("option1");
        expect(parserEngine.getSavedDropdownState("dropdown-2-example")).toBe("option2");
        expect(parserEngine.getSavedDropdownState("nonexistent")).toBeNull();
      });

      test("should return null when no provider is set", () => {
        expect(parserEngine.getSavedDropdownState("any-dropdown")).toBeNull();
      });

      test("should return null when provider has no dropdownStates", () => {
        const mockProvider = {};
        parserEngine.setDropdownStatesProvider(mockProvider);
        expect(parserEngine.getSavedDropdownState("any-dropdown")).toBeNull();
      });

      test("should return null when provider dropdownStates is null", () => {
        const mockProvider = { dropdownStates: null };
        parserEngine.setDropdownStatesProvider(mockProvider);
        expect(parserEngine.getSavedDropdownState("any-dropdown")).toBeNull();
      });
    });

    describe("Dropdown Counter Reset", () => {
      test("should call resetDropdownCounter on processors that have it", () => {
        const mockProcessor1 = {
          resetDropdownCounter: jest.fn(),
          validate: jest.fn(),
          process: jest.fn(),
        };
        const mockProcessor2 = {
          validate: jest.fn(),
          process: jest.fn(),
          // No resetDropdownCounter method
        };
        const mockProcessor3 = {
          resetDropdownCounter: jest.fn(),
          validate: jest.fn(),
          process: jest.fn(),
        };

        // Create a new engine to avoid conflicts with other tests
        const testEngine = ParserFactory.createParserEngine();
        testEngine.clearProcessors();

        // Mock the instanceof check for DataProcessor
        Object.setPrototypeOf(mockProcessor1, Object.getPrototypeOf(testEngine.processors.values().next().value || {}));
        Object.setPrototypeOf(mockProcessor2, Object.getPrototypeOf(testEngine.processors.values().next().value || {}));
        Object.setPrototypeOf(mockProcessor3, Object.getPrototypeOf(testEngine.processors.values().next().value || {}));

        // Register mock processors
        testEngine.processors.set("test1", mockProcessor1);
        testEngine.processors.set("test2", mockProcessor2);
        testEngine.processors.set("test3", mockProcessor3);

        testEngine.resetDropdownCounters();

        expect(mockProcessor1.resetDropdownCounter).toHaveBeenCalledTimes(1);
        expect(mockProcessor3.resetDropdownCounter).toHaveBeenCalledTimes(1);
      });

      test("should handle empty processors map", () => {
        const testEngine = ParserFactory.createParserEngine();
        testEngine.clearProcessors();

        // Should not throw an error
        expect(() => testEngine.resetDropdownCounters()).not.toThrow();
      });
    });

    describe("Error Handling", () => {
      test("should throw error for unregistered processor type", () => {
        expect(() => {
          parserEngine.process(mockCharacter, "nonexistent", "value");
        }).toThrow("No processor registered for type: nonexistent");
      });

      test("should re-throw processor errors after logging", () => {
        // Create a mock console.error to capture the log
        const originalConsoleError = console.error;
        const mockConsoleError = jest.fn();
        console.error = mockConsoleError;

        try {
          // Mock a processor that throws an error
          const mockProcessor = {
            validate: jest.fn(),
            process: jest.fn(() => {
              throw new Error("Test processor error");
            }),
          };

          const testEngine = ParserFactory.createParserEngine();
          testEngine.clearProcessors();
          testEngine.processors.set("error-test", mockProcessor);

          expect(() => {
            testEngine.process(mockCharacter, "error-test", "value");
          }).toThrow("Test processor error");

          expect(mockConsoleError).toHaveBeenCalledWith('Error processing type "error-test":', expect.any(Error));
        } finally {
          console.error = originalConsoleError;
        }
      });
    });

    describe("Text Parsing", () => {
      test("should parse text using text parser chain", () => {
        const result = parserEngine.parseText("simple text", false);
        expect(result).toEqual([false, "simple text"]);
      });

      test("should handle SafeString requirement", () => {
        const result = parserEngine.parseText("text with special chars", true);
        expect(result[0]).toBe(true); // isSafeStringNeeded should be preserved or updated
        expect(typeof result[1]).toBe("string");
      });
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

    test("should handle multiply operations", () => {
      const result = parserEngine.process(mockCharacter, "direct", "5 {*} 3");
      expect(result.toString()).toBe("15");
    });

    test("should handle divide operations", () => {
      const result = parserEngine.process(mockCharacter, "direct", "15 {/} 3");
      expect(result.toString()).toBe("5");
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

    test("should parse multiply operations", () => {
      const [isSafe, result] = parserEngine.parseText("Result: 5 {*} 3");
      expect(isSafe).toBe(false);
      expect(result).toBe("Result: 15");
    });

    test("should parse divide operations", () => {
      const [isSafe, result] = parserEngine.parseText("Result: 15 {/} 3");
      expect(isSafe).toBe(false);
      expect(result).toBe("Result: 5");
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

  describe("Text Parsers", () => {
    describe("Plus parsing", () => {
      let plusParser;

      beforeEach(() => {
        plusParser = new PlusParser();
      });

      it("will parse a simple request", () => {
        const [, result] = plusParser.doParse("1 {+} 2", false);
        expect(result).toEqual("3");
      });

      it("will parse a simple request without spaces", () => {
        const [, result] = plusParser.doParse("1{+}2", false);
        expect(result).toEqual("3");
      });

      it("will parse a complex request", () => {
        const [, result] = plusParser.doParse("1 {+} 2 {+} 3", false);
        expect(result).toEqual("6");
      });

      it("will fail a complex request", () => {
        const [, result] = plusParser.doParse("1 {+} 2 {+} 3 {+}", false);
        expect(result).toEqual("6 {+}");
      });

      it("will fail a complex request again", () => {
        const [, result] = plusParser.doParse("1 {+} 2 {+} 3 {+} text", false);
        expect(result).toEqual("6 {+} text");
      });

      it("will parse a complex request again", () => {
        const [, result] = plusParser.doParse("1 {+} 2 {+} 3 {+} 10", false);
        expect(result).toEqual("16");
      });
    });

    describe("Minus parsing", () => {
      let minusParser;

      beforeEach(() => {
        minusParser = new MinusParser();
      });

      it("will parse a simple request", () => {
        const [, result] = minusParser.doParse("5 {-} 2", false);
        expect(result).toEqual("3");
      });

      it("will parse a simple request without spaces", () => {
        const [, result] = minusParser.doParse("10{-}3", false);
        expect(result).toEqual("7");
      });

      it("will parse a complex request", () => {
        const [, result] = minusParser.doParse("10 {-} 3 {-} 2", false);
        expect(result).toEqual("5");
      });

      it("will fail a complex request", () => {
        const [, result] = minusParser.doParse("10 {-} 3 {-} 2 {-}", false);
        expect(result).toEqual("5 {-}");
      });

      it("will fail a complex request again", () => {
        const [, result] = minusParser.doParse("10 {-} 3 {-} 2 {-} text", false);
        expect(result).toEqual("5 {-} text");
      });

      it("will parse a complex request again", () => {
        const [, result] = minusParser.doParse("20 {-} 5 {-} 3 {-} 2", false);
        expect(result).toEqual("10");
      });

      it("will handle negative results", () => {
        const [, result] = minusParser.doParse("3 {-} 5", false);
        expect(result).toEqual("-2");
      });
    });

    describe("Multiply parsing", () => {
      let multiplyParser;

      beforeEach(() => {
        multiplyParser = new MultiplyParser();
      });

      it("will parse a simple request", () => {
        const [, result] = multiplyParser.doParse("5 {*} 2", false);
        expect(result).toEqual("10");
      });

      it("will parse a simple request without spaces", () => {
        const [, result] = multiplyParser.doParse("3{*}4", false);
        expect(result).toEqual("12");
      });

      it("will parse a complex request", () => {
        const [, result] = multiplyParser.doParse("2 {*} 3 {*} 4", false);
        expect(result).toEqual("24");
      });

      it("will fail a complex request", () => {
        const [, result] = multiplyParser.doParse("2 {*} 3 {*} 4 {*}", false);
        expect(result).toEqual("24 {*}");
      });

      it("will fail a complex request again", () => {
        const [, result] = multiplyParser.doParse("2 {*} 3 {*} 4 {*} text", false);
        expect(result).toEqual("24 {*} text");
      });

      it("will parse a complex request again", () => {
        const [, result] = multiplyParser.doParse("2 {*} 3 {*} 4 {*} 2", false);
        expect(result).toEqual("48");
      });

      it("will handle multiplication by zero", () => {
        const [, result] = multiplyParser.doParse("5 {*} 0", false);
        expect(result).toEqual("0");
      });
    });

    describe("Divide parsing", () => {
      let divideParser;

      beforeEach(() => {
        divideParser = new DivideParser();
      });

      it("will parse a simple request", () => {
        const [, result] = divideParser.doParse("10 {/} 2", false);
        expect(result).toEqual("5");
      });

      it("will parse a simple request without spaces", () => {
        const [, result] = divideParser.doParse("12{/}3", false);
        expect(result).toEqual("4");
      });

      it("will parse a complex request", () => {
        const [, result] = divideParser.doParse("24 {/} 2 {/} 3", false);
        expect(result).toEqual("4");
      });

      it("will fail a complex request", () => {
        const [, result] = divideParser.doParse("10 {/} 2 {/} 5 {/}", false);
        expect(result).toEqual("1 {/}");
      });

      it("will fail a complex request again", () => {
        const [, result] = divideParser.doParse("10 {/} 2 {/} 5 {/} text", false);
        expect(result).toEqual("1 {/} text");
      });

      it("will parse a complex request again", () => {
        const [, result] = divideParser.doParse("24 {/} 2 {/} 3 {/} 2", false);
        expect(result).toEqual("2");
      });

      it("will handle division by zero", () => {
        const [, result] = divideParser.doParse("5 {/} 0", false);
        expect(result).toEqual("5 {/} 0");
      });

      it("will handle decimal results", () => {
        const [, result] = divideParser.doParse("10 {/} 3", false);
        expect(result).toEqual("3.3333333333333335");
      });
    });
  });
});
