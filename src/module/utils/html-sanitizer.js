/**
 * HTML Sanitization utility for FoundryVTT modules
 * Uses browser's built-in DOMParser for safe HTML processing
 */

/**
 * Sanitizes HTML content by removing dangerous elements and attributes
 * @param {string} html - The HTML content to sanitize
 * @param {object} options - Sanitization options
 * @returns {string} - The sanitized HTML content
 */
export function sanitizeHTML(html, options = {}) {
  if (typeof html !== "string") {
    return html;
  }

  const defaultOptions = {
    allowedTags: ["b", "i", "u", "strong", "em", "span", "div", "p", "br", "img"],
    allowedAttributes: {
      "img": ["src", "alt", "width", "height", "title", "class"],
      "span": ["class", "style"],
      "div": ["class", "style"],
      "p": ["class", "style"],
      "*": ["class"], // Allow class on all allowed tags
    },
    allowedStyles: ["color", "background-color", "font-weight", "font-style", "text-decoration"],
    ...options,
  };

  try {
    // Create a new DOMParser instance
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
    const container = doc.querySelector("div");

    if (!container) {
      return html; // Fallback to original if parsing fails
    }

    // Recursively sanitize all elements
    sanitizeElement(container, defaultOptions);

    return container.innerHTML;
  } catch (error) {
    console.warn("HTML sanitization failed, falling back to basic cleaning:", error);
    return basicCleanHTML(html);
  }
}

/**
 * Recursively sanitizes DOM elements
 * @param {Element} element - The element to sanitize
 * @param {object} options - Sanitization options
 */
function sanitizeElement(element, options) {
  const children = Array.from(element.children);

  for (const child of children) {
    const tagName = child.tagName.toLowerCase();

    // Remove disallowed tags
    if (!options.allowedTags.includes(tagName)) {
      // Keep text content but remove the tag
      const textNode = document.createTextNode(child.textContent || "");
      child.parentNode.replaceChild(textNode, child);
      continue;
    }

    // Clean attributes
    cleanAttributes(child, options.allowedAttributes, options.allowedStyles);

    // Recursively process children
    if (child.children.length > 0) {
      sanitizeElement(child, options);
    }
  }
}

/**
 * Cleans attributes on an element
 * @param {Element} element - The element to clean
 * @param {object} allowedAttributes - Map of allowed attributes per tag
 * @param {string[]} allowedStyles - Array of allowed CSS properties
 */
function cleanAttributes(element, allowedAttributes, allowedStyles) {
  const tagName = element.tagName.toLowerCase();
  const allowedForTag = [...(allowedAttributes[tagName] || []), ...(allowedAttributes["*"] || [])];

  // Get all attributes to check
  const attributes = Array.from(element.attributes);

  for (const attr of attributes) {
    const attrName = attr.name.toLowerCase();

    // Remove disallowed attributes
    if (!allowedForTag.includes(attrName)) {
      element.removeAttribute(attr.name);
      continue;
    }

    // Special handling for style attribute
    if (attrName === "style") {
      const cleanedStyle = sanitizeStyle(attr.value, allowedStyles);
      if (cleanedStyle) {
        element.setAttribute("style", cleanedStyle);
      } else {
        element.removeAttribute("style");
      }
      continue;
    }

    // Clean attribute values
    element.setAttribute(attr.name, sanitizeAttributeValue(attr.value));
  }
}

/**
 * Sanitizes CSS style values
 * @param {string} styleValue - The style attribute value
 * @param {string[]} allowedStyles - Array of allowed CSS properties
 * @returns {string} - Sanitized style value
 */
function sanitizeStyle(styleValue, allowedStyles) {
  if (!styleValue) return "";

  const styles = styleValue.split(";");
  const cleanedStyles = [];

  for (const style of styles) {
    const [property, value] = style.split(":").map((s) => s.trim());

    if (property && value && allowedStyles.includes(property.toLowerCase())) {
      // Basic validation to prevent CSS injection
      if (!value.includes("expression") && !value.includes("javascript:")) {
        cleanedStyles.push(`${property}: ${value}`);
      }
    }
  }

  return cleanedStyles.join("; ");
}

/**
 * Sanitizes individual attribute values
 * @param {string} value - The attribute value
 * @returns {string} - Sanitized value
 */
function sanitizeAttributeValue(value) {
  if (!value) return "";

  // Remove javascript: protocols and other dangerous content
  return value
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/data:/gi, "")
    .replace(/on\w+=/gi, "");
}

/**
 * Basic HTML cleaning fallback
 * @param {string} html - HTML to clean
 * @returns {string} - Cleaned HTML
 */
function basicCleanHTML(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/<(iframe|object|embed|link|meta|style)[^>]*>/gi, "");
}
