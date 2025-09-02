/** @type {TemplateData[]} */
let customTemplates = [];
/** @type {TemplateData[]} */
let moduleTemplates = [];

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

/**
 * Get the module templates
 * @returns {TemplateData[]} The module templates
 */
export function getModuleTemplates() {
  return moduleTemplates;
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
    /** @type {TemplateData} */
    const template = JSON.parse(await fetch(path).then((r) => r.text()));
    const templateFileNameWithoutExtension = path.split("/").pop().split(".")[0];
    template.path = path;
    template.preview = `${template.system}/${templateFileNameWithoutExtension}.jpg`;
    if (template.name && template.author && template.system && template.rows) {
      return template;
    } else {
      return null;
    }
  } catch (e) {
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

    /** @type {TemplateData} */
    const template = JSON.parse(await fetch(path).then((r) => r.text()));
    if (template.name && template.author && template.system && template.rows) {
      if (template.version && template.minimumSystemVersion) {
        const maxVersionText = template.maximumSystemVersion ? ` (max: ${template.maximumSystemVersion})` : "";
        console.log(`${path} - Good Template - Min system: ${template.minimumSystemVersion}${maxVersionText}`);
      } else {
        console.warn(`${path} - Missing Version Information`);
      }
      if (customTemplates.find((t) => t.name === template.name && t.author === template.author)) {
        console.warn(`${path} - Duplicate Template`);
      } else {
        addCustomTemplate(template);
      }
    } else {
      console.error(`${path} - Bad Template`);
    }
  } catch (e) {
    console.log(`${path} - Failed to Load. See error below.`);
    console.error(e);
  }
}

/**
 * Get all the systems and versions available.
 * @returns {Promise<SystemVersionSet[]>} A list of all the systems and versions available.
 */
export async function getAllSystemVersions() {
  const systemVersions = [];

  try {
    let assetPrefix = "data";

    if (isForgeVTT()) {
      console.log("Detected ForgeVTT");
      // @ts-ignore
      // eslint-disable-next-line no-undef
      assetPrefix = ForgeVTT.ASSETS_LIBRARY_URL_PREFIX + (await ForgeAPI.getUserId()) + "/";
    }

    // @ts-ignore
    const systemFolder = await FilePicker.browse(assetPrefix, "systems"); // `modules/${MODULE_NAME}/templates`);
    for (var folder of systemFolder.dirs) {
      // @ts-ignore
      const pathFolder = await FilePicker.browse(assetPrefix, folder);
      // @ts-ignore
      for (var file of pathFolder.files.filter((f) => f.endsWith("system.json"))) {
        const data = JSON.parse(await fetch(file).then((r) => r.text()));
        systemVersions.push({
          system: data.id,
          version: data.version,
        });
      }
    }
  } catch (e) {
    console.error("Failed to get system versions:", e);
  }

  return systemVersions;
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
    tooNewSystems: [],
    outOfDateTemplates: [],
    noVersionInformation: [],
    noSystemInformation: [],
  };

  const systemVersions = await getAllSystemVersions();
  moduleTemplates = await loadModuleTemplates();

  for (const template of customTemplates) {
    const moduleTemplate = moduleTemplates.find((t) => t.name === template.name && t.author === template.author);
    let err = false;

    const templateData = {
      name: template.name,
      author: template.author,
      version: template.version,
      system: template.system,
      providedVersion: moduleTemplate?.version ?? "-",
      minimumSystemVersion: template.minimumSystemVersion,
      maximumSystemVersion: template.maximumSystemVersion,
      ownedSystemVersion: systemVersions.find((s) => s.system === template.system)?.version ?? "-",
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
      // @ts-ignore
      const currentSystem = game.system.id;
      if (template.system === currentSystem) {
        log(
          `Version check: "${template.name}" by ${template.author} - Current: v${template.version}, Available: v${moduleTemplate.version}`,
        );
      }
      output.outOfDateTemplates.push(templateData);
      err = true;
    } else if (moduleTemplate && compareSymVer(template.version, moduleTemplate.version) === 0) {
      // @ts-ignore
      const currentSystem = game.system.id;
      if (template.system === currentSystem) {
        log(`Version check: "${template.name}" by ${template.author} - Current: v${template.version} (up to date)`);
      }
    }

    if (templateData.ownedSystemVersion !== "-") {
      // Check if system is too old (below minimum required version)
      if (compareSymVer(templateData.ownedSystemVersion, templateData.minimumSystemVersion) < 0) {
        output.outOfDateSystems.push(templateData);
        err = true;
      }

      // Check if current system version exceeds maximum supported version (system too new)
      if (
        template.maximumSystemVersion &&
        compareSymVer(templateData.ownedSystemVersion, template.maximumSystemVersion) > 0
      ) {
        output.tooNewSystems.push(templateData);
        err = true;
      }
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
 * @param {*} template - The system to select.
 */
export function updateSelectedTemplate(template) {
  selectedTemplate = template;
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
 * @param {TemplateData} system - The custom system to add.
 */
export function addCustomTemplate(system) {
  customTemplates.push(system);
}

/**
 * Clears the list of systems.
 */
export function clearCustomTemplates() {
  customTemplates = [];
}

/**
 * Retrieves the list of custom systems.
 * @returns {TemplateData[]} - The list of custom systems.
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
 * @param {DirectComplexTextObject} item - The item to trim.
 * @returns {DirectComplexTextObject}  - The item with trimmed strings.
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

/**
 * Get the Foundry version
 * @returns {{ major: number, minor: number, full: string }} version
 */
export function getFoundryVersion() {
  // @ts-ignore
  const version = game.version;
  const versionInfo = version.split(".");
  const major = Number.parseInt(versionInfo[0]);
  const minor = Number.parseInt(versionInfo[1]);
  const full = version;

  return {
    major,
    minor,
    full,
  };
}

/**
 * Checks if the current Foundry version is at least the specified major version.
 * @param {*} major - The major version to check against.
 * @returns {boolean} True if the current version is at least the specified major version, false otherwise.
 */
export function isVersionAtLeast(major) {
  const version = getFoundryVersion();
  return version.major >= major;
}

/**
 * Shows notification banners when version differences are detected between installed templates
 * and the example templates provided with the module.
 * @param {TemplateValidityReturnData} validationData - The validation data from validateSystemTemplates()
 */
export function showVersionDifferenceNotifications(validationData) {
  // @ts-ignore
  if (!game.user.isGM) {
    return; // Only show notifications to GM
  }

  // @ts-ignore
  const showNotifications = game.settings.get("fvtt-party-sheet", "showVersionNotifications");
  if (!showNotifications) {
    return; // User has disabled version notifications
  }

  // @ts-ignore
  const currentSystem = game.system.id;

  // Filter validation data to only include templates for the current game system
  const currentSystemOutOfDate =
    validationData.outOfDateTemplates?.filter((template) => template.system === currentSystem) || [];

  const outOfDateCount = currentSystemOutOfDate.length;

  // Show notification for templates that have newer versions available in the module
  if (outOfDateCount > 0) {
    // @ts-ignore
    const message = game.i18n.format("fvtt-party-sheet.notifications.template-update-available", {
      count: outOfDateCount,
    });
    // @ts-ignore
    ui.notifications.warn(message, { permanent: false, console: false });
    log(`${outOfDateCount} template update(s) available for ${currentSystem}`);
  }
}
