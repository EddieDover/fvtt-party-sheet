import { DataProcessor } from "../base-processor.js";
import { extractPropertyByString } from "../../utils.js";
import { TemplateProcessor } from "../template-processor.js";
import { sanitizeHTMLWithStyles } from "../../utils/dompurify-sanitizer.js";

/**
 * Processor for "uuid-link" data type - dereferences UUID links to documents
 * Supports syntax like: "class => {name}" to access properties of linked documents
 */
export class UuidLinkProcessor extends DataProcessor {
  constructor(parserEngine) {
    super();
    this.parserEngine = parserEngine;
  }

  /**
   * Process UUID link dereferencing
   * @param {any} character - The character object to extract data from
   * @param {string} value - The template value configuration (e.g., "class => {name}")
   * @param {object} options - Processing options
   * @returns {any} The processed data from the linked document
   */
  process(character, value, options = {}) {
    this.validate(character, value);

    try {
      const parts = value.split("=>");
      if (parts.length !== 2) {
        console.warn("uuid-link processor requires format: 'propertyPath => {property}'");
        return "";
      }

      const uuidPath = parts[0].trim();
      const templateString = parts[1].trim();

      // Extract the UUID from the character
      const uuidValue = extractPropertyByString(character, uuidPath);

      if (!uuidValue) {
        return "";
      }

      let processedValue = "";
      if (Array.isArray(uuidValue)) {
        const linkedDocumentDataArray = uuidValue.map((uuid) => this.getLinkedDocumentData(uuid));
        processedValue = TemplateProcessor.processTemplateWithArray(templateString, linkedDocumentDataArray);
      } else {
        const linkedDocumentData = this.getLinkedDocumentData(uuidValue);
        processedValue = TemplateProcessor.processTemplate(templateString, linkedDocumentData);
      }

      // String sanitization
      processedValue = this.cleanString(processedValue);
      processedValue = processedValue === value ? "" : processedValue; // If no change, return empty string

      // Apply text parsing chain
      const [isSafeStringNeeded, outputText] = this.parserEngine.parseText(processedValue, character, options);

      // @ts-ignore
      return isSafeStringNeeded ? new Handlebars.SafeString(outputText) : outputText;
    } catch (error) {
      console.warn("UUID-link processor error:", error);
      return "";
    }
  }

  /**
   * Get data object from a linked document using its UUID
   * @param {string} uuid - The UUID to dereference
   * @returns {any} The processed data object
   * @private
   */
  getLinkedDocumentData(uuid) {
    // Dereference the UUID to get the linked document
    // @ts-ignore
    const linkedDocument = fromUuidSync(uuid);

    if (!linkedDocument) {
      return "";
    }

    // Convert document to data object for template processing
    return linkedDocument.toObject ? linkedDocument.toObject() : linkedDocument;
  }

  /**
   * Clean a string of html injection, remove trailing commas, and trim whitespace
   * @param {string} input - The value to clean
   * @returns {string} The cleaned value
   */
  cleanString(input) {
    if (typeof input !== "string") {
      return input;
    }

    let finalString = input.trim();

    // Use DOMPurify with allowed styles
    finalString = sanitizeHTMLWithStyles(finalString, [
      "color",
      "background-color",
      "font-weight",
      "font-style",
      "text-decoration",
    ]);

    // Remove trailing commas
    return finalString.replace(/,\s*$/, "");
  }
}
