import { DataProcessor } from "../base-processor.js";

/**
 * Processor for "span" data type - returns empty string for spanned cells
 * This is used as placeholder for cells that are spanned over by rowspan
 */
export class SpanProcessor extends DataProcessor {
  /**
   * Process span type - always returns empty string
   * @param {any} character - The character object (unused)
   * @param {string} value - The template value configuration (unused)
   * @param {object} options - Processing options (unused)
   * @returns {string} Empty string
   */
  // eslint-disable-next-line no-unused-vars
  process(character, value, options = {}) {
    // Span cells are placeholders for rowspan functionality
    // They should not display any content
    return "";
  }
}
