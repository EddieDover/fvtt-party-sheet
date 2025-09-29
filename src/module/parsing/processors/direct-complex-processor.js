import { DataProcessor } from "../base-processor.js";
import {
  extractPropertyByString,
  trimIfString,
  addSign,
  generateCharacterSheetImageFromCharacter,
} from "../../utils.js";
import { TemplateProcessor } from "../template-processor.js";
import { sanitizeHTMLWithStyles } from "../../utils/dompurify-sanitizer.js";

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
      // Use TemplateProcessor to handle property replacement in the text
      return TemplateProcessor.processTemplate(item.text, character);
    } else if (item.else) {
      const elseValue = extractPropertyByString(character, item.else);
      return elseValue || TemplateProcessor.processTemplate(item.else, character);
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

    // Convert both values to strings for comparison to handle number/string mismatches
    if (String(actualValue) === String(expectedValue)) {
      return TemplateProcessor.processTemplate(item.text, character);
    } else if (item.else) {
      const elseValue = extractPropertyByString(character, item.else);
      return elseValue || TemplateProcessor.processTemplate(item.else, character);
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
        return TemplateProcessor.processTemplate(item.text, character);
      }
    }

    if (item.else) {
      const elseValue = extractPropertyByString(character, item.else);
      return elseValue || TemplateProcessor.processTemplate(item.else, character);
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

    // Use TemplateProcessor to handle property replacement with brace notation
    processedText = TemplateProcessor.processTemplate(processedText, character);

    // Handle special character sheet token
    if (processedText.indexOf("{charactersheet}") > -1) {
      isSafeStringNeeded = true;
      processedText = processedText.replaceAll("{charactersheet}", generateCharacterSheetImageFromCharacter(character));
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

    // Use DOMPurify with allowed styles
    return sanitizeHTMLWithStyles(value, ["color", "background-color", "font-weight", "font-style", "text-decoration"]);
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
