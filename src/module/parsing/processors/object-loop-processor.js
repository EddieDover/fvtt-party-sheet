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
      // Increment global dropdown counter (maintaining original behavior)
      // eslint-disable-next-line no-undef
      if (typeof generated_dropdowns !== "undefined") {
        // eslint-disable-next-line no-undef, no-global-assign
        generated_dropdowns += 1;
      }
    }

    const chunks = processValue.split("||").map((chunk) => chunk.trim());
    const finStrs = [];
    let validDropdownSections = 0;

    for (const chunk of chunks) {
      const result = this.processChunk(character, chunk, isDropdown, dropdownKeys);
      if (result.success) {
        validDropdownSections += 1;
        if (result.output) {
          finStrs.push(result.prefix + result.output);
        }
      }
    }

    let outputText = "";
    let isSafeStringNeeded = false;

    if (isDropdown && dropdownKeys.length === validDropdownSections && validDropdownSections > 1) {
      isSafeStringNeeded = true;
      outputText = this.createDropdown(dropdownKeys, finStrs);
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

    if (isDropdown) {
      dropdownKeys.push(objFilter || objName);
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
  createDropdown(dropdownKeys, finStrs) {
    // Simplified dropdown creation - maintaining essential functionality
    let dropdownId = "party-sheet-dropdown";
    // eslint-disable-next-line no-undef
    if (typeof generated_dropdowns !== "undefined") {
      // eslint-disable-next-line no-undef
      dropdownId += `-${generated_dropdowns}`;
    }

    let options = "";
    for (let i = 0; i < dropdownKeys.length; i++) {
      options += `<option value="${dropdownKeys[i]}">${dropdownKeys[i]}</option>`;
    }

    return `<select id="${dropdownId}" class="party-sheet-dropdown">${options}</select><div class="party-sheet-dropdown-content">${finStrs.join(
      "",
    )}</div>`;
  }
}
