/**
 * Base FormApplication class
 * @class
 */
// eslint-disable-next-line no-shadow, no-unused-vars
class FormApplication {
  constructor() {
    /** @type {boolean} */
    this.rendered = false;
  }

  /**
   * Closes the form application
   * @returns {void}
   */
  close() {}

  /**
   * @typedef v13options
   * @property {boolean} force - Whether to force re-rendering the form.
   * @property {boolean} focus - Whether to focus the form after rendering.
   */

  /**
   * Renders the form application
   * @param {boolean|v13options} force - Whether to force re-rendering the form, or a v13options object containing render options.
   * @param {object} [options] - The options for rendering the form (when first parameter is boolean).
   * @returns {void}
   */
  // eslint-disable-next-line no-unused-vars
  render(force = false, options = {}) {}

  /**
   * Activates event listeners for the form application.
   * @param {any} any - The parameter for activating listeners.
   * @returns {void}
   */
  // eslint-disable-next-line no-unused-vars
  activateListeners(any) {}
}

/**
 * @typedef { 'direct' | 'math' | 'direct-complex' | 'string' | 'array-string-builder'|'span' } TemplateDataColumnType
 * @typedef { 'show' | 'hide' | 'skip' } TemplateDataColumnHeader
 * @typedef { 'left' | 'center' | 'right' } TemplateDataColumnAlignType
 * @typedef { 'top' | 'bottom' } TemplateDataColumnVAlignType
 * @typedef { 'left' | 'center' | 'right' } TemplateDataColumnHeaderAlignType
 */

/**
 * @typedef TemplateDataColumn
 * @property {string} name - The name of the column.
 * @property {TemplateDataColumnType} type - The type of data to display. See below for details.
 * @property {TemplateDataColumnHeader} header - Whether to show, hide, or skip the column.
 * @property {TemplateDataColumnAlignType} align - The horizontal alignment of the column.
 * @property {TemplateDataColumnVAlignType} valign - The vertical alignment of the column.
 * @property {TemplateDataColumnHeaderAlignType} headerAlign - The horizontal alignment of the header text.
 * @property {number} colspan - The number of columns to span.
 * @property {number} rowspan - The number of rows to span. Spanned rows must have spanover type.
 * @property {number} maxwidth - The maximum width of the column in pixels.
 * @property {number} minwidth - The minimum width of the column in pixels.
 * @property {boolean} showSign - Whether to show a plus sign for positive numbers.
 * @property {boolean} showTotal - Whether to show a total sum for this column in a footer row.
 * @property {string} text - The value to display. See below for details.
 */

/**
 * @typedef TemplateData
 * @property { string } system - The system this data is for.
 * @property { string } minimumSystemVersion - The version of the minimum system required.
 * @property { string } [maximumSystemVersion] - The version of the maximum system supported (optional).
 * @property { string } author - The author of this data.
 * @property { string } name - The name of this data.
 * @property { string } version - The version of this data.
 * @property { string? } preview - Optional preview image.
 * @property { string? } path - Optional path to the template file.
 * @property { Array<Array<TemplateDataColumn>> } rows - The rows of data to display. See below for details.
 * @property { string } offline_excludes_property - The property to use to exclude players. Note: This is optional and defaults to the actors.type property.
 * @property { Array<string|boolean> } offline_excludes - The types you want to exclude when showing offline players.
 * @property { string } offline_includes_property - The property to use to show players online.
 * @property { Array<string|boolean> } offline_includes - The types you want to include when showing online players.
 */

/**
 * @typedef { {name: string, author: string, players: any, rowcount: number} } CustomPlayerData
 */

/**
 * @typedef TemplateValidityData
 * @property { string } name - The name of the template.
 * @property { string } author - The author of the template.
 * @property { string } version - The version of the template.
 * @property { string } system - The system the template is for.
 * @property { string } providedVersion - The version of the template provided.
 * @property { string } minimumSystemVersion - The minimum system version required.
 * @property { string } [maximumSystemVersion] - The maximum system version supported (optional).
 * @property { string } ownedSystemVersion - The version of the system currently installed.
 */

/**
 * @typedef TemplateValidityReturnData
 * @property { TemplateValidityData[] } valid - The valid templates.
 * @property { TemplateValidityData[] } outOfDateTemplates - The out of date templates.
 * @property { TemplateValidityData[] } outOfDateSystems - The systems that are too old for templates.
 * @property { TemplateValidityData[] } tooNewSystems - The systems that are too new for templates.
 * @property { TemplateValidityData[] } noSystemInformation - The templates that have no system information.
 * @property { TemplateValidityData[] } noVersionInformation - The templates that have no version information.
 */

/**
 * @typedef SystemVersionSet
 * @property { string } system - The system name.
 * @property { string } version - The version of the system.
 */

/**
 * @typedef PartySheetRenderOptions
 * @property {boolean} [showInstaller] - Whether to show the installer
 */

/**
 * @typedef DirectComplexTextObject
 * @property {string} type - The type of the object.
 * @property {string} value - The value of the object.
 * @property {string} ifdata - The ifdata condition.
 * @property {string} matches - The matches condition.
 * @property {string} text - The text to display.
 * @property {string} [else] - The text to display if the condition is not met.
 * @property {string} [match] - The match condition property
 */
