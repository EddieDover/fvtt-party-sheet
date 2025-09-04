import { DataProcessor } from "../base-processor.js";

/**
 * Processor for "string" data type - returns the value as-is
 */
export class StringProcessor extends DataProcessor {
  /**
   * Process string data (simply returns the value)
   * @param {any} character - The character object (unused)
   * @param {string} value - The template value configuration
   * @param {object} options - Processing options (unused)
   * @returns {string} The original value
   */
  // eslint-disable-next-line no-unused-vars
  process(character, value, options = {}) {
    return value;
  }
}
