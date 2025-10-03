import { generateCharacterSheetImageFromCharacter } from "../../utils.js";
import { DataProcessor } from "../base-processor.js";

/**
 * Processor for "charactersheet" data type - generates character sheet button HTML
 */
export class CharacterSheetProcessor extends DataProcessor {
  /**
   * Process charactersheet data (generates HTML for character sheet button)
   * @param {any} character - The character object
   * @param {any} value - The template value configuration (unused)
   * @param {object} options - Processing options (unused)
   * @returns {any} HTML SafeString for character sheet button
   */
  // eslint-disable-next-line no-unused-vars
  process(character, value, options = {}) {
    this.validate(character, value);

    // @ts-ignore
    return new Handlebars.SafeString(generateCharacterSheetImageFromCharacter(character));
  }
}
