/**
 * Base class for text parsers using Chain of Responsibility pattern
 */
export class TextParser {
  constructor() {
    this.nextParser = null;
  }

  /**
   * Set the next parser in the chain
   * @param {TextParser} parser - The next parser
   * @returns {TextParser} The next parser for chaining
   */
  setNext(parser) {
    this.nextParser = parser;
    return parser;
  }

  /**
   * Parse the text value
   * @param {string} value - The text value to parse
   * @param {boolean} isSafeStringNeeded - Whether a SafeString is needed
   * @returns {[boolean, string]} Tuple of [isSafeStringNeeded, parsedValue]
   */
  parse(value, isSafeStringNeeded = false) {
    const [needsSafe, parsedValue] = this.doParse(value, isSafeStringNeeded);

    if (this.nextParser) {
      return this.nextParser.parse(parsedValue, needsSafe);
    }

    return [needsSafe, parsedValue];
  }

  /**
   * Override this method to implement specific parsing logic
   * @param {string} value - The text value to parse
   * @param {boolean} isSafeStringNeeded - Whether a SafeString is needed
   * @returns {[boolean, string]} Tuple of [isSafeStringNeeded, parsedValue]
   */
  // eslint-disable-next-line no-unused-vars
  doParse(value, isSafeStringNeeded) {
    return /** @type {[boolean, string]} */ ([isSafeStringNeeded, value]);
  }
}

/**
 * Parser for handling plus operations ({+})
 */
export class PlusParser extends TextParser {
  /**
   * @param {string} value - The text value to parse
   * @param {boolean} isSafeStringNeeded - Whether a SafeString is needed
   * @returns {[boolean, string]} Tuple of [isSafeStringNeeded, parsedValue]
   */
  doParse(value, isSafeStringNeeded) {
    // Match patterns with optional spaces around {+}
    let match = value.match(/(\d+)\s*\{\+\}\s*(\d+)|\d+\{\+\}\d+/);
    if (!match) {
      return /** @type {[boolean, string]} */ ([isSafeStringNeeded, value]);
    }

    let parsedValue = value;
    do {
      const numbers = match[0].trim().split("{+}").map(Number);
      const result = numbers[0] + numbers[1];
      parsedValue = parsedValue.replace(match[0], result.toString());
    } while ((match = parsedValue.match(/(\d+)\s*\{\+\}\s*(\d+)|\d+\{\+\}\d+/)));

    return /** @type {[boolean, string]} */ ([isSafeStringNeeded, parsedValue]);
  }
}

/**
 * Parser for handling formatting tags ({i}, {b}, {u}, {s})
 */
export class FormattingParser extends TextParser {
  /**
   * @param {string} value - The text value to parse
   * @param {boolean} isSafeStringNeeded - Whether a SafeString is needed
   * @returns {[boolean, string]} Tuple of [isSafeStringNeeded, parsedValue]
   */
  doParse(value, isSafeStringNeeded) {
    let parsedValue = value;
    let needsSafe = isSafeStringNeeded;

    // Handle italic tags
    if (parsedValue.indexOf("{i}") > -1 || parsedValue.indexOf("{/i}") > -1) {
      needsSafe = true;
      parsedValue = parsedValue.replaceAll("{i}", "<i>").replaceAll("{/i}", "</i>");
    }

    // Handle bold tags
    if (parsedValue.indexOf("{b}") > -1 || parsedValue.indexOf("{/b}") > -1) {
      needsSafe = true;
      parsedValue = parsedValue.replaceAll("{b}", "<b>").replaceAll("{/b}", "</b>");
    }

    // Handle underline tags
    if (parsedValue.indexOf("{u}") > -1 || parsedValue.indexOf("{/u}") > -1) {
      needsSafe = true;
      parsedValue = parsedValue.replaceAll("{u}", "<u>").replaceAll("{/u}", "</u>");
    }

    // Handle space tags
    if (parsedValue.indexOf("{s}") > -1) {
      needsSafe = true;
      parsedValue = parsedValue.replaceAll("{s}", "&nbsp;");
    }

    return /** @type {[boolean, string]} */ ([needsSafe, parsedValue]);
  }
}

/**
 * Parser for handling FontAwesome icons
 */
export class FontAwesomeParser extends TextParser {
  /**
   * @param {string} value - The text value to parse
   * @param {boolean} isSafeStringNeeded - Whether a SafeString is needed
   * @returns {[boolean, string]} Tuple of [isSafeStringNeeded, parsedValue]
   */
  doParse(value, isSafeStringNeeded) {
    // Match {fa-*} patterns for FontAwesome icons
    const faRegex = /\{(fa[^}]*)\}/g;
    let parsedValue = value;
    let needsSafe = isSafeStringNeeded;

    if (faRegex.test(value)) {
      needsSafe = true;
      parsedValue = value.replace(faRegex, '<i class="$1"></i>');
    }

    return /** @type {[boolean, string]} */ ([needsSafe, parsedValue]);
  }
}

/**
 * Parser for handling spacing ({s1}, {s2}, etc.)
 */
export class SpacingParser extends TextParser {
  /**
   * @param {string} value - The text value to parse
   * @param {boolean} isSafeStringNeeded - Whether a SafeString is needed
   * @returns {[boolean, string]} Tuple of [isSafeStringNeeded, parsedValue]
   */
  doParse(value, isSafeStringNeeded) {
    const spacingRegex = /\{s(\d+)\}/g;
    let parsedValue = value;
    let needsSafe = isSafeStringNeeded;

    if (spacingRegex.test(value)) {
      needsSafe = true;
      parsedValue = value.replace(spacingRegex, (match, num) => {
        return "&nbsp;".repeat(parseInt(num, 10));
      });
    }

    return /** @type {[boolean, string]} */ ([needsSafe, parsedValue]);
  }
}

/**
 * Parser for handling newline elements
 */
export class NewlineParser extends TextParser {
  /**
   * @param {string} value - The text value to parse
   * @param {boolean} isSafeStringNeeded - Whether a SafeString is needed
   * @returns {[boolean, string]} Tuple of [isSafeStringNeeded, parsedValue]
   */
  doParse(value, isSafeStringNeeded) {
    let parsedValue = value;
    let needsSafe = isSafeStringNeeded;

    const newlineElements = ["{newline}", "{nl}"];

    for (const element of newlineElements) {
      if (parsedValue.indexOf(element) > -1) {
        needsSafe = true;
        parsedValue = parsedValue.replaceAll(element, "<br>");
      }
    }

    return /** @type {[boolean, string]} */ ([needsSafe, parsedValue]);
  }
}

/**
 * Factory class for creating the complete text parser chain
 */
export class TextParserChain {
  static create() {
    const plusParser = new PlusParser();
    const formattingParser = new FormattingParser();
    const fontAwesomeParser = new FontAwesomeParser();
    const spacingParser = new SpacingParser();
    const newlineParser = new NewlineParser();

    // Chain the parsers together
    plusParser.setNext(formattingParser).setNext(fontAwesomeParser).setNext(spacingParser).setNext(newlineParser);

    return plusParser;
  }

  /**
   * Parse text using the complete parser chain
   * @param {string} value - The text value to parse
   * @param {boolean} isSafeStringNeeded - Whether a SafeString is needed
   * @returns {[boolean, string]} Tuple of [isSafeStringNeeded, parsedValue]
   */
  static parse(value, isSafeStringNeeded = false) {
    const parserChain = TextParserChain.create();
    return parserChain.parse(value, isSafeStringNeeded);
  }
}
