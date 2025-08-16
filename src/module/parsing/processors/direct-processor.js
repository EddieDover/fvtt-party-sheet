import { DataProcessor } from "../base-processor.js";
import { extractPropertyByString, addSign } from "../../utils.js";

/**
 * Processor for "direct" data type - handles simple property extraction and replacement
 */
export class DirectProcessor extends DataProcessor {
  constructor(parserEngine) {
    super();
    this.parserEngine = parserEngine;
  }

  /**
   * Process direct data extraction and replacement
   * @param {any} character - The character object to extract data from
   * @param {string} value - The template value configuration
   * @param {object} options - Processing options
   * @returns {any} The processed data
   */
  process(character, value, options = {}) {
    this.validate(character, value);

    let processedValue = this.cleanString(value);
    let isSafeStringNeeded = false;

    // Parse out normal data - extract properties from character
    for (const token of processedValue.split(" ")) {
      const extractedValue = extractPropertyByString(character, token);
      if (extractedValue !== undefined) {
        processedValue = processedValue.replace(token, extractedValue);
      }
    }

    // Handle special character sheet token
    if (processedValue.indexOf("{charactersheet}") > -1) {
      isSafeStringNeeded = true;
      processedValue = processedValue.replaceAll(
        "{charactersheet}",
        `<input type="image" name="fvtt-party-sheet-actorimage" data-actorid="${
          character.uuid
        }" class="token-image" src="${character.prototypeToken.texture.src}" title="${
          character.prototypeToken.name
        }" width="36" height="36" style="transform: rotate(${character.prototypeToken.rotation ?? 0}deg);"/>`,
      );
    }

    // Process options (like adding signs)
    processedValue = this.processOptions(processedValue, options);

    // Apply text parsing chain
    [isSafeStringNeeded, processedValue] = this.parserEngine.parseText(processedValue, isSafeStringNeeded);

    // Return SafeString if HTML content was added
    if (isSafeStringNeeded) {
      // Check if Handlebars is available (it won't be in test environment)
      // eslint-disable-next-line no-undef
      if (typeof Handlebars !== "undefined") {
        // @ts-ignore
        // eslint-disable-next-line no-undef
        return new Handlebars.SafeString(processedValue);
      } else {
        // In test environment, return an object that mimics SafeString
        return {
          toString: () => processedValue,
          string: processedValue,
        };
      }
    }

    return processedValue;
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
    // Remove potential script tags and other dangerous HTML
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
