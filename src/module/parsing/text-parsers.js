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
    // Match patterns with optional spaces around {+}, supporting decimals and negatives
    let match = value.match(/(-?\d+(?:\.\d+)?)\s*\{\+\}\s*(-?\d+(?:\.\d+)?)/);
    if (!match) {
      return /** @type {[boolean, string]} */ ([isSafeStringNeeded, value]);
    }

    let parsedValue = value;
    do {
      const num1 = parseFloat(match[1]);
      const num2 = parseFloat(match[2]);
      const result = num1 + num2;
      parsedValue = parsedValue.replace(match[0], result.toString());
    } while ((match = parsedValue.match(/(-?\d+(?:\.\d+)?)\s*\{\+\}\s*(-?\d+(?:\.\d+)?)/)));

    return /** @type {[boolean, string]} */ ([isSafeStringNeeded, parsedValue]);
  }
}

/**
 * Parser for handling minus operations ({-})
 */
export class MinusParser extends TextParser {
  /**
   * @param {string} value - The text value to parse
   * @param {boolean} isSafeStringNeeded - Whether a SafeString is needed
   * @returns {[boolean, string]} Tuple of [isSafeStringNeeded, parsedValue]
   */
  doParse(value, isSafeStringNeeded) {
    // Match patterns with optional spaces around {-}, supporting decimals and negatives
    let match = value.match(/(-?\d+(?:\.\d+)?)\s*\{-\}\s*(-?\d+(?:\.\d+)?)/);
    if (!match) {
      return /** @type {[boolean, string]} */ ([isSafeStringNeeded, value]);
    }

    let parsedValue = value;
    do {
      const num1 = parseFloat(match[1]);
      const num2 = parseFloat(match[2]);
      const result = num1 - num2;
      parsedValue = parsedValue.replace(match[0], result.toString());
    } while ((match = parsedValue.match(/(-?\d+(?:\.\d+)?)\s*\{-\}\s*(-?\d+(?:\.\d+)?)/)));

    return /** @type {[boolean, string]} */ ([isSafeStringNeeded, parsedValue]);
  }
}

/**
 * Parser for handling multiply operations ({*})
 */
export class MultiplyParser extends TextParser {
  /**
   * @param {string} value - The text value to parse
   * @param {boolean} isSafeStringNeeded - Whether a SafeString is needed
   * @returns {[boolean, string]} Tuple of [isSafeStringNeeded, parsedValue]
   */
  doParse(value, isSafeStringNeeded) {
    // Match patterns with optional spaces around {*}, supporting decimals and negatives
    let match = value.match(/(-?\d+(?:\.\d+)?)\s*\{\*\}\s*(-?\d+(?:\.\d+)?)/);
    if (!match) {
      return /** @type {[boolean, string]} */ ([isSafeStringNeeded, value]);
    }

    let parsedValue = value;
    do {
      const num1 = parseFloat(match[1]);
      const num2 = parseFloat(match[2]);
      const result = num1 * num2;
      parsedValue = parsedValue.replace(match[0], result.toString());
    } while ((match = parsedValue.match(/(-?\d+(?:\.\d+)?)\s*\{\*\}\s*(-?\d+(?:\.\d+)?)/)));

    return /** @type {[boolean, string]} */ ([isSafeStringNeeded, parsedValue]);
  }
}

/**
 * Parser for handling divide operations ({/})
 */
export class DivideParser extends TextParser {
  /**
   * @param {string} value - The text value to parse
   * @param {boolean} isSafeStringNeeded - Whether a SafeString is needed
   * @returns {[boolean, string]} Tuple of [isSafeStringNeeded, parsedValue]
   */
  doParse(value, isSafeStringNeeded) {
    // Match patterns with optional spaces around {/}, supporting decimals and negatives
    let match = value.match(/(-?\d+(?:\.\d+)?)\s*\{\/\}\s*(-?\d+(?:\.\d+)?)/);
    if (!match) {
      return /** @type {[boolean, string]} */ ([isSafeStringNeeded, value]);
    }

    let parsedValue = value;
    do {
      const num1 = parseFloat(match[1]);
      const num2 = parseFloat(match[2]);
      // Handle division by zero
      if (num2 === 0) {
        break; // Stop processing if division by zero is encountered
      }
      const result = num1 / num2;
      parsedValue = parsedValue.replace(match[0], result.toString());
    } while ((match = parsedValue.match(/(-?\d+(?:\.\d+)?)\s*\{\/\}\s*(-?\d+(?:\.\d+)?)/)));

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

    const progressRegex = /\{progress\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)(?:\s+([#\w]+))?\}/g;

    if (progressRegex.test(value)) {
      needsSafe = true;
      parsedValue = parsedValue.replace(progressRegex, (match, current, max, color = "#4CAF50") => {
        const currentNum = parseFloat(current);
        const maxNum = parseFloat(max);
        return `<progress value="${currentNum}" max="${maxNum}" style="accent-color: ${color}; width: 100px; height: 16px;">${currentNum}/${maxNum}</progress>`;
      });
    }

    // Handle meter tags with syntax: {meter value minimum maximum [low] [high] [optimum]}
    const meterRegex =
      /\{meter\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)(?:\s+(-?\d+(?:\.\d+)?))?(?:\s+(-?\d+(?:\.\d+)?))?(?:\s+(-?\d+(?:\.\d+)?))?\}/g;

    if (meterRegex.test(value)) {
      needsSafe = true;
      parsedValue = parsedValue.replace(meterRegex, (match, nvalue, minimum, maximum, low, high, optimum) => {
        const valueNum = parseFloat(nvalue);
        const minNum = parseFloat(minimum);
        const maxNum = parseFloat(maximum);

        let meterHtml = `<meter min="${minNum}" max="${maxNum}" value="${valueNum}"`;

        if (low !== undefined) {
          meterHtml += ` low="${parseFloat(low)}"`;
        }

        if (high !== undefined) {
          meterHtml += ` high="${parseFloat(high)}"`;
        }

        if (optimum !== undefined) {
          meterHtml += ` optimum="${parseFloat(optimum)}"`;
        }

        meterHtml += ` style="width: 100px;">${valueNum}</meter>`;

        return meterHtml;
      });
    }

    return /** @type {[boolean, string]} */ ([needsSafe, parsedValue]);
  }
}

/**
 * Parser for handling color tags ({c:COLOR}...{/c})
 */
export class ColorParser extends TextParser {
  /**
   * @param {string} value - The text value to parse
   * @param {boolean} isSafeStringNeeded - Whether a SafeString is needed
   * @returns {[boolean, string]} Tuple of [isSafeStringNeeded, parsedValue]
   */
  doParse(value, isSafeStringNeeded) {
    // Match {c:COLOR}...{/c} patterns
    // Supports named colors (red, blue) and hex codes (#F00, #FF0000)
    const colorRegex = /\{c:([\w#]+)\}(.*?)\{\/c\}/g;
    let parsedValue = value;
    let needsSafe = isSafeStringNeeded;

    if (colorRegex.test(value)) {
      needsSafe = true;
      parsedValue = value.replace(colorRegex, (match, color, text) => {
        return `<span style="color: ${color}">${text}</span>`;
      });
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
    const minusParser = new MinusParser();
    const multiplyParser = new MultiplyParser();
    const divideParser = new DivideParser();
    const formattingParser = new FormattingParser();
    const colorParser = new ColorParser();
    const fontAwesomeParser = new FontAwesomeParser();
    const spacingParser = new SpacingParser();
    const newlineParser = new NewlineParser();

    // Chain the parsers together
    plusParser
      .setNext(minusParser)
      .setNext(multiplyParser)
      .setNext(divideParser)
      .setNext(formattingParser)
      .setNext(colorParser)
      .setNext(fontAwesomeParser)
      .setNext(spacingParser)
      .setNext(newlineParser);

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
