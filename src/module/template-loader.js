import { GITHUB_TEMPLATES_URL, TEMPLATES_BASE_URL } from "./constants";
import { localizeOr } from "./i18n.js";

/**
 * @typedef {object} TemplateLoadResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {string} status - Status message to display to user
 * @property {TemplateData[]} templates - Array of loaded templates
 * @property {string} [error] - Error message if failed
 */

/**
 * Parse a simple YAML file into a JavaScript object
 * @param {string} yamlText The YAML text to parse
 * @returns {object} Parsed YAML object
 */
function parseSimpleYaml(yamlText) {
  const result = {};
  const lines = yamlText.split("\n");
  let currentSystem = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Check if this is a system line (no leading spaces, ends with colon)
    if (!line.startsWith(" ") && line.includes(":") && !line.includes("file:")) {
      currentSystem = trimmed.replace(":", "");
      result[currentSystem] = [];
    } else if (currentSystem && line.startsWith("  - ")) {
      // This is a template entry
      const template = {};
      const entryLine = trimmed.substring(2); // Remove "- "

      // Parse file from this line
      if (entryLine.includes("file:")) {
        const fileMatch = entryLine.match(/file:\s*(.+?)(?:\s|$)/);
        if (fileMatch) template.file = fileMatch[1];
      }

      // Look ahead for version and author on next lines or same line
      let i = lines.indexOf(line) + 1;
      const sameLineVersion = entryLine.match(/version:\s*(.+?)(?:\s|$)/);
      const sameLineAuthor = entryLine.match(/author:\s*(.+?)$/);

      if (sameLineVersion) template.version = sameLineVersion[1];
      if (sameLineAuthor) template.author = sameLineAuthor[1];

      // Check next few lines for additional properties
      while (i < lines.length && lines[i].startsWith("    ")) {
        const propLine = lines[i].trim();
        if (propLine.includes("version:")) {
          const match = propLine.match(/version:\s*(.+)/);
          if (match) template.version = match[1];
        } else if (propLine.includes("author:")) {
          const match = propLine.match(/author:\s*(.+)/);
          if (match) template.author = match[1];
        }
        i++;
      }

      result[currentSystem].push(template);
    }
  }

  return result;
}

/**
 * Load a single template from a URL
 * @param {string} path The path to the template
 * @param {string} previewPath Optional preview image path
 * @returns {Promise<TemplateData>} A promise that resolves when the template is loaded
 */
async function getModuleTemplate(path, previewPath = null) {
  try {
    /** @type {TemplateData} */
    const template = JSON.parse(await fetch(path).then((r) => r.text()));
    template.path = path;

    // Use provided preview path or construct from path
    if (previewPath) {
      template.preview = previewPath;
    } else {
      const templateFileNameWithoutExtension = path.split("/").pop().split(".")[0];
      template.preview = `${template.system}/${templateFileNameWithoutExtension}.jpg`;
    }

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
 * Load all the user-provided templates for modules from the GitHub repository
 * @returns {Promise<TemplateLoadResult>} Result object with status and templates
 */
export async function loadModuleTemplates() {
  /** @type {TemplateData[]} */
  const includedTemplates = [];

  // @ts-ignore
  const currentSystem = game.system.id;

  try {
    // Fetch the templates.yaml manifest
    const yamlResponse = await fetch(`${GITHUB_TEMPLATES_URL}/templates.yaml`);
    if (!yamlResponse.ok) {
      const errorMsg = `Failed to fetch template list: ${yamlResponse.status} ${yamlResponse.statusText}`;
      console.error(errorMsg);
      return {
        success: false,
        status: "error",
        templates: [],
        error: localizeOr(
          "fvtt-party-sheet.template-installer.connection-error",
          "Unable to connect to template repository ({status}). Please check your internet connection.",
          { status: yamlResponse.status },
        ),
      };
    }

    const yamlText = await yamlResponse.text();
    const templatesManifest = parseSimpleYaml(yamlText);

    // Load templates for the current system
    if (templatesManifest[currentSystem]) {
      let loadedCount = 0;
      let failedCount = 0;

      for (const templateInfo of templatesManifest[currentSystem]) {
        const templateUrl = `${TEMPLATES_BASE_URL}/${currentSystem}/${templateInfo.file}`;
        const previewUrl = templateUrl.replace(".json", ".jpg");

        const template = await getModuleTemplate(templateUrl, previewUrl);
        if (template) {
          includedTemplates.push(template);
          loadedCount++;
        } else {
          failedCount++;
        }
      }

      // Return success with appropriate message
      if (loadedCount > 0) {
        return {
          success: true,
          status: "loaded",
          templates: includedTemplates,
          error:
            failedCount > 0
              ? localizeOr("fvtt-party-sheet.template-installer.failed-count", "{count} template(s) failed to load.", {
                  count: failedCount,
                })
              : undefined,
        };
      } else {
        return {
          success: false,
          status: "empty",
          templates: [],
          error: localizeOr(
            "fvtt-party-sheet.template-installer.none-found",
            "No templates found for {system} in the repository.",
            { system: currentSystem },
          ),
        };
      }
    } else {
      return {
        success: false,
        status: "not-found",
        templates: [],
        error: localizeOr(
          "fvtt-party-sheet.template-installer.not-available",
          "No templates available for {system} in the repository yet. Consider contributing one!",
          { system: currentSystem },
        ),
      };
    }
  } catch (error) {
    const errorMsg = localizeOr("fvtt-party-sheet.template-installer.load-error", "Error loading templates: {error}", {
      error: error.message,
    });
    console.error("Error loading module templates from GitHub:", error);
    return {
      success: false,
      status: "error",
      templates: [],
      error: errorMsg,
    };
  }
}
