import { DataProcessor } from "./base-processor.js";
import { TextParserChain } from "./text-parsers.js";

/**
 * Main parser engine that coordinates data processors and text parsing
 */
export class ParserEngine {
  constructor() {
    /** @type {Map<string, DataProcessor>} */
    this.processors = new Map();
    this.textParser = TextParserChain;
  }

  /**
   * Register a data processor for a specific type
   * @param {string} type - The data type to handle
   * @param {DataProcessor} processor - The processor instance
   */
  registerProcessor(type, processor) {
    if (!(processor instanceof DataProcessor)) {
      throw new Error("Processor must extend DataProcessor class");
    }
    this.processors.set(type, processor);
  }

  /**
   * Process character data based on type and configuration
   * @param {any} character - The character object to extract data from
   * @param {string} type - The data type to process
   * @param {any} value - The template value configuration
   * @param {object} options - Processing options
   * @returns {any} The processed data
   */
  process(character, type, value, options = {}) {
    const processor = this.processors.get(type);
    if (!processor) {
      throw new Error(`No processor registered for type: ${type}`);
    }

    try {
      processor.validate(character, value);
      return processor.process(character, value, options);
    } catch (error) {
      console.error(`Error processing type "${type}":`, error);
      throw error;
    }
  }

  /**
   * Parse text using the text parser chain
   * @param {string} value - The text value to parse
   * @param {boolean} isSafeStringNeeded - Whether a SafeString is needed
   * @returns {[boolean, string]} Tuple of [isSafeStringNeeded, parsedValue]
   */
  parseText(value, isSafeStringNeeded = false) {
    return this.textParser.parse(value, isSafeStringNeeded);
  }

  /**
   * Get all registered processor types
   * @returns {string[]} Array of registered types
   */
  getRegisteredTypes() {
    return Array.from(this.processors.keys());
  }

  /**
   * Check if a processor is registered for a given type
   * @param {string} type - The type to check
   * @returns {boolean} True if processor is registered
   */
  hasProcessor(type) {
    return this.processors.has(type);
  }

  /**
   * Clear all registered processors
   */
  clearProcessors() {
    this.processors.clear();
  }
}
