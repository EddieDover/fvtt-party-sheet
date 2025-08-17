import { extractPropertyByString } from "../utils.js";

/**
 * Shared template processing utilities for consistent property replacement
 * across all processors that handle text templates.
 */
export class TemplateProcessor {
  /**
   * Process template with data replacements using dual format support
   * Supports both: " property " (spaces) and "{property}" (braces)
   * @param {string} template - The template string
   * @param {any} data - The data object to extract properties from
   * @returns {string} Processed template string
   */
  static processTemplate(template, data) {
    // Match properties in two formats:
    // 1. Surrounded by spaces: " name " (but not common words)
    // 2. Wrapped in braces: "{name}" (explicit property markers)
    const regValue = /\{(\w+(?:\.\w+)*)\}/g;
    const spaceRegValue = /\s(\w+(?:\.\w+)*)\s/g;
    const allMatches = [];

    // First, find all brace-wrapped properties
    let match;
    while ((match = regValue.exec(template)) !== null) {
      const propertyName = match[1];
      const fullMatch = match[0];
      allMatches.push({ property: propertyName, fullMatch: fullMatch });
    }

    // Then find space-wrapped properties, but only if they exist in the data
    regValue.lastIndex = 0; // Reset regex
    while ((match = spaceRegValue.exec(template)) !== null) {
      const propertyName = match[1];
      const fullMatch = match[0];

      // Only treat as property if it exists in the data or looks like a property path
      if (this.hasProperty(data, propertyName) || propertyName.includes(".")) {
        allMatches.push({ property: propertyName, fullMatch: fullMatch });
      }
    }

    let result = template;
    for (const matchInfo of allMatches) {
      const replacement = extractPropertyByString(data, matchInfo.property);
      if (replacement !== undefined) {
        result = result.replace(matchInfo.fullMatch, replacement);
      }
    }

    return result;
  }

  /**
   * Check if a property exists in the data object
   * @param {any} data - The data object
   * @param {string} propertyPath - The property path to check
   * @returns {boolean} True if property exists
   */
  static hasProperty(data, propertyPath) {
    if (!data || typeof data !== "object") return false;

    const parts = propertyPath.split(".");
    let current = data;

    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        return false;
      }
    }

    return true;
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
   * @param {string} template - The template string
   * @returns {Array<string>} Array of property names found in template
   */
  static extractPropertyNames(template) {
    // Only extract properties that are explicitly marked with braces
    // This avoids false positives with regular text
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
