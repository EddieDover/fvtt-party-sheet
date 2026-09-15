import { DataProcessor } from "../base-processor.js";
import { extractPropertyByString } from "../../utils.js";
import { TemplateProcessor } from "../template-processor.js";

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
      const uuid = extractPropertyByString(character, uuidPath);

      if (!uuid || typeof uuid !== "string") {
        return "";
      }

      // Dereference the UUID to get the linked document
      // @ts-ignore
      const linkedDocument = fromUuidSync(uuid);

      if (!linkedDocument) {
        return "";
      }

      // Convert document to data object for template processing
      const documentData = linkedDocument.toObject ? linkedDocument.toObject() : linkedDocument;

      // Process the template string with the document data
      const processedValue = TemplateProcessor.processTemplate(templateString, documentData);

      // Apply text parsing chain
      const [isSafeStringNeeded, outputText] = this.parserEngine.parseText(processedValue);

      // @ts-ignore
      return isSafeStringNeeded ? new Handlebars.SafeString(outputText) : outputText;
    } catch (error) {
      console.warn("UUID-link processor error:", error);
      return "";
    }
  }
}
