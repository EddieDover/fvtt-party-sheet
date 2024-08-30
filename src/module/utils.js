/** @type {TemplateData[]} */
let customTemplates = [];

let selectedTemplate = null;
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
 * @returns {Promise<TemplateData>} A promise that resolves when the template is loaded
 */
export async function getModuleTemplate(path) {
  try {
    const templateName = path.split("/").pop().split(".")[0];
    log(`Loading template: ${templateName}`);

    /** @type {TemplateData} */
    const template = JSON.parse(await fetch(path).then((r) => r.text()));
    if (template.name && template.author && template.system && template.rows) {
      if (template.version && template.minimumSystemVersion) {
        console.log(`${path} - Good Template`);
      } else {
        console.warn(`${path} - Missing Version Information`);
      }
      return template;
    } else {
      console.log(`${path} - Bad Template`);
      return null;
    }
  } catch (e) {
    console.log(`${path} - Failed to Load. See error below.`);
    console.error(e);
    return null;
  }
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

    /** @type TemplateData */
    const template = JSON.parse(await fetch(path).then((r) => r.text()));
    if (template.name && template.author && template.system && template.rows) {
      if (template.version && template.minimumSystemVersion) {
        console.log(`${path} - Good Template`);
      } else {
        console.warn(`${path} - Missing Version Information`);
      }
      addCustomTemplate(template);
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
 * Load all the user-provided templates for modules
 * @returns {Promise<TemplateData[]>} A promise that resolves when the templates are loaded
 */
export async function loadModuleTemplates() {
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
  const templateFolders = await FilePicker.browse("data", "/modules/fvtt-party-sheet/example_templates/");
  for (const folder of templateFolders.dirs) {
    // @ts-ignore
    const templateFiles = await FilePicker.browse("data", folder);

    for (const file of templateFiles.files) {
      if (file.endsWith(".json")) {
        templatePaths.push(file);
      }
    }
  }

  console.log(templatePaths);

  /** @type {TemplateData[]} */
  const includedTemplates = [];

  for (const path of templatePaths) {
    includedTemplates.push(await getModuleTemplate(path));
  }

  return includedTemplates;
}

/**
 * Validates the system templates.
 * @returns {Promise<TemplateValidityReturnData>} - A list of the valid, out of date, and too new templates.
 */
export async function validateSystemTemplates() {
  /** @type {TemplateValidityReturnData} */
  let output = {
    valid: [],
    outOfDateSystems: [],
    outOfDateTemplates: [],
    noVersionInformation: [],
    noSystemInformation: [],
  };

  const moduleTemplates = await loadModuleTemplates();

  for (const template of customTemplates) {
    const moduleTemplate = moduleTemplates.find((t) => t.name === template.name);
    let err = false;

    const templateData = {
      name: template.name,
      author: template.author,
      version: template.version,
      providedVersion: moduleTemplate?.version ?? "-",
      minimumSystemVersion: template.minimumSystemVersion,
    };
    if (!template.minimumSystemVersion) {
      output.noVersionInformation.push(templateData);
      err = true;
    }

    if (!template.minimumSystemVersion) {
      output.noSystemInformation.push(templateData);
      err = true;
    }

    if (!moduleTemplate) {
      output.valid.push(templateData);
      continue;
    }

    if (moduleTemplate && compareSymVer(template.version, moduleTemplate.version) < 0) {
      output.outOfDateTemplates.push(templateData);
      err = true;
    }

    // @ts-ignore
    if (compareSymVer(template.minimumSystemVersion, game.system.version) < 0) {
      output.outOfDateSystems.push(templateData);
      err = true;
    }

    if (!err) {
      output.valid.push(templateData);
    }
  }

  return output;
}

/**
 * Compares to SymVer strings.
 * @param {string} a - The first string to compare.
 * @param {string} b - The second string to compare.
 * @returns {number} Returns 0 if the strings are equal, -1 if a is less than b, and 1 if a is greater than b.
 */
export function compareSymVer(a, b) {
  if (!a || !b || !a.includes(".") || !b.includes(".")) {
    return 0;
  }
  const [aMajor, aMinor, aPatch] = a.split(".").map(Number);
  const [bMajor, bMinor, bPatch] = b.split(".").map(Number);

  if (aMajor < bMajor) return -1;
  if (aMajor > bMajor) return 1;
  if (aMinor < bMinor) return -1;
  if (aMinor > bMinor) return 1;
  if (aPatch < bPatch) return -1;
  if (aPatch > bPatch) return 1;
  return 0; // strings are equal
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
export function updateSelectedTemplate(system) {
  selectedTemplate = system;
}

/**
 * Retrieves the selected system.
 * @returns {*} - The selected system.
 */
export function getSelectedTemplate() {
  return selectedTemplate;
}

/**
 * Adds a custom system to the list of systems.
 * @param {*} system - The custom system to add.
 */
export function addCustomTemplate(system) {
  customTemplates.push(system);
}

/**
 * Retrieves the list of custom systems.
 * @returns {*} - The list of custom systems.
 */
export function getCustomTemplates() {
  return customTemplates;
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

  ({ value, isSafeStringNeeded } = parseFontAwesome(value, isSafeStringNeeded));

  // Detect if the value contains {sX} where x is a digit and insert that many &nbsp; marks
  ({ value, isSafeStringNeeded } = parseSpacing(value, isSafeStringNeeded));

  //Parse out newline elements
  ({ value, isSafeStringNeeded } = parseNewlines(value, isSafeStringNeeded));

  return [isSafeStringNeeded, value];
}

/**
 * Add a sign to a value.
 * @param {string|number} value - The value to add a sign to
 * @returns {string} The value with a sign
 * @memberof PartySheetForm
 */
export function addSign(value) {
  if (typeof value === "string") {
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue > 0 && !value.includes("+")) {
      value = "+" + value;
    }
  } else if (typeof value === "number" && value > 0) {
    value = "+" + value.toString();
  }
  return value.toString();
}

/**
 * Parses out font awesome elements from a string.
 * @param {*} value - The value to parse.
 * @param {*} isSafeStringNeeded - A boolean indicating if a SafeString is needed.
 * @returns {{value: string, isSafeStringNeeded: boolean}} - The parsed string and a boolean indicating if a SafeString is needed.
 */
export function parseFontAwesome(value, isSafeStringNeeded) {
  let match = value.match(/\{fa\s(fa-([a-zA-Z0-9-]+)\s?)*\}/g);
  if (match) {
    for (const item of match) {
      isSafeStringNeeded = true;
      let data = item.substring(1, item.length - 1);
      value = value.replace(item, `<i class="${data}"></i>`);
    }
  }
  return { value, isSafeStringNeeded };
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
