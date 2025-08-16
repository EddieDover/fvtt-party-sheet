import { DataProcessor } from "../base-processor.js";
import { extractPropertyByString, trimIfString, addSign } from "../../utils.js";

/**
 * Processor for "direct-complex" data type - handles conditional data extraction
 */
export class DirectComplexProcessor extends DataProcessor {
  constructor(parserEngine) {
    super();
    this.parserEngine = parserEngine;
  }

  /**
   * Process direct-complex data with conditional logic
   * @param {any} character - The character object to extract data from
   * @param {Array} value - Array of conditional configuration objects
   * @param {object} options - Processing options
   * @returns {any} The processed data
   */
  process(character, value, options = {}) {
    this.validate(character, value);

    if (!Array.isArray(value)) {
      throw new Error("DirectComplex processor requires an array of configuration objects");
    }

    let outputText = "";

    for (const item of value) {
      const trimmedItem = trimIfString(item);
      outputText += this.processConditionalItem(character, trimmedItem);
    }

    // Use the direct processor logic for final processing
    let isSafeStringNeeded = false;
    [isSafeStringNeeded, outputText] = this.processDirectText(character, outputText, options);

    // @ts-ignore
    return isSafeStringNeeded ? new Handlebars.SafeString(outputText) : outputText;
  }

  /**
   * Process a single conditional item
   * @param {any} character - The character object
   * @param {object} item - The conditional item configuration
   * @returns {string} The processed text for this item
   */
  processConditionalItem(character, item) {
    switch (item.type) {
      case "exists":
        return this.processExistsCondition(character, item);
      case "match":
        return this.processMatchCondition(character, item);
      case "match-any":
        return this.processMatchAnyCondition(character, item);
      default:
        console.warn(`Unknown conditional type: ${item.type}`);
        return "";
    }
  }

  /**
   * Process "exists" conditional logic
   * @param {any} character - The character object
   * @param {object} item - The conditional item
   * @returns {string} The resulting text
   */
  processExistsCondition(character, item) {
    const extractedValue = extractPropertyByString(character, item.value);

    if (extractedValue) {
      return item.text.replaceAll(item.value, extractedValue);
    } else if (item.else) {
      const elseValue = extractPropertyByString(character, item.else);
      return elseValue || item.else;
    }

    return "";
  }

  /**
   * Process "match" conditional logic
   * @param {any} character - The character object
   * @param {object} item - The conditional item
   * @returns {string} The resulting text
   */
  processMatchCondition(character, item) {
    const actualValue = extractPropertyByString(character, item.ifdata);
    const expectedValue = extractPropertyByString(character, item.matches) ?? item.matches;

    if (actualValue === expectedValue) {
      return extractPropertyByString(character, item.text) ?? item.text;
    } else if (item.else) {
      const elseValue = extractPropertyByString(character, item.else);
      return elseValue || item.else;
    }

    return "";
  }

  /**
   * Process "match-any" conditional logic
   * @param {any} character - The character object
   * @param {object} item - The conditional item
   * @returns {string} The resulting text
   */
  processMatchAnyCondition(character, item) {
    const testValues = (Array.isArray(item.text) ? item.text : [item.text]).map((val) =>
      extractPropertyByString(character, val),
    );
    const matchValue = extractPropertyByString(character, item.match) ?? item.match;

    for (const testValue of testValues) {
      if (testValue === matchValue) {
        return extractPropertyByString(character, item.text) ?? item.text;
      }
    }

    if (item.else) {
      const elseValue = extractPropertyByString(character, item.else);
      return elseValue || item.else;
    }

    return "";
  }

  /**
   * Process the final text using direct processing logic
   * @param {any} character - The character object
   * @param {string} outputText - The text to process
   * @param {object} options - Processing options
   * @returns {[boolean, string]} Tuple of [isSafeStringNeeded, processedText]
   */
  processDirectText(character, outputText, options) {
    let processedText = this.cleanString(outputText);
    let isSafeStringNeeded = false;

    // Parse out normal data - extract properties from character
    for (const token of processedText.split(" ")) {
      const extractedValue = extractPropertyByString(character, token);
      if (extractedValue !== undefined) {
        processedText = processedText.replace(token, extractedValue);
      }
    }

    // Handle special character sheet token
    if (processedText.indexOf("{charactersheet}") > -1) {
      isSafeStringNeeded = true;
      processedText = processedText.replaceAll(
        "{charactersheet}",
        `<input type="image" name="fvtt-party-sheet-actorimage" data-actorid="${
          character.uuid
        }" class="token-image" src="${character.prototypeToken.texture.src}" title="${
          character.prototypeToken.name
        }" width="36" height="36" style="transform: rotate(${character.prototypeToken.rotation ?? 0}deg);"/>`,
      );
    }

    // Process options
    processedText = this.processOptions(processedText, options);

    // Apply text parsing chain
    return this.parserEngine.parseText(processedText, isSafeStringNeeded);
  }

  /**
   * Clean a string of html injection
   * @param {string} value - The value to clean
   * @returns {string} The cleaned value
   */
  cleanString(value) {
    if (typeof value !== "string") {
      return value;
    }
    return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  }

  /**
   * Process options for a value
   * @param {any} value - The value to process
   * @param {object} options - The options for the value
   * @returns {any} The processed value
   */
  processOptions(value, options) {
    if (options.showSign) {
      value = addSign(value);
    }
    return value;
  }
}
