import { DataProcessor } from "../base-processor.js";
import { extractPropertyByString } from "../../utils.js";
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
          const findPrefixMatches = objName.match(/^(.*)\s/);
          if (findPrefixMatches?.length) {
            objName = objName.replace(findPrefixMatches[1].trim(), "").trim();
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
    let objName = chunk.split("=>")[0].trim();

    // Extract prefix if present
    const findPrefixMatches = objName.match(/^(.*)\s/);
    if (findPrefixMatches?.length) {
      prefix = findPrefixMatches[1].trim();
      objName = objName.replace(prefix, "").trim();
    }

    // Extract filter if present
    let objFilter = null;
    const filterMatches = objName.match(/(?<=.)\{([^}]+)\}(?=$)/);
    if (filterMatches?.length) {
      objFilter = filterMatches[1];
      objName = objName.replace(`{${objFilter}}`, "");
    }

    const actualValue = chunk.split("=>")[1];
    const objData = extractPropertyByString(character, objName);

    if (!objData) {
      return { success: false, output: "", prefix: "" };
    }

    // Convert object data to array format
    let loopData = this.normalizeObjectData(objData);

    // Apply filter if specified
    if (objFilter) {
      loopData = loopData.filter((data) => data.type === objFilter);
    }

    if (loopData.length === 0) {
      return { success: false, output: "", prefix: "" };
    }

    // Process template replacements
    const output = TemplateProcessor.processTemplateWithArray(actualValue, loopData);
    return { success: true, output, prefix };
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
      return Object.keys(objData._source).map((key) => objData._source[key]);
    } else {
      return Object.keys(objData).map((key) => objData[key]);
    }
  }

  /**
   * Create dropdown HTML from keys and strings
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
