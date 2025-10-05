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
   * @param {string} skipProperty - Optional property to skip (for nested loops)
   * @param {boolean} skipArrays - Whether to skip array values (for nested loops)
   * @returns {string} Processed template string
   */
  static processTemplate(template, data, skipProperty = null, skipArrays = false) {
    // Match properties wrapped in braces: "{property.path}"
    const regValue = /\{(\w+(?:\.\w+)*)\}/g;
    const allMatches = [];

    // Find all brace-wrapped properties
    let match;
    while ((match = regValue.exec(template)) !== null) {
      const propertyName = match[1];
      const fullMatch = match[0];

      // Skip properties that should be skipped (for nested loops)
      if (skipProperty && propertyName === skipProperty) {
        continue;
      }

      allMatches.push({ property: propertyName, fullMatch: fullMatch });
    }

    let result = template;

    // Remove skipped property placeholders
    if (skipProperty) {
      result = result.replace(new RegExp(`\\{${skipProperty.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\}`, "g"), "");
    }

    for (const matchInfo of allMatches) {
      let replacement = extractPropertyByString(data, matchInfo.property);

      // Convert null values to 0
      if (replacement === null) {
        replacement = 0;
      }

      // Skip arrays if requested (for nested loops)
      // Remove their placeholders and any trailing whitespace
      if (skipArrays && Array.isArray(replacement)) {
        // Replace the placeholder and any immediately following whitespace
        const placeholderWithSpace = new RegExp(matchInfo.fullMatch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*");
        result = result.replace(placeholderWithSpace, "");
        continue;
      }

      if (replacement !== undefined) {
        result = result.replace(matchInfo.fullMatch, replacement);
      }
    }

    return result;
  }

  /**
   * Process template with array data - loops through each item
   * Supports nested loops with => separator
   * @param {string} template - The template string (may contain nested => loops)
   * @param {Array} dataArray - Array of data objects
   * @returns {string} Concatenated processed template strings
   */
  static processTemplateWithArray(template, dataArray) {
    let output = "";
    for (const dataItem of dataArray) {
      output += this.processTemplateRecursive(template, dataItem);
    }
    return output;
  }

  /**
   * Process template recursively, handling nested loops
   * Syntax: {property} => {nestedProperty}
   * @param {string} template - The template string
   * @param {any} data - The data object
   * @returns {string} Processed template
   */
  static processTemplateRecursive(template, data) {
    // Check if template contains nested loop syntax (=> separator)
    // Preserve all spacing after => for inner template
    const nestedLoopMatch = template.match(/^(.+?)\s*=>(.+)$/);

    if (!nestedLoopMatch) {
      // No nested loop, process normally (not skipping arrays since no nesting)
      return this.processTemplate(template, data, null, false);
    }

    const [, outerTemplate, innerTemplate] = nestedLoopMatch;

    // Find array property before processing the template
    const arrayProperty = this.findArrayPropertyInTemplate(outerTemplate, data);

    if (arrayProperty) {
      const arrayData = extractPropertyByString(data, arrayProperty);

      // If it's an array, we need to handle it specially
      if (Array.isArray(arrayData)) {
        if (arrayData.length === 0) {
          // Empty array - just process outer template without the array property
          return this.processTemplateWithoutProperty(outerTemplate, data, arrayProperty);
        }

        // Process outer template without showing the array itself
        const processedOuter = this.processTemplateWithoutProperty(outerTemplate, data, arrayProperty);

        // Trim inner template's leading space ONLY for first iteration if outer ends with whitespace
        // This prevents double spaces at the junction while preserving separators between items
        const shouldTrimFirst = processedOuter.match(/\s$/) && innerTemplate.match(/^\s/);

        // Loop through array items with the inner template
        let nestedOutput = "";
        for (let i = 0; i < arrayData.length; i++) {
          const nestedItem = arrayData[i];
          const templateToUse = shouldTrimFirst && i === 0 ? innerTemplate.trimStart() : innerTemplate;
          // Recursively process in case there are more nested levels
          nestedOutput += this.processTemplateRecursive(templateToUse, nestedItem);
        }
        return processedOuter + nestedOutput;
      }
    }

    // No array found, just process as normal template
    return this.processTemplate(template, data);
  }

  /**
   * Process template but skip a specific property (used for nested loops)
   * @param {string} template - The template string
   * @param {any} data - The data object
   * @param {string} skipProperty - Property to skip during processing
   * @returns {string} Processed template
   */
  static processTemplateWithoutProperty(template, data, skipProperty) {
    // Use processTemplate with skipProperty and skipArrays enabled for nested loops
    return this.processTemplate(template, data, skipProperty, true);
  }

  /**
   * Find an array property referenced in a template
   * @param {string} template - The template string
   * @param {any} data - The data object
   * @returns {string|null} The property name if an array is found, null otherwise
   */
  static findArrayPropertyInTemplate(template, data) {
    const propertyNames = this.extractPropertyNames(template);

    // Check each property to see if it's an array
    for (const propName of propertyNames) {
      const value = extractPropertyByString(data, propName);
      if (Array.isArray(value)) {
        return propName;
      }
    }

    return null;
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
