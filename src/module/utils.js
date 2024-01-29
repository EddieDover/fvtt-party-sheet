import { DND5E } from "./systems/dnd5e";

var customSystems = [DND5E];
export var selectedSystem = null;

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
