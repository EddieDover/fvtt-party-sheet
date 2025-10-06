import { DataProcessor } from "../base-processor.js";
import { extractPropertyByString } from "../../utils.js";

/**
 * Processor for "largest-from-array" data type
 */
export class LargestFromArrayProcessor extends DataProcessor {
  /**
   * Process largest from array logic
   * @param {any} character - The character object to extract data from
   * @param {string} value - The template value configuration
   * @param {object} options - Processing options
   * @returns {any} The largest value from the array
   */
  // eslint-disable-next-line no-unused-vars
  process(character, value, options = {}) {
    this.validate(character, value);

    const objData = extractPropertyByString(character, value);

    if (!Array.isArray(objData)) {
      console.warn("LargestFromArray requires an array, got:", typeof objData);
      return "";
    }

    if (objData.length === 0) {
      return "";
    }

    // Find the largest numeric value
    const numericValues = objData
      .map((item) => {
        const num = Number(item);
        return isNaN(num) ? -Infinity : num;
      })
      .filter((num) => num !== -Infinity);

    if (numericValues.length === 0) {
      return "";
    }

    return Math.max(...numericValues);
  }
}

/**
 * Processor for "smallest-from-array" data type
 */
export class SmallestFromArrayProcessor extends DataProcessor {
  /**
   * Process smallest from array logic
   * @param {any} character - The character object to extract data from
   * @param {string} value - The template value configuration
   * @param {object} options - Processing options
   * @returns {any} The smallest value from the array
   */
  // eslint-disable-next-line no-unused-vars
  process(character, value, options = {}) {
    this.validate(character, value);

    const objData = extractPropertyByString(character, value);

    if (!Array.isArray(objData)) {
      console.warn("SmallestFromArray requires an array, got:", typeof objData);
      return "";
    }

    if (objData.length === 0) {
      return "";
    }

    // Find the smallest numeric value
    const numericValues = objData
      .map((item) => {
        const num = Number(item);
        return isNaN(num) ? Infinity : num;
      })
      .filter((num) => num !== Infinity);

    if (numericValues.length === 0) {
      return "";
    }

    return Math.min(...numericValues);
  }
}
