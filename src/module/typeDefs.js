/**
 * @typedef { 'direct' | 'math' | 'direct-complex' | 'string' | 'array-string-builder'|'span' } TemplateDataColumnType
 * @typedef { 'show' | 'hide' | 'skip' } TemplateDataColumnHeader
 * @typedef { 'left' | 'center' | 'right' } TemplateDataColumnAlignType
 * @typedef { 'top' | 'bottom' } TemplateDataColumnVAlignType
 */

/**
 * @typedef TemplateDataColumn
 * @property {string} name - The name of the column.
 * @property {TemplateDataColumnType} type - The type of data to display. See below for details.
 * @property {TemplateDataColumnHeader} header - Whether to show, hide, or skip the column.
 * @property {TemplateDataColumnAlignType} align - The horizontal alignment of the column.
 * @property {TemplateDataColumnVAlignType} valign - The vertical alignment of the column.
 * @property {number} colspan - The number of columns to span.
 * @property {number} rowspan - The number of rows to span. Spanned rows must have spanover type.
 * @property {number} maxwidth - The maximum width of the column in pixels.
 * @property {number} minwidth - The minimum width of the column in pixels.
 * @property {boolean} showSign - Whether to show a plus sign for positive numbers.
 * @property {string} text - The value to display. See below for details.
 */

/**
 * @typedef TemplateData
 * @property { string } system - The system this data is for.
 * @property { string } minimumSystemVersion - The version of the minimum system required.
 * @property { string } author - The author of this data.
 * @property { string } name - The name of this data.
 * @property { string } version - The version of this data.
 * @property { string? } preview - Optional preview image.
 * @property { string? } path - Optional path to the template file.
 * @property { Array<Array<TemplateDataColumn>> } rows - The rows of data to display. See below for details.
 * @property { string } offline_excludes_property - The property to use to exclude players. Note: This is optional and defaults to the actors.type property.
 * @property { Array<string> } offline_excludes - The types you want to exclude when showing offline players.
 * @property { string } offline_includes_property - The property to use to show players online.
 * @property { Array<string> } offline_includes - The types you want to include when showing online players.
 */

/**
 * @typedef { {name: string, author: string, players: any, rowcount: number} } CustomPlayerData
 */

/**
 * @typedef TemplateValidityData
 * @property { string } name - The name of the template.
 * @property { string } author - The author of the template.
 * @property { string } version - The version of the template.
 * @property { string } providedVersion - The version of the template provided.
 * @property { string } minimumSystemVersion - The minimum system version required.
 */

/**
 * @typedef TemplateValidityReturnData
 * @property { TemplateValidityData[] } valid - The valid templates.
 * @property { TemplateValidityData[] } outOfDateTemplates - The out of date templates.
 * @property { TemplateValidityData[] } outOfDateSystems - The out of date systems.
 * @property { TemplateValidityData[] } noSystemInformation - The templates that have no system information.
 * @property { TemplateValidityData[] } noVersionInformation - The templates that have no version information.
 */

/**
 * @typedef SystemVersionSet
 * @property { string } system - The system name.
 * @property { string } version - The version of the system.
 */
