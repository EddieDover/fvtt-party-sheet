import { ObjectLoopProcessor } from "./object-loop-processor.js";

/**
 * Processor for "uuid-link" data type - dereferences UUID links to documents
 * Supports syntax like: "system.class => {name}" to access properties of linked documents
 */
export class UuidLinkProcessor extends ObjectLoopProcessor {
  /**
   * Override normalizeObjectData to dereference UUID strings before normalizing.
   * A string is treated as a single UUID, an array as a list of UUIDs. Anything
   * else is passed through to the parent implementation without modifications.
   * @param {any} objData - A UUID string, array of UUID strings, or regular object data
   * @returns {Array<object>} Normalized array of document data objects
   */
  normalizeObjectData(objData) {
    if (typeof objData === "string") {
      return super.normalizeObjectData(this.dereferenceUuids([objData]));
    }
    if (Array.isArray(objData)) {
      return super.normalizeObjectData(this.dereferenceUuids(objData));
    }
    return super.normalizeObjectData(objData);
  }

  /**
   * Resolve each UUID string to its document data. Non-string entries are kept as-is
   * and UUIDs that cannot be resolved are skipped.
   * @param {Array<any>} values - UUID strings (or already resolved objects)
   * @returns {Array<object>} Resolved document data objects
   */
  dereferenceUuids(values) {
    const result = [];

    for (const value of values) {
      if (typeof value !== "string") {
        result.push(value);
        continue;
      }

      try {
        // @ts-ignore
        const linkedDocument = fromUuidSync(value, { strict: false });
        if (!linkedDocument) {
          continue;
        }

        // Convert document to data object for template processing
        result.push(linkedDocument.toObject ? linkedDocument.toObject() : linkedDocument);
      } catch (error) {
        console.warn(`Failed to dereference UUID: ${value}`, error);
      }
    }

    return result;
  }
}
