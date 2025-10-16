import { DataProcessor } from "../base-processor.js";
import { extractPropertyByString } from "../../utils.js";
import { sanitizeHTMLWithStyles } from "../../utils/dompurify-sanitizer.js";
import { TemplateProcessor } from "../template-processor.js";

/**
 * Processor for "array-string-builder" data type - builds strings from arrays
 */
export class ArrayStringBuilderProcessor extends DataProcessor {
  constructor(parserEngine) {
    super();
    this.parserEngine = parserEngine;
  }

  /**
   * Process array string building
   * @param {any} character - The character object to extract data from
   * @param {string} value - The template value configuration
   * @param {object} options - Processing options
   * @returns {any} The processed data
   */
  // eslint-disable-next-line no-unused-vars
  process(character, value, options = {}) {
    this.validate(character, value);

    const objName = value.split("=>")[0].trim();
    const outStrTemplate = value.split("=>")[1];
    let finalStr = "";

    let objData = this.extractDataWithFiltering(character, objName);

    // Handle null/undefined data
    if (objData == null) {
      return "";
    }

    // Convert non-arrays to arrays
    if (!Array.isArray(objData) && !(objData instanceof Set)) {
      // Check if it's an object with keys
      if (typeof objData === "object" && objData !== null) {
        const keys = Object.keys(objData);
        if (keys.length === 0) {
          return "";
        }
        objData = keys.map((key) => objData[key]);
      } else {
        // If it's a primitive or something else, wrap it in an array
        objData = [objData];
      }
    }

    // Check if the resulting data is empty
    if ((objData.size ?? objData.length) === 0) {
      return "";
    }

    // Use TemplateProcessor for consistent {property} syntax
    try {
      // Handle special {value} case
      if (outStrTemplate.includes("{value}")) {
        let processedTemplate = "";
        for (const objSubData of objData) {
          let itemTemplate = outStrTemplate.replace(/\{value\}/g, objSubData);
          processedTemplate += TemplateProcessor.processTemplate(itemTemplate, objSubData);
        }
        finalStr = processedTemplate;
      } else {
        // Standard {property} processing
        finalStr = TemplateProcessor.processTemplateWithArray(outStrTemplate, objData);
      }
    } catch (error) {
      console.warn("Array-string-builder processor failed to process template:", error);
      return "";
    }

    finalStr = finalStr.trim();
    finalStr = this.cleanString(finalStr);
    finalStr = this.removeTrailingComma(finalStr);
    finalStr = finalStr === value ? "" : finalStr;

    const [isSafeStringNeeded, outputText] = this.parserEngine.parseText(finalStr);

    // @ts-ignore
    return isSafeStringNeeded ? new Handlebars.SafeString(outputText) : outputText;
  }

  /**
   * Extract data with support for items{filter} syntax
   * @param {any} character - The character object
   * @param {string} objName - The object path, potentially with filter syntax
   * @returns {any} The extracted data
   */
  extractDataWithFiltering(character, objName) {
    // Check if this uses the items{filter} syntax
    const filterMatch = objName.match(/^items\{([^}]+)\}\.(.+)$/);

    if (filterMatch) {
      // Handle items{filter}.property syntax
      const [, filterType, propertyPath] = filterMatch;

      const items = extractPropertyByString(character, "items");

      if (!items) {
        return null;
      }

      // Normalize items to array format (similar to object-loop processor)
      let itemsArray;
      const itemKeys = Object.keys(items);

      // Handle special FoundryVTT document structure
      if (itemKeys.length === 6 && itemKeys.includes("documentClass") && itemKeys.includes("_source")) {
        itemsArray = Object.keys(items._source).map((key) => items._source[key]);
      } else {
        itemsArray = Object.keys(items).map((key) => items[key]);
      }

      // Filter items by type
      const filteredItems = itemsArray.filter((item) => item.type === filterType);

      if (filteredItems.length === 0) {
        return null;
      }

      // Extract the property from the first matching item
      const targetItem = filteredItems[0];
      const result = extractPropertyByString(targetItem, propertyPath);
      return result;
    }

    // Fallback to regular property extraction
    return extractPropertyByString(character, objName);
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
   * Remove trailing comma from a string
   * @param {string} str - The string to process
   * @returns {string} The string without trailing comma
   */
  removeTrailingComma(str) {
    return str.replace(/,\s*$/, "");
  }
}
