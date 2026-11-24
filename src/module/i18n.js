/**
 * Localizes a key, falling back to the given English text when no translation is found
 * (e.g. before the language files are loaded, or in tests).
 * Placeholders like {name} are filled from `data` in both cases.
 * @param {string} key - The localization key.
 * @param {string} fallback - The English text to use when the key is not translated.
 * @param {{[key: string]: any}} [data] - Values for the placeholders.
 * @returns {string} The localized text.
 */
export function localizeOr(key, fallback, data = {}) {
  // @ts-ignore
  const i18n = globalThis.game?.i18n;
  let text;
  if (i18n) {
    text = Object.keys(data).length ? i18n.format?.(key, data) : i18n.localize?.(key);
  }
  if (typeof text === "string" && text && text !== key) {
    return text;
  }
  return fallback.replace(/\{(\w+)\}/g, (match, field) => (field in data ? String(data[field]) : match));
}
