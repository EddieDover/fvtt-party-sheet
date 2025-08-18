/**
 * HTML Sanitization utility using DOMPurify
 * Provides a configured sanitizer for FVTT Party Sheet module
 */

import DOMPurify from "../vendor/dompurify.es.js";

/**
 * Default sanitization configuration for the party sheet
 */
const DEFAULT_CONFIG = {
  ALLOWED_TAGS: ["b", "i", "u", "strong", "em", "span", "br", "div", "p"],
  ALLOWED_ATTR: ["class", "style"],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ["script", "object", "embed", "iframe", "form", "input"],
  FORBID_ATTR: ["id", "onclick", "onload", "onerror", "onmouseover"],
  KEEP_CONTENT: true, // Keep text content of forbidden tags
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false,
};

/**
 * Sanitizes HTML content using DOMPurify with party sheet specific configuration
 * @param {string} html - The HTML content to sanitize
 * @param {object} options - Additional DOMPurify options to merge with defaults
 * @returns {string} - The sanitized HTML content
 */
export function sanitizeHTML(html, options = {}) {
  if (typeof html !== "string") {
    return html;
  }

  // Merge custom options with defaults
  const config = { ...DEFAULT_CONFIG, ...options };

  try {
    return DOMPurify.sanitize(html, config);
  } catch (error) {
    console.warn("DOMPurify sanitization failed, falling back to basic cleaning:", error);
    return basicFallbackSanitize(html);
  }
}

/**
 * Sanitizes HTML with specific configuration for inline styles
 * @param {string} html - The HTML content to sanitize
 * @param {string[]} allowedStyles - Array of allowed CSS properties
 * @returns {string} - The sanitized HTML content
 */
export function sanitizeHTMLWithStyles(html, allowedStyles = []) {
  if (typeof html !== "string") {
    return html;
  }

  const config = {
    ...DEFAULT_CONFIG,
    ALLOWED_STYLES: allowedStyles.reduce((acc, style) => {
      acc[style] = true;
      return acc;
    }, {}),
  };

  try {
    return DOMPurify.sanitize(html, config);
  } catch (error) {
    console.warn("DOMPurify sanitization with styles failed:", error);
    return basicFallbackSanitize(html);
  }
}

/**
 * Basic fallback sanitizer in case DOMPurify fails
 * @param {string} html - HTML to sanitize
 * @returns {string} - Basic sanitized HTML
 */
function basicFallbackSanitize(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/<(iframe|object|embed|link|meta|style|form|input)[^>]*>/gi, "");
}

/**
 * Get DOMPurify version info (useful for debugging)
 * @returns {string} - Version information
 */
export function getDOMPurifyVersion() {
  return DOMPurify.version || "unknown";
}

/**
 * Check if DOMPurify is properly loaded
 * @returns {boolean} - True if DOMPurify is available
 */
export function isDOMPurifyAvailable() {
  return typeof DOMPurify !== "undefined" && typeof DOMPurify.sanitize === "function";
}
