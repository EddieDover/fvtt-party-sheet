import { extractPropertyByString } from "../utils.js";

/**
 * Shared template processing utilities for consistent property replacement
 * across all processors that handle text templates.
 */
export class TemplateProcessor {
  /**
   * Process template with data replacements using brace notation
   * Only supports: "{property}" (braces) format for property references
   * @param {string} template - The template string
   * @param {any} data - The data object to extract properties from
   * @returns {string} Processed template string
   */
  static processTemplate(template, data) {
    // Match properties wrapped in braces: "{property.path}"
    const regValue = /\{(\w+(?:\.\w+)*)\}/g;
    const allMatches = [];

    // Find all brace-wrapped properties
    let match;
    while ((match = regValue.exec(template)) !== null) {
      const propertyName = match[1];
      const fullMatch = match[0];
      allMatches.push({ property: propertyName, fullMatch: fullMatch });
    }

    let result = template;
    for (const matchInfo of allMatches) {
      let replacement = extractPropertyByString(data, matchInfo.property);

      // Convert null values to 0
      if (replacement === null) {
        replacement = 0;
      }

      if (replacement !== undefined) {
        result = result.replace(matchInfo.fullMatch, replacement);
      }
    }

    return result;
  }

  /**
   * Process template with array data - loops through each item
   * @param {string} template - The template string
   * @param {Array} dataArray - Array of data objects
   * @returns {string} Concatenated processed template strings
   */
  static processTemplateWithArray(template, dataArray) {
    let output = "";
    for (const dataItem of dataArray) {
      output += this.processTemplate(template, dataItem);
    }
    return output;
  }

  /**
   * Extract all property names from a template string
   * Only extracts properties wrapped in braces to avoid false positives
   * @param {string} template - The template string
   * @returns {Array<string>} Array of property names found in template
   */
  static extractPropertyNames(template) {
    // Only extract properties that are explicitly marked with braces
    const regValue = /\{(\w+(?:\.\w+)*)\}/g;
    const propertyNames = [];

    let match;
    while ((match = regValue.exec(template)) !== null) {
      const propertyName = match[1];
      propertyNames.push(propertyName);
    }

    return propertyNames;
  }
}
