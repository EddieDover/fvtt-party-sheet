// eslint-disable-next-line no-shadow
import { jest } from "@jest/globals";
import {
  TextParser,
  PlusParser,
  MinusParser,
  MultiplyParser,
  DivideParser,
  FormattingParser,
  ColorParser,
  FontAwesomeParser,
  SpacingParser,
  NewlineParser,
  TextParserChain,
} from "../src/module/parsing/text-parsers.js";
import { setupFoundryMocks, cleanupFoundryMocks, createConsoleMocks } from "./test-mocks.js";

describe("Text Parsers", () => {
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

  describe("TextParser Base Class", () => {
    it("should create a parser with null nextParser", () => {
      const parser = new TextParser();
      expect(parser.nextParser).toBeNull();
    });

    it("should set next parser and return it", () => {
      const parser1 = new TextParser();
      const parser2 = new TextParser();

      const result = parser1.setNext(parser2);

      expect(parser1.nextParser).toBe(parser2);
      expect(result).toBe(parser2);
    });

    it("should parse through chain", () => {
      const parser1 = new TextParser();
      const parser2 = new TextParser();

      // Mock the doParse methods
      parser1.doParse = jest.fn().mockReturnValue([false, "modified1"]);
      parser2.doParse = jest.fn().mockReturnValue([true, "modified2"]);

      parser1.setNext(parser2);

      const result = parser1.parse("test", false);

      expect(parser1.doParse).toHaveBeenCalledWith("test", false);
      expect(parser2.doParse).toHaveBeenCalledWith("modified1", false);
      expect(result).toEqual([true, "modified2"]);
    });

    it("should return result when no next parser", () => {
      const parser = new TextParser();
      parser.doParse = jest.fn().mockReturnValue([true, "result"]);

      const result = parser.parse("test", false);

      expect(result).toEqual([true, "result"]);
    });
  });

  describe("Math Parsers", () => {
    describe("PlusParser", () => {
      let parser;

      beforeEach(() => {
        parser = new PlusParser();
      });

      it("should add simple numbers", () => {
        const [isSafe, result] = parser.doParse("5{+}3", false);
        expect(isSafe).toBe(false);
        expect(result).toBe("8");
      });

      it("should add numbers with spaces", () => {
        const [isSafe, result] = parser.doParse("5 {+} 3", false);
        expect(isSafe).toBe(false);
        expect(result).toBe("8");
      });

      it("should handle multiple additions", () => {
        const [isSafe, result] = parser.doParse("5{+}3{+}2", false);
        expect(isSafe).toBe(false);
        expect(result).toBe("10");
      });

      it("should handle decimal numbers", () => {
        const [isSafe, result] = parser.doParse("5.5{+}2.3", false);
        expect(isSafe).toBe(false);
        expect(result).toBe("7.8");
      });

      it("should not modify text without plus operations", () => {
        const [isSafe, result] = parser.doParse("no math here", false);
        expect(isSafe).toBe(false);
        expect(result).toBe("no math here");
      });
    });

    describe("MinusParser", () => {
      let parser;

      beforeEach(() => {
        parser = new MinusParser();
      });

      it("should subtract simple numbers", () => {
        const [isSafe, result] = parser.doParse("10{-}3", false);
        expect(isSafe).toBe(false);
        expect(result).toBe("7");
      });

      it("should subtract numbers with spaces", () => {
        const [isSafe, result] = parser.doParse("10 {-} 3", false);
        expect(isSafe).toBe(false);
        expect(result).toBe("7");
      });

      it("should handle multiple subtractions", () => {
        const [isSafe, result] = parser.doParse("10{-}3{-}2", false);
        expect(isSafe).toBe(false);
        expect(result).toBe("5");
      });

      it("should handle negative results", () => {
        const [isSafe, result] = parser.doParse("3{-}5", false);
        expect(isSafe).toBe(false);
        expect(result).toBe("-2");
      });
    });

    describe("MultiplyParser", () => {
      let parser;

      beforeEach(() => {
        parser = new MultiplyParser();
      });

      it("should multiply simple numbers", () => {
        const [isSafe, result] = parser.doParse("5{*}3", false);
        expect(isSafe).toBe(false);
        expect(result).toBe("15");
      });

      it("should handle decimal multiplication", () => {
        const [isSafe, result] = parser.doParse("2.5{*}4", false);
        expect(isSafe).toBe(false);
        expect(result).toBe("10");
      });
    });

    describe("DivideParser", () => {
      let parser;

      beforeEach(() => {
        parser = new DivideParser();
      });

      it("should divide simple numbers", () => {
        const [isSafe, result] = parser.doParse("15{/}3", false);
        expect(isSafe).toBe(false);
        expect(result).toBe("5");
      });

      it("should handle decimal division", () => {
        const [isSafe, result] = parser.doParse("7{/}2", false);
        expect(isSafe).toBe(false);
        expect(result).toBe("3.5");
      });

      it("should handle division by zero gracefully", () => {
        const [isSafe, result] = parser.doParse("5{/}0", false);
        expect(isSafe).toBe(false);
        expect(result).toBe("5{/}0"); // Should leave unchanged when division by zero
      });
    });
  });

  describe("FormattingParser", () => {
    let parser;

    beforeEach(() => {
      parser = new FormattingParser();
    });

    describe("Basic Formatting", () => {
      it("should handle italic tags", () => {
        const [isSafe, result] = parser.doParse("Hello {i}world{/i}", false);
        expect(isSafe).toBe(true);
        expect(result).toBe("Hello <i>world</i>");
      });

      it("should handle bold tags", () => {
        const [isSafe, result] = parser.doParse("Hello {b}world{/b}", false);
        expect(isSafe).toBe(true);
        expect(result).toBe("Hello <b>world</b>");
      });

      it("should handle underline tags", () => {
        const [isSafe, result] = parser.doParse("Hello {u}world{/u}", false);
        expect(isSafe).toBe(true);
        expect(result).toBe("Hello <u>world</u>");
      });

      it("should handle space tags", () => {
        const [isSafe, result] = parser.doParse("Hello{s}world", false);
        expect(isSafe).toBe(true);
        expect(result).toBe("Hello&nbsp;world");
      });

      it("should handle multiple formatting tags", () => {
        const [isSafe, result] = parser.doParse("{b}Bold{/b} and {i}italic{/i}", false);
        expect(isSafe).toBe(true);
        expect(result).toBe("<b>Bold</b> and <i>italic</i>");
      });
    });

    describe("Progress Bar", () => {
      it("should create basic progress bar", () => {
        const [isSafe, result] = parser.doParse("{progress 50 100}", false);
        expect(isSafe).toBe(true);
        expect(result).toContain('<progress value="50" max="100"');
        expect(result).toContain("50/100</progress>");
      });

      it("should create progress bar with custom color", () => {
        const [isSafe, result] = parser.doParse("{progress 75 100 #FF5722}", false);
        expect(isSafe).toBe(true);
        expect(result).toContain('<progress value="75" max="100"');
        expect(result).toContain('style="accent-color: #FF5722;');
        expect(result).toContain("75/100</progress>");
      });

      it("should create progress bar with named color", () => {
        const [isSafe, result] = parser.doParse("{progress 30 100 red}", false);
        expect(isSafe).toBe(true);
        expect(result).toContain('style="accent-color: red;');
      });

      it("should handle decimal values in progress bar", () => {
        const [isSafe, result] = parser.doParse("{progress 33.5 100}", false);
        expect(isSafe).toBe(true);
        expect(result).toContain('<progress value="33.5" max="100"');
        expect(result).toContain("33.5/100</progress>");
      });

      it("should handle multiple progress bars", () => {
        const [isSafe, result] = parser.doParse("{progress 50 100} and {progress 25 50 blue}", false);
        expect(isSafe).toBe(true);
        expect(result).toContain('<progress value="50" max="100"');
        expect(result).toContain('<progress value="25" max="50"');
        expect(result).toContain('style="accent-color: blue;');
      });
    });

    describe("Meter Element", () => {
      it("should create basic meter", () => {
        const [isSafe, result] = parser.doParse("{meter 75 0 100}", false);
        expect(isSafe).toBe(true);
        expect(result).toContain('<meter min="0" max="100" value="75"');
        expect(result).toContain("75</meter>");
      });

      it("should create meter with low threshold", () => {
        const [isSafe, result] = parser.doParse("{meter 25 0 100 30}", false);
        expect(isSafe).toBe(true);
        expect(result).toContain('<meter min="0" max="100" value="25" low="30"');
        expect(result).toContain("25</meter>");
      });

      it("should create meter with low and high thresholds", () => {
        const [isSafe, result] = parser.doParse("{meter 50 0 100 20 80}", false);
        expect(isSafe).toBe(true);
        expect(result).toContain('<meter min="0" max="100" value="50" low="20" high="80"');
      });

      it("should create meter with all parameters", () => {
        const [isSafe, result] = parser.doParse("{meter 60 0 100 25 75 65}", false);
        expect(isSafe).toBe(true);
        expect(result).toContain('<meter min="0" max="100" value="60" low="25" high="75" optimum="65"');
        expect(result).toContain("60</meter>");
      });

      it("should handle decimal values in meter", () => {
        const [isSafe, result] = parser.doParse("{meter 33.5 0 100.5 25.25}", false);
        expect(isSafe).toBe(true);
        expect(result).toContain('<meter min="0" max="100.5" value="33.5" low="25.25"');
      });

      it("should handle negative ranges in meter", () => {
        const [isSafe, result] = parser.doParse("{meter -5 -10 10}", false);
        expect(isSafe).toBe(true);
        expect(result).toContain('<meter min="-10" max="10" value="-5"');
      });

      it("should handle multiple meters", () => {
        const [isSafe, result] = parser.doParse("HP: {meter 75 0 100} MP: {meter 30 0 50}", false);
        expect(isSafe).toBe(true);
        expect(result).toContain('<meter min="0" max="100" value="75"');
        expect(result).toContain('<meter min="0" max="50" value="30"');
      });
    });

    describe("Complex Math in Progress and Meter", () => {
      it("should handle math operations in progress bar", () => {
        // Note: This tests the interaction between math parsers and formatting parser
        // In real usage, math would be processed first by the parser chain
        const mathParser = new PlusParser();
        const [, mathResult] = mathParser.doParse("{progress 25 {+} 25 100}", false);
        const [isSafe, result] = parser.doParse(mathResult, false);

        expect(isSafe).toBe(true);
        expect(result).toContain('<progress value="50" max="100"');
      });

      it("should handle division in meter thresholds", () => {
        const divideParser = new DivideParser();
        const [, mathResult] = divideParser.doParse("{meter 75 0 100 100 {/} 4}", false);
        const [isSafe, result] = parser.doParse(mathResult, false);

        expect(isSafe).toBe(true);
        expect(result).toContain('<meter min="0" max="100" value="75" low="25"');
      });
    });
  });

  describe("ColorParser", () => {
    let parser;

    beforeEach(() => {
      parser = new ColorParser();
    });

    it("should parse named colors", () => {
      const [isSafe, result] = parser.doParse("Hello {c:red}world{/c}", false);
      expect(isSafe).toBe(true);
      expect(result).toBe('Hello <span style="color: red">world</span>');
    });

    it("should parse hex colors with 3 digits", () => {
      const [isSafe, result] = parser.doParse("Status: {c:#F00}Critical{/c}", false);
      expect(isSafe).toBe(true);
      expect(result).toBe('Status: <span style="color: #F00">Critical</span>');
    });

    it("should parse hex colors with 6 digits", () => {
      const [isSafe, result] = parser.doParse("HP: {c:#4CAF50}Healthy{/c}", false);
      expect(isSafe).toBe(true);
      expect(result).toBe('HP: <span style="color: #4CAF50">Healthy</span>');
    });

    it("should handle multiple color tags", () => {
      const [isSafe, result] = parser.doParse("{c:red}Stop{/c} and {c:green}Go{/c}", false);
      expect(isSafe).toBe(true);
      expect(result).toBe('<span style="color: red">Stop</span> and <span style="color: green">Go</span>');
    });

    it("should not modify text without color tags", () => {
      const [isSafe, result] = parser.doParse("No colors here", false);
      expect(isSafe).toBe(false);
      expect(result).toBe("No colors here");
    });

    it("should handle nested content", () => {
      const [isSafe, result] = parser.doParse("{c:blue}This is a long message{/c}", false);
      expect(isSafe).toBe(true);
      expect(result).toBe('<span style="color: blue">This is a long message</span>');
    });
  });

  describe("FontAwesome Parser", () => {
    let parser;

    beforeEach(() => {
      parser = new FontAwesomeParser();
    });

    it("should parse FontAwesome icons", () => {
      const [isSafe, result] = parser.doParse("Hello {fa-solid fa-heart}", false);
      expect(isSafe).toBe(true);
      expect(result).toBe('Hello <i class="fa-solid fa-heart"></i>');
    });

    it("should handle multiple FontAwesome icons", () => {
      const [isSafe, result] = parser.doParse("{fa-solid fa-sword} Attack {fa-solid fa-shield}", false);
      expect(isSafe).toBe(true);
      expect(result).toBe('<i class="fa-solid fa-sword"></i> Attack <i class="fa-solid fa-shield"></i>');
    });

    it("should not modify text without FontAwesome", () => {
      const [isSafe, result] = parser.doParse("No icons here", false);
      expect(isSafe).toBe(false);
      expect(result).toBe("No icons here");
    });
  });

  describe("SpacingParser", () => {
    let parser;

    beforeEach(() => {
      parser = new SpacingParser();
    });

    it("should parse spacing tags", () => {
      const [isSafe, result] = parser.doParse("Hello{s3}world", false);
      expect(isSafe).toBe(true);
      expect(result).toBe("Hello&nbsp;&nbsp;&nbsp;world");
    });

    it("should handle zero spacing", () => {
      const [isSafe, result] = parser.doParse("Hello{s0}world", false);
      expect(isSafe).toBe(true);
      expect(result).toBe("Helloworld");
    });

    it("should handle large spacing", () => {
      const [isSafe, result] = parser.doParse("A{s10}B", false);
      expect(isSafe).toBe(true);
      expect(result).toBe("A&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;B");
    });
  });

  describe("NewlineParser", () => {
    let parser;

    beforeEach(() => {
      parser = new NewlineParser();
    });

    it("should parse newline tags", () => {
      const [isSafe, result] = parser.doParse("Line 1{newline}Line 2", false);
      expect(isSafe).toBe(true);
      expect(result).toBe("Line 1<br>Line 2");
    });

    it("should parse nl tags", () => {
      const [isSafe, result] = parser.doParse("Line 1{nl}Line 2", false);
      expect(isSafe).toBe(true);
      expect(result).toBe("Line 1<br>Line 2");
    });

    it("should handle multiple newlines", () => {
      const [isSafe, result] = parser.doParse("A{nl}B{newline}C", false);
      expect(isSafe).toBe(true);
      expect(result).toBe("A<br>B<br>C");
    });
  });

  describe("TextParserChain", () => {
    it("should create a complete parser chain", () => {
      const chain = TextParserChain.create();
      expect(chain).toBeInstanceOf(PlusParser);
      expect(chain.nextParser).toBeInstanceOf(MinusParser);
    });

    it("should parse complex text with multiple features", () => {
      const [isSafe, result] = TextParserChain.parse("HP: {progress 75 100 red} - STR: {b}5 {+} 3{/b}", false);
      expect(isSafe).toBe(true);
      expect(result).toContain("<progress");
      expect(result).toContain("<b>8</b>"); // Math should be processed first
      expect(result).toContain('style="accent-color: red;');
    });

    it("should handle meter with math operations", () => {
      const [isSafe, result] = TextParserChain.parse("Status: {meter 75 0 100 100 {/} 4}", false);
      expect(isSafe).toBe(true);
      expect(result).toContain("<meter");
      expect(result).toContain('low="25"'); // 100/4 = 25
    });

    it("should process formatting and math together", () => {
      const [isSafe, result] = TextParserChain.parse("{i}Total:{/i} 10 {+} 5 = {b}15{/b}", false);
      expect(isSafe).toBe(true);
      expect(result).toBe("<i>Total:</i> 15 = <b>15</b>");
    });

    it("should handle FontAwesome with spacing", () => {
      const [isSafe, result] = TextParserChain.parse("{fa-solid fa-heart}{s3}Love", false);
      expect(isSafe).toBe(true);
      expect(result).toBe('<i class="fa-solid fa-heart"></i>&nbsp;&nbsp;&nbsp;Love');
    });

    it("should handle color tags with other formatting", () => {
      const [isSafe, result] = TextParserChain.parse("{c:red}{b}Critical{/b}{/c} HP", false);
      expect(isSafe).toBe(true);
      expect(result).toBe('<span style="color: red"><b>Critical</b></span> HP');
    });

    it("should handle multiple colors in complex text", () => {
      const [isSafe, result] = TextParserChain.parse("HP: {c:green}75{/c}/100 MP: {c:blue}30{/c}/50", false);
      expect(isSafe).toBe(true);
      expect(result).toContain('<span style="color: green">75</span>');
      expect(result).toContain('<span style="color: blue">30</span>');
    });

    it("should process complex meter with embedded math", () => {
      const [isSafe, result] = TextParserChain.parse("Health: {meter 50 {+} 25 0 100 20 80 60}", false);
      expect(isSafe).toBe(true);
      expect(result).toContain('<meter min="0" max="100" value="75"');
      expect(result).toContain('low="20" high="80" optimum="60"');
    });

    it("should maintain safe string flag appropriately", () => {
      // Text with no HTML-generating features
      const [isSafe1, result1] = TextParserChain.parse("5 {+} 3", false);
      expect(isSafe1).toBe(false);
      expect(result1).toBe("8");

      // Text with HTML-generating features
      const [isSafe2, result2] = TextParserChain.parse("{b}Bold{/b}", false);
      expect(isSafe2).toBe(true);
      expect(result2).toBe("<b>Bold</b>");
    });

    it("should handle static parse method", () => {
      const [isSafe, result] = TextParserChain.parse("Test {+} works", false);
      expect(isSafe).toBe(false);
      expect(result).toBe("Test {+} works"); // Invalid math syntax should be left unchanged
    });
  });
});
