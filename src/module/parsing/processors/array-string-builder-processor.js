import { DataProcessor } from "../base-processor.js";
import { extractPropertyByString } from "../../utils.js";
import { sanitizeHTMLWithStyles } from "../../utils/dompurify-sanitizer.js";

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

    let objData = extractPropertyByString(character, objName);

    // Convert non-arrays to arrays
    if (!Array.isArray(objData) && !(objData instanceof Set)) {
      objData = Object.keys(objData).map((key) => objData[key]);
    }

    const regValue = /(\{[^}]*\})|((?:\*\.|[\w.]+)+)/g;
    const allMatches = Array.from(outStrTemplate.matchAll(regValue), (match) => match[0]).filter(
      (m) => !m.startsWith("{") && !m.endsWith("}"),
    );

    let outStr = "";
    if ((objData.size ?? objData.length) !== 0) {
      let subCount = 0;
      for (const objSubData of objData) {
        let templateCopy = outStrTemplate;
        for (const m of allMatches) {
          if (m === "value") {
            finalStr += outStrTemplate.replace(m, objSubData);
            continue;
          }
          templateCopy = templateCopy.replace(m, extractPropertyByString(objSubData, m));
        }
        outStr += templateCopy + (subCount > 0 ? "\n" : "");
        subCount += 1;
      }
    } else {
      return "";
    }

    if (finalStr === "") {
      finalStr = outStr;
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
