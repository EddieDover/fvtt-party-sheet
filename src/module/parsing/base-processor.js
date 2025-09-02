/**
 * Base class for data processors using the Strategy pattern
 */
export class DataProcessor {
  /**
   * Process character data based on the specific strategy implementation
   * @param {any} character - The character object to extract data from
   * @param {any} value - The template value configuration
   * @param {object} options - Processing options
   * @returns {any} The processed data
   */
  // eslint-disable-next-line no-unused-vars
  process(character, value, options = {}) {
    throw new Error("Process method must be implemented by subclass");
  }

  /**
   * Validate the input parameters
   * @param {any} character - The character object
   * @param {any} value - The value to process
   * @throws {Error} If validation fails
   */
  validate(character, value) {
    if (!character) {
      throw new Error("Character parameter is required");
    }
    if (value === undefined || value === null) {
      throw new Error("Value parameter is required");
    }
  }
}
