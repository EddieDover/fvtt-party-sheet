import { DND5E } from "./systems/dnd5e";

let customSystems = [DND5E];
let selectedSystem = null;
let templatesLoaded = false;

/**
 * Are the templates loaded?
 * @returns {boolean} True if the templates are loaded
 */
export function areTemplatesLoaded() {
  return templatesLoaded;
}

/**
 * Set the templates loaded status
 * @param {boolean} value The value to set the templates loaded status to
 */
export function setTemplatesLoaded(value) {
  templatesLoaded = value;
}

const NEWLINE_ELEMENTS = ["{newline}", "{nl}"];

export class TemplateProcessError extends Error {
  constructor(message) {
    super(message);
    this.name = "TemplateProcessError";
    this.data = {
      name: "",
      author: "",
    };
  }
}

/**
 *
 * @param {any} message The message to send to console.log
 */
export function log(message) {
  console.log("fvtt-party-sheet | ", message);
}

/**
 * Checks if the current environment is ForgeVTT
 * @returns {boolean} True if the current environment is ForgeVTT
 */
export function isForgeVTT() {
  // @ts-ignore
  if (typeof ForgeVTT === "undefined") {
    return false;
  }
  // @ts-ignore
  // eslint-disable-next-line no-undef
  return ForgeVTT.usingTheForge;
}

/**
 * Load all the user-provided templates for systems
 * @param {string} path The path to the template
 * @returns {Promise<void>} A promise that resolves when the template is loaded
 */
export async function loadSystemTemplate(path) {
  try {
    const templateName = path.split("/").pop().split(".")[0];
    log(`Loading template: ${templateName}`);
    const template = JSON.parse(await fetch(path).then((r) => r.text()));
    if (template.name && template.author && template.system && template.rows) {
      console.log(`${path} - Good Template`);
      addCustomSystem(template);
    } else {
      console.log(`${path} - Bad Template`);
    }
  } catch (e) {
    console.log(`${path} - Failed to Load. See error below.`);
    console.error(e);
  }
}

/**
 * Load all the user-provided templates for systems
 */
export async function loadSystemTemplates() {
  // Look inside the "partysheets" folder. Any JSON file inside should be loaded
  const templatePaths = [];
  // @ts-ignore

  let assetPrefix = "data";

  if (isForgeVTT()) {
    console.log("Detected ForgeVTT");
    // @ts-ignore
    // eslint-disable-next-line no-undef
    assetPrefix = ForgeVTT.ASSETS_LIBRARY_URL_PREFIX + (await ForgeAPI.getUserId()) + "/";
  }

  try {
    // @ts-ignore
    await FilePicker.createDirectory(assetPrefix, "partysheets"); //, { bucket: "public" }
  } catch (e) {
    console.log("Failed creating PartySheets directory. It probably already exists.");
  }

  // @ts-ignore
  const templateFiles = await FilePicker.browse(assetPrefix, "partysheets"); // `modules/${MODULE_NAME}/templates`);

  templateFiles.files.forEach((file) => {
    if (file.endsWith(".json")) {
      templatePaths.push(file);
    }
  });

  for (const path of templatePaths) {
    await loadSystemTemplate(path);
  }

  templatesLoaded = true;
}

/**
 * Converts a string to proper case.
 * @param {string} inputString - The input string to convert.
 * @returns {string} - The converted string in proper case.
 */
export function toProperCase(inputString) {
  return inputString
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Updates the selected system.
 * @param {*} system - The system to select.
 */
export function updateSelectedSystem(system) {
  selectedSystem = system;
}

/**
 * Retrieves the selected system.
 * @returns {*} - The selected system.
 */
export function getSelectedSystem() {
  return selectedSystem;
}

/**
 * Adds a custom system to the list of systems.
 * @param {*} system - The custom system to add.
 */
export function addCustomSystem(system) {
  customSystems.push(system);
}

/**
 * Retrieves the list of custom systems.
 * @returns {*} - The list of custom systems.
 */
export function getCustomSystems() {
  return customSystems;
}

/**
 * Retrieves a nested property from an object using a string path.
 * @param {object} obj - The object from which to retrieve the property.
 * @param {string | boolean} path - A string path to the property, with each nested property separated by a dot.
 * @returns {*} - The value of the property at the end of the path, or `undefined` if any part of the path is undefined.
 * @example
 * // returns 2
 * extractPropertyByString({a: {b: 2}}, "a.b");
 */
export function extractPropertyByString(obj, path) {
  if (typeof path === "boolean" || typeof path === "number") {
    return path;
  }

  const keys = path.split(".");

  let currentObject = obj;

  for (let key of keys) {
    currentObject = currentObject[key];

    // If the property is not found, return undefined
    if (currentObject === undefined) {
      return undefined;
    }
  }

  if (currentObject && Object.prototype.hasOwnProperty.call(currentObject, "value")) {
    return currentObject.value;
  }

  return currentObject;
}

/**
 * Takes a JSON object and trims the strings for value, else, and match.
 * @param {*} item - The item to trim.
 * @returns {*}  - The item with trimmed strings.
 */
export function trimIfString(item) {
  if (item.text && typeof item.text === "string") {
    item.text = item.text.trim();
  }
  if (item.else && typeof item.else === "string") {
    item.else = item.else.trim();
  }
  if (item.matches && typeof item.matches === "string") {
    item.matches = item.matches.trim();
  }

  return item;
}

/**
 * Parses out plus sumbols and adds values together.
 * @param {*} value - The value to parse.
 * @returns {*} - The value with the pluses parsed out.
 */
export function parsePluses(value) {
  // Match patterns with optional spaces around {+}
  let match = value.match(/(\d+)\s*\{\+\}\s*(\d+)|\d+\{\+\}\d+/);
  if (!match) {
    return value;
  }
  do {
    const numbers = match[0].trim().split("{+}").map(Number);
    const result = numbers[0] + numbers[1];
    value = value.replace(match[0], result.toString());
  } while ((match = value.match(/(\d+)\s*\{\+\}\s*(\d+)|\d+\{\+\}\d+/)));

  return value;
}

/**
 * Parse underline, bold, and italics from a string.
 * @param {string} value - The value to parse.
 * @param {boolean} isSafeStringNeeded - A boolean indicating if a SafeString is needed.
 * @returns {[boolean, string]} - A tuple with the first value being a boolean indicating if a SafeString is needed and the second value being the parsed string.
 */
export function parseExtras(value, isSafeStringNeeded = false) {
  // Detect if any text is surrounded with "{i} and {/i}" and replace with <i> tags
  if (value.indexOf("{i}") > -1 || value.indexOf("{/i}") > -1) {
    isSafeStringNeeded = true;
    value = value.replaceAll("{i}", "<i>").replaceAll("{/i}", "</i>");
  }

  // Detect if any text is surrounded with "{b} and {/b}" and replace with <b> tags
  if (value.indexOf("{b}") > -1 || value.indexOf("{/b}") > -1) {
    isSafeStringNeeded = true;
    value = value.replaceAll("{b}", "<b>").replaceAll("{/b}", "</b>");
  }

  // Detect if any text is surrounded with "{u} and {/u}" and replace with <b> tags
  if (value.indexOf("{u}") > -1 || value.indexOf("{/u}") > -1) {
    isSafeStringNeeded = true;
    value = value.replaceAll("{u}", "<u>").replaceAll("{/u}", "</u>");
  }

  // Detect if any text is surrounded with "{u} and {/u}" and replace with <b> tags
  if (value.indexOf("{s}") > -1) {
    isSafeStringNeeded = true;
    value = value.replaceAll("{s}", "&nbsp;");
  }

  // Detect if the value contains {sX} where x is a digit and insert that many &nbsp; marks
  ({ value, isSafeStringNeeded } = parseSpacing(value, isSafeStringNeeded));

  //Parse out newline elements
  ({ value, isSafeStringNeeded } = parseNewlines(value, isSafeStringNeeded));

  return [isSafeStringNeeded, value];
}

/**
 * Parses out spacing elements from a string.
 * @param {string} value - The value to parse.
 * @param {boolean} isSafeStringNeeded - A boolean indicating if a SafeString is needed.
 * @returns {{value: string, isSafeStringNeeded: boolean}} - The parsed string and a boolean indicating if a SafeString is needed.
 */
export function parseSpacing(value, isSafeStringNeeded) {
  let match = value.match(/\{s(\d+)\}/g);
  if (match) {
    for (const item of match) {
      isSafeStringNeeded = true;
      let amount = Number.parseInt(item.substring(2, item.length - 1));
      if (amount > 0) {
        value = value.replace(item, "&nbsp;".repeat(amount));
      } else {
        //If the amount is 0, then we want to trim all spaces before and after the {s0} tag
        let before = value.substring(0, value.indexOf(item));
        let after = value.substring(value.indexOf(item) + item.length);
        value = before.trim() + after.trim();
      }
    }
  }
  return { value, isSafeStringNeeded };
}

/**
 * Parses out newline elements from a string.
 * @param {string} value - The value to parse.
 * @param {boolean} isSafeStringNeeded - A boolean indicating if a SafeString is needed.
 * @returns {{value: string, isSafeStringNeeded: boolean}} - The parsed string and a boolean indicating if a SafeString is needed.
 */
export function parseNewlines(value, isSafeStringNeeded) {
  for (const item of NEWLINE_ELEMENTS) {
    if (value.indexOf(item) > -1) {
      isSafeStringNeeded = true;
      value = value.replaceAll(item, "<br/>");
    }
  }
  return { value, isSafeStringNeeded };
}
