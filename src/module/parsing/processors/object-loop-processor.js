import { DataProcessor } from "../base-processor.js";
import { extractPropertyByString, toProperCase } from "../../utils.js";
import { TemplateProcessor } from "../template-processor.js";

/**
 * Processor for "object-loop" data type - loops through object data with complex templating
 */
export class ObjectLoopProcessor extends DataProcessor {
  constructor(parserEngine) {
    super();
    this.parserEngine = parserEngine;
    this.generated_dropdowns_count = 0;
  }

  /**
   * Reset dropdown counter for a new render cycle
   * @memberof ObjectLoopProcessor
   */
  resetDropdownCounter() {
    this.generated_dropdowns_count = 0;
  }

  /**
   * Process object loop with complex dropdown and filtering logic
   * @param {any} character - The character object to extract data from
   * @param {string} value - The template value configuration
   * @param {object} options - Processing options
   * @returns {any} The processed data
   */
  // eslint-disable-next-line no-unused-vars
  process(character, value, options = {}) {
    this.validate(character, value);

    const isDropdown = value.trim().startsWith("{dropdown} ");
    const dropdownKeys = [];

    let processValue = value;
    if (isDropdown) {
      processValue = processValue.replace("{dropdown} ", "");
      this.generated_dropdowns_count += 1;
    }

    const chunks = processValue.split("||").map((chunk) => chunk.trim());
    const finStrs = [];
    let validDropdownSections = 0;

    for (const chunk of chunks) {
      const result = this.processChunk(character, chunk, false, []); // Don't populate dropdownKeys in processChunk
      if (result.success) {
        validDropdownSections += 1;
        if (result.output) {
          finStrs.push(result.prefix + result.output);
        }

        // Only add to dropdownKeys for successful chunks
        if (isDropdown) {
          // Extract filter for successful chunks only
          let objName = chunk.split("=>")[0].trim();
          const findPrefixMatches = objName.match(/^(\[[^\]]+\])\s+/);
          if (findPrefixMatches?.length) {
            objName = objName.replace(findPrefixMatches[0], "").trim();
          }

          let objFilter = null;
          const filterMatches = objName.match(/(?<=.)\{([^}]+)\}(?=$)/);
          if (filterMatches?.length) {
            objFilter = filterMatches[1];
            objName = objName.replace(`{${objFilter}}`, "");
          }

          dropdownKeys.push(objFilter || objName);
        }
      }
    }

    let outputText = "";
    let isSafeStringNeeded = false;

    if (isDropdown && dropdownKeys.length === validDropdownSections && validDropdownSections > 1) {
      isSafeStringNeeded = true;
      outputText = this.createDropdown(this.generated_dropdowns_count, dropdownKeys, finStrs);
    } else {
      outputText = finStrs.join("");
    }

    [isSafeStringNeeded, outputText] = this.parserEngine.parseText(outputText, isSafeStringNeeded);

    // @ts-ignore
    return isSafeStringNeeded ? new Handlebars.SafeString(outputText) : outputText;
  }

  /**
   * Process a single chunk of the object loop
   * @param {any} character - The character object
   * @param {string} chunk - The chunk to process
   * @param {boolean} isDropdown - Whether this is a dropdown
   * @param {Array} dropdownKeys - Array to collect dropdown keys
   * @returns {object} Processing result with success flag and output
   */
  processChunk(character, chunk, isDropdown, dropdownKeys) {
    let prefix = "";

    // Split only on the FIRST => to separate object name from template
    const firstArrowIndex = chunk.indexOf("=>");
    if (firstArrowIndex === -1) {
      return { success: false, output: "", prefix: "" };
    }

    let objName = chunk.substring(0, firstArrowIndex).trim();

    // Extract prefix if present (must be in brackets like [Prefix])
    const findPrefixMatches = objName.match(/^\[([^\]]+)\]\s+/);
    if (findPrefixMatches?.length) {
      prefix = findPrefixMatches[1].trim();
      objName = objName.replace(findPrefixMatches[0], "").trim();
    }

    // Extract filter if present
    let objFilter = null;
    const filterMatches = objName.match(/(?<=.)\{([^}]+)\}(?=$)/);
    if (filterMatches?.length) {
      objFilter = filterMatches[1];
      objName = objName.replace(`{${objFilter}}`, "");
    }

    // Get everything after the first => (including any subsequent => for nested loops)
    const actualValue = chunk.substring(firstArrowIndex + 2);
    const objData = extractPropertyByString(character, objName);

    if (!objData) {
      return { success: false, output: "", prefix: "" };
    }

    // Convert object data to array format
    let loopData = this.normalizeObjectData(objData);

    // Apply filter if specified
    if (objFilter) {
      loopData = loopData.filter((data) => this.evaluateFilter(data, objFilter));
    }

    if (loopData.length === 0) {
      return { success: false, output: "", prefix: "" };
    }

    // Process template replacements
    const output = TemplateProcessor.processTemplateWithArray(actualValue, loopData);
    return { success: true, output, prefix };
  }

  /**
   * Evaluate a filter expression against data object
   * @param {any} data - The data object to evaluate
   * @param {string} filterExpression - The filter expression (e.g., "rollLabel contains 'Save'")
   * @returns {boolean} True if the filter passes
   */
  evaluateFilter(data, filterExpression) {
    // Parse the filter expression
    // Supported operators: contains, !contains, startsWith, endsWith, ==, !=, >, <, >=, <=

    // Try string matching operators first (they have spaces)
    const containsMatch = filterExpression.match(/^(.+?)\s+contains\s+['"](.+)['"]$/);
    if (containsMatch) {
      const [, property, value] = containsMatch;
      const propValue = this.getPropertyValue(data, property.trim());
      return propValue != null && String(propValue).includes(value);
    }

    const notContainsMatch = filterExpression.match(/^(.+?)\s+!contains\s+['"](.+)['"]$/);
    if (notContainsMatch) {
      const [, property, value] = notContainsMatch;
      const propValue = this.getPropertyValue(data, property.trim());
      return propValue == null || !String(propValue).includes(value);
    }

    const startsWithMatch = filterExpression.match(/^(.+?)\s+startsWith\s+['"](.+)['"]$/);
    if (startsWithMatch) {
      const [, property, value] = startsWithMatch;
      const propValue = this.getPropertyValue(data, property.trim());
      return propValue != null && String(propValue).startsWith(value);
    }

    const endsWithMatch = filterExpression.match(/^(.+?)\s+endsWith\s+['"](.+)['"]$/);
    if (endsWithMatch) {
      const [, property, value] = endsWithMatch;
      const propValue = this.getPropertyValue(data, property.trim());
      return propValue != null && String(propValue).endsWith(value);
    }

    // Try comparison operators
    const comparisonMatch = filterExpression.match(/^(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
    if (comparisonMatch) {
      const [, property, operator, value] = comparisonMatch;
      const propValue = this.getPropertyValue(data, property.trim());
      const compareValue = this.parseValue(value.trim());

      switch (operator) {
        case "==":
          return propValue == compareValue;
        case "!=":
          return propValue != compareValue;
        case ">":
          return Number(propValue) > Number(compareValue);
        case "<":
          return Number(propValue) < Number(compareValue);
        case ">=":
          return Number(propValue) >= Number(compareValue);
        case "<=":
          return Number(propValue) <= Number(compareValue);
        default:
          return false;
      }
    }

    // Fallback to legacy simple equality filter for backwards compatibility
    // This handles filters like {weapon} where it checks data.type === 'weapon'
    return data.type === filterExpression;
  }

  /**
   * Get a property value from an object using dot notation or direct access
   * @param {any} obj - The object to extract from
   * @param {string} property - The property path (e.g., "rollLabel" or "system.level")
   * @returns {any} The property value
   */
  getPropertyValue(obj, property) {
    if (property.includes(".")) {
      return extractPropertyByString(obj, property);
    }
    return obj[property];
  }

  /**
   * Parse a value string to its appropriate type
   * @param {string} value - The value to parse
   * @returns {any} The parsed value
   */
  parseValue(value) {
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    // Try to parse as number
    const num = Number(value);
    if (!isNaN(num)) {
      return num;
    }

    // Try to parse as boolean
    if (value === "true") return true;
    if (value === "false") return false;

    // Return as string
    return value;
  }

  /**
   * Normalize object data to array format
   * @param {any} objData - The object data to normalize
   * @returns {Array} Normalized array data
   */
  normalizeObjectData(objData) {
    const objKeys = Object.keys(objData);

    // Handle special FoundryVTT document structure
    if (objKeys.length === 6 && objKeys.includes("documentClass") && objKeys.includes("_source")) {
      return Object.keys(objData._source).map((key) => ({ ...objData._source[key], objectLoopKey: toProperCase(key) }));
    } else {
      return Object.keys(objData).map((key) => ({ ...objData[key], objectLoopKey: toProperCase(key) }));
    }
  }

  /**
   * Create dropdown HTML from keys and strings
   * @param {number} dropdownIndex - The index of the dropdown
   * @param {Array} dropdownKeys - The dropdown keys
   * @param {Array} finStrs - The processed strings
   * @returns {string} Dropdown HTML
   */
  createDropdown(dropdownIndex, dropdownKeys, finStrs) {
    // Create a more stable identifier based on content
    const contentHash = dropdownKeys
      .join("-")
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 20);
    const stableId = `dropdown-${dropdownIndex}-${contentHash}`;

    const dropdownId = `party-sheet-dropdown-${dropdownIndex}`;
    const dropdownSection = stableId;

    // Check if there's a saved state for this dropdown to avoid flicker
    let savedValue = null;
    if (this.parserEngine && this.parserEngine.getSavedDropdownState) {
      savedValue = this.parserEngine.getSavedDropdownState(dropdownSection);
    }

    let options = "";
    let contentDivs = "";

    for (let i = 0; i < dropdownKeys.length; i++) {
      const key = dropdownKeys[i];

      // Mark the option as selected if it matches the saved state
      const selected = (savedValue && key === savedValue) || (!savedValue && i === 0) ? ' selected="selected"' : "";
      options += `<option value="${key}"${selected}>${key}</option>`;

      // Use saved state if available, otherwise default to first option
      let isVisible = "none";
      if (savedValue && key === savedValue) {
        isVisible = "block";
      } else if (!savedValue && i === 0) {
        isVisible = "block";
      }

      contentDivs += `<div data-dropdownsection="${dropdownSection}" data-dropdownoption="${key}" style="display: ${isVisible};">${finStrs[i] || ""}</div>`;
    }

    return `<select id="${dropdownId}" class="fvtt-party-sheet-dropdown" data-dropdownsection="${dropdownSection}">${options}</select>${contentDivs}`;
  }
}
