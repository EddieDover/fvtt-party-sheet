/* eslint-disable no-undef */

import { getSymVersion } from "../utils";
import schemaResponse from "../../template.schema.json";

// @ts-ignore
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class TemplateEditor extends HandlebarsApplicationMixin(ApplicationV2) {
  static _instance = null;
  static DEFAULT_OPTIONS = {
    tag: "form",
    form: {
      handler: TemplateEditor.formHandler,
      submitOnChange: false,
      closeOnSubmit: false,
    },
    window: {
      title: "Template Editor",
      width: "auto",
      height: "auto",
      resizable: true,
    },
    classes: ["fvtt-party-sheet-template-editor"],
    actions: {
      onTest: TemplateEditor.onTest,
      onClose: TemplateEditor.onClose,
      onNew: TemplateEditor.onNew,
      onLoad: TemplateEditor.onLoad,
      onSave: TemplateEditor.onSave,
      onSaveAs: TemplateEditor.onSaveAs,
      onValidate: TemplateEditor.onValidate,
      onFormatJson: TemplateEditor.onFormatJson,
    },
  };

  static PARTS = {
    form: {
      template: "modules/fvtt-party-sheet/templates/template-editor.hbs",
    },
  };

  static async formHandler(event, form, formData) {
    event.preventDefault();
    event.stopPropagation();
    // Handle form submission logic here if needed
  }

  constructor(options = {}) {
    super(options);
    this.overrides = options || {};

    // Initialize with current template if provided in options
    this.currentTemplate = this.overrides.currentTemplate || null;

    // Set filename based on current template or default to new
    if (this.currentTemplate) {
      this.currentFilename = `${this.currentTemplate.name}-${this.currentTemplate.author}.json`;
    } else {
      this.currentFilename = "new-template.json";
    }

    this.isDirty = false;
    this.monacoEditor = null;
    // Store reference to this instance
    TemplateEditor._instance = this;
  }

  static getInstance(options) {
    // If an instance exists and is rendered, bring it to focus
    if (TemplateEditor._instance && TemplateEditor._instance.rendered) {
      TemplateEditor._instance.bringToTop();
      return TemplateEditor._instance;
    }
    // Otherwise create a new instance
    return new TemplateEditor(options);
  }

  close(options) {
    // Clear the static reference when closing
    if (TemplateEditor._instance === this) {
      TemplateEditor._instance = null;
    }
    return super.close(options);
  }

  _prepareContext(options) {
    let templateData = null;

    // If we have a template loaded, parse it for metadata
    if (this.currentTemplate) {
      templateData = this.currentTemplate;
    } else if (this.monacoEditor) {
      try {
        const jsonText = this.monacoEditor.getValue();
        templateData = JSON.parse(jsonText);
      } catch (error) {
        // If JSON is invalid, use default values
        templateData = null;
      }
    }

    return {
      overrides: this.overrides,
      currentTemplate: templateData,
      currentFilename: this.currentFilename || "new-template.json",
      isEditing: !!this.currentTemplate,
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    // Wait for the next tick to ensure the element is fully rendered
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Initialize Monaco Editor
    await this._initializeMonacoEditor();

    // Set up file input handler
    this._setupFileInput();

    // Set up metadata field listeners
    this._setupMetadataFields();
  }

  async _initializeMonacoEditor() {
    //@ts-ignore
    const editorContainer = this.element.querySelector("#json-editor");
    if (!editorContainer) {
      console.warn("TemplateEditor: JSON editor container not found");
      return;
    }

    // Load Monaco Editor from CDN if not already loaded
    // @ts-ignore
    if (!window.monaco) {
      await this._loadMonacoEditor();
    }

    // Configure JSON schema for IntelliSense
    await this._configureJsonSchema();

    // Create a model with a specific URI to match our schema
    // @ts-ignore
    const modelUri = window.monaco.Uri.parse("file:///template.json");
    // @ts-ignore
    const model = window.monaco.editor.createModel(this._getInitialTemplate(), "json", modelUri);

    // Create the editor with the model
    // @ts-ignore
    this.monacoEditor = window.monaco.editor.create(editorContainer, {
      model: model,
      theme: "vs-dark",
      automaticLayout: true,
      minimap: { enabled: false },
      wordWrap: "on",
      formatOnPaste: true,
      formatOnType: true,
      scrollBeyondLastLine: false,
      tabSize: 2,
      insertSpaces: true,
      folding: true,
      lineNumbers: "on",
      renderWhitespace: "boundary",
    });

    // Set up change listener
    this.monacoEditor.onDidChangeModelContent(() => {
      this.isDirty = true;
      this._updateTitle();
      this._updateMetadataFromJson();
    });

    // Initial sync after editor is created and content is set
    this._updateMetadataFromJson();
  }

  _setupMetadataFields() {
    //@ts-ignore
    const nameInput = this.element.querySelector("#template-name");
    //@ts-ignore
    const authorInput = this.element.querySelector("#template-author");
    //@ts-ignore
    const systemInput = this.element.querySelector("#template-system");
    //@ts-ignore
    const versionInput = this.element.querySelector("#template-version");

    // Set the system field to the current system and make it readonly
    if (systemInput) {
      // @ts-ignore
      systemInput.value = game.system.id;
      systemInput.readOnly = true;
    }

    // Set up change listeners for metadata fields (excluding system since it's readonly)
    if (nameInput) {
      nameInput.addEventListener("input", () => this._updateJsonFromMetadata());
    }
    if (authorInput) {
      authorInput.addEventListener("input", () => this._updateJsonFromMetadata());
    }
    if (versionInput) {
      versionInput.addEventListener("input", () => this._updateJsonFromMetadata());
    }

    // Note: Initial sync is now handled in _initializeMonacoEditor()
  }

  _updateMetadataFromJson() {
    if (!this.monacoEditor) return;

    try {
      const jsonText = this.monacoEditor.getValue();
      const template = JSON.parse(jsonText);

      //@ts-ignore
      const nameInput = this.element.querySelector("#template-name");
      //@ts-ignore
      const authorInput = this.element.querySelector("#template-author");
      //@ts-ignore
      const systemInput = this.element.querySelector("#template-system");
      //@ts-ignore
      const versionInput = this.element.querySelector("#template-version");

      if (nameInput) nameInput.value = template.name || "";
      if (authorInput) authorInput.value = template.author || "";
      if (systemInput) systemInput.value = template.system || "";
      if (versionInput) versionInput.value = template.version || "";
    } catch (error) {
      // Ignore JSON parse errors - they'll be caught by validation
    }
  }

  _updateJsonFromMetadata() {
    if (!this.monacoEditor) return;

    try {
      const jsonText = this.monacoEditor.getValue();
      const template = JSON.parse(jsonText);

      //@ts-ignore
      const nameInput = this.element.querySelector("#template-name");
      //@ts-ignore
      const authorInput = this.element.querySelector("#template-author");
      //@ts-ignore
      const versionInput = this.element.querySelector("#template-version");

      // Update template object with form values
      if (nameInput) template.name = nameInput.value;
      if (authorInput) template.author = authorInput.value;
      if (versionInput) template.version = versionInput.value;

      // Always set system to current game system
      // @ts-ignore
      template.system = game.system.id;

      // Update Monaco editor without triggering change event
      const newJsonText = JSON.stringify(template, null, 2);

      // Temporarily disable change listener to prevent infinite loop
      const currentValue = this.monacoEditor.getValue();
      if (currentValue !== newJsonText) {
        this.monacoEditor.setValue(newJsonText);
      }
    } catch (error) {
      // Ignore JSON parse errors - they'll be caught by validation
    }
  }

  async _loadMonacoEditor() {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      if (window.monaco) {
        resolve();
        return;
      }

      // Create script elements for Monaco Editor
      const loaderScript = document.createElement("script");
      loaderScript.src = "https://unpkg.com/monaco-editor@0.44.0/min/vs/loader.js";
      loaderScript.onload = () => {
        // @ts-ignore
        window.require.config({
          paths: {
            "vs": "https://unpkg.com/monaco-editor@0.44.0/min/vs",
          },
        });

        window.require(
          ["vs/editor/editor.main"],
          // @ts-ignore
          () => {
            resolve();
          },
          reject,
        );
      };
      loaderScript.onerror = reject;

      document.head.appendChild(loaderScript);
    });
  }

  async _configureJsonSchema() {
    try {
      // Embedded schema - avoids fetch issues in Foundry modules
      const schema = {
        "title": "FVTT Party Sheet Template",
        "description": "Schema for creating and managing party sheet templates.",
        "type": "object",
        "required": ["name", "system", "author", "version", "minimumSystemVersion", "rows"],
        "properties": {
          "name": {
            "description": "Name that will be displayed in the party sheet for this template.",
            "type": "string",
          },
          "system": {
            "description": "The system that this template is associated with.",
            "type": "string",
          },
          "author": {
            "description": "The author of the template. Will be shown along the name of the template.",
            "type": "string",
          },
          "offline_excludes_property": {
            "description": "The actor property to do the filtering for (exclude).",
            "type": "string",
            "default": "actor.type",
          },
          "offline_excludes": {
            "description": "List of values to exclude from the template. Based on the offline_excludes_property.",
            "type": "array",
            "items": {
              "type": "string",
            },
            "default": ["npc"],
          },
          "offline_includes_property": {
            "description":
              "The actor property to do the filtering for (include). If declared both offline_excludes and offline_excludes_property, will be ignored.",
            "type": "string",
          },
          "offline_includes": {
            "description": "List of values to include in the template. Based on the offline_includes_property.",
            "type": "array",
            "items": {
              "type": "string",
            },
          },
          "version": {
            "description": "The version of the template",
            "type": "string",
          },
          "minimumSystemVersion": {
            "description": "The minimum version of the required system",
            "type": "string",
          },
          "maximumSystemVersion": {
            "description": "The maximum version of the required system",
            "type": "string",
          },
          "rows": {
            "description":
              "The rows of the template. Keep in mind that automatically a row is created per character, this is more for data display.",
            "type": "array",
            "items": {
              "description": "Specific row.",
              "type": "array",
              "items": {
                "description": "The data for a row to display.",
                "type": "object",
                "required": ["name", "type", "header", "text"],
                "properties": {
                  "name": {
                    "description": "The name of the row and also the header to display.",
                    "type": "string",
                  },
                  "type": {
                    "description":
                      "The type of the row. Each type is parsed in an specific way. You can set an empty string to treat the column as an spacer.",
                    "type": "string",
                    "enum": [
                      "direct",
                      "direct-complex",
                      "string",
                      "array-string-builder",
                      "largest-from-array",
                      "smallest-from-array",
                      "object-loop",
                      "charactersheet",
                      "span",
                      "",
                    ],
                  },
                  "header": {
                    "description": "Whether to show, hide, or skip the column header.",
                    "type": "string",
                    "enum": ["show", "hide", "skip"],
                  },
                  "maxwidth": {
                    "description": "The maximum width in pixels of the row.",
                    "type": "number",
                  },
                  "minwidth": {
                    "description": "The minimum width in pixels of the row.",
                    "type": "number",
                  },
                  "align": {
                    "description": "Horizontal alignment of the cells.",
                    "type": "string",
                    "enum": ["left", "center", "right"],
                  },
                  "valign": {
                    "description": "Vertical alignment of the cells.",
                    "type": "string",
                    "enum": ["top", "bottom"],
                  },
                  "showSign": {
                    "description": "Displays a '+' symbol if the value is above zero.",
                    "type": "boolean",
                  },
                  "rowspan": {
                    "description":
                      "Controls the row span of the cells in the column. You need also the corresponding empty rows and type 'span'.",
                    "type": "number",
                  },
                  "colspan": {
                    "description": "Controls the column span of the cells in the column.",
                    "type": "number",
                  },
                  "showTotal": {
                    "description": "Shows a total sum for this column in a footer row if values are numeric.",
                    "type": "boolean",
                  },
                  "text": {
                    "description": "Complex property that will be parsed based on the type.",
                  },
                },
                "if": {
                  "properties": {
                    "type": {
                      "const": "direct-complex",
                    },
                  },
                },
                "then": {
                  "properties": {
                    "text": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "required": ["type", "text"],
                        "properties": {
                          "type": {
                            "description": "The type of object.",
                            "type": "string",
                            "enum": ["exists", "match", "match-all"],
                          },
                          "text": {
                            "description": "The text that will be displayed if the type passes the check.",
                            "type": "string",
                          },
                          "else": {
                            "description": "The text that will be displayed if the type fails the check.",
                            "type": "string",
                          },
                        },
                        "allOf": [
                          {
                            "if": {
                              "properties": {
                                "type": {
                                  "const": "exists",
                                },
                              },
                            },
                            "then": {
                              "properties": {
                                "value": {
                                  "description": "The value that you are checking against.",
                                  "type": "string",
                                },
                              },
                              "required": ["value"],
                            },
                          },
                          {
                            "if": {
                              "properties": {
                                "type": {
                                  "enum": ["match", "match-all"],
                                },
                              },
                            },
                            "then": {
                              "properties": {
                                "ifdata": {
                                  "description": "The data that will be used to validate the check on if.",
                                  "type": "string",
                                },
                                "matches": {
                                  "description": "The value that ifdata needs to match with.",
                                  "type": ["string", "number", "boolean"],
                                },
                              },
                              "required": ["ifdata", "matches"],
                            },
                          },
                        ],
                      },
                    },
                  },
                },
                "else": {
                  "properties": {
                    "text": {
                      "type": ["string", "boolean", "number"],
                    },
                  },
                },
              },
            },
          },
        },
      };

      console.log("TemplateEditor: Schema loaded successfully", schema);

      // Configure Monaco's JSON language service with the schema
      // @ts-ignore
      window.monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: false,
        schemas: [
          {
            uri: "http://fvtt-party-sheet/template.schema.json",
            fileMatch: ["file:///template.json", "*.json"], // Match our specific file and any json
            schema: schema,
          },
        ],
        enableSchemaRequest: true,
        schemaRequest: "warning",
        schemaValidation: "warning",
        comments: "error",
        trailingCommas: "error",
      });

      // Also set completion options for better IntelliSense
      // @ts-ignore
      window.monaco.languages.json.jsonDefaults.setModeConfiguration({
        documentFormattingEdits: true,
        documentRangeFormattingEdits: true,
        completionItems: true,
        hovers: true,
        documentSymbols: true,
        tokens: true,
        colors: true,
        foldingRanges: true,
        diagnostics: true,
        selectionRanges: true,
      });

      console.log("TemplateEditor: Schema configuration applied successfully");
    } catch (error) {
      console.warn("Failed to configure template schema for IntelliSense:", error);
    }
  }

  _getInitialTemplate() {
    if (this.currentTemplate) {
      return JSON.stringify(this.currentTemplate, null, 2);
    }

    // Return a starter template with current system
    return JSON.stringify(
      {
        "name": "New Template",
        // @ts-ignore
        "system": game.system.id,
        "author": "Template Author",
        "version": "1.0.0",
        "minimumSystemVersion": "1.0.0",
        "offline_excludes": ["npc"],
        "rows": [
          [
            {
              "name": "Character Sheet",
              "type": "charactersheet",
              "header": "hide",
              "text": "",
            },
            {
              "name": "Name",
              "type": "direct",
              "header": "show",
              "text": "{name}",
              "align": "center",
            },
            {
              "name": "Level",
              "type": "direct",
              "header": "show",
              "text": "Level {system.details.level}",
              "align": "center",
            },
          ],
        ],
      },
      null,
      2,
    );
  }

  _setupFileInput() {
    //@ts-ignore
    const fileInput = this.element.querySelector("#template-file-input");
    if (fileInput) {
      fileInput.addEventListener("change", (event) => {
        //@ts-ignore
        const target = event.target;
        if (target.files) {
          this.loadTemplateFromFile(target.files[0]);
        }
      });
    }
  }

  async loadTemplateFromFile(file) {
    if (!file) return;

    try {
      const text = await file.text();
      const template = JSON.parse(text);

      this.currentTemplate = template;
      this.currentFilename = file.name;
      this.isDirty = false;

      if (this.monacoEditor) {
        this.monacoEditor.setValue(JSON.stringify(template, null, 2));
      }

      // Update metadata fields
      this._updateMetadataFromJson();

      this._updateTitle();
      // @ts-ignore
      ui.notifications.info(`Template "${file.name}" loaded successfully.`);
    } catch (error) {
      // @ts-ignore
      ui.notifications.error(`Failed to load template: ${error.message}`);
    }
  }

  _updateTitle() {
    const title = `Template Editor${this.currentFilename ? ` - ${this.currentFilename}` : ""}${this.isDirty ? " *" : ""}`;
    // Note: Window title updates are handled by Foundry's ApplicationV2
    // The title from DEFAULT_OPTIONS.window.title will be used
  }

  // Static action handlers
  static onNew(event, target) {
    event.preventDefault();
    console.log("Template Editor: New template");
    // @ts-ignore
    this.createNewTemplate();
  }

  static onLoad(event, target) {
    event.preventDefault();
    console.log("Template Editor: Load template");
    // @ts-ignore
    const fileInput = this.element.querySelector("#template-file-input");
    if (fileInput) {
      fileInput.click();
    }
  }

  static onSave(event, target) {
    event.preventDefault();
    console.log("Template Editor: Save template");
    // @ts-ignore
    this.saveTemplate();
  }

  static onSaveAs(event, target) {
    event.preventDefault();
    console.log("Template Editor: Save template as");
    // @ts-ignore
    this.saveTemplateAs();
  }

  static onValidate(event, target) {
    event.preventDefault();
    console.log("Template Editor: Validate JSON");
    // @ts-ignore
    this.validateTemplate();
  }

  static onFormatJson(event, target) {
    event.preventDefault();
    console.log("Template Editor: Format JSON");
    // @ts-ignore
    this.formatJson();
  }

  static onTest(event) {
    event.preventDefault();
    // @ts-ignore
    ui.notifications.info("Template Editor test button works!");
  }

  static onClose(event) {
    event.preventDefault();
    // @ts-ignore
    this.close();
  }

  // Instance methods for template operations
  createNewTemplate() {
    this.currentTemplate = null;
    this.currentFilename = "new-template.json";
    this.isDirty = false;

    if (this.monacoEditor) {
      this.monacoEditor.setValue(this._getInitialTemplate());
    }

    // Update metadata fields
    this._updateMetadataFromJson();

    this._updateTitle();
    // @ts-ignore
    ui.notifications.info("New template created.");
  }

  async saveTemplate() {
    if (!this.monacoEditor) return;

    try {
      const jsonText = this.monacoEditor.getValue();
      const template = JSON.parse(jsonText);

      // Validate template has required fields
      if (!template.name) {
        throw new Error("Template must have a 'name' field");
      }

      this.currentTemplate = template;
      this.isDirty = false;

      // Download the file
      this._downloadTemplate(template, this.currentFilename);

      this._updateTitle();
      // @ts-ignore
      ui.notifications.info(`Template saved as "${this.currentFilename}".`);
    } catch (error) {
      // @ts-ignore
      ui.notifications.error(`Failed to save template: ${error.message}`);
    }
  }

  async saveTemplateAs() {
    if (!this.monacoEditor) return;

    // Create a simple dialog to get the filename
    const filename = await this._promptForFilename();
    if (!filename) return;

    this.currentFilename = filename.endsWith(".json") ? filename : `${filename}.json`;
    await this.saveTemplate();
  }

  validateTemplate(template) {
    if (!this.monacoEditor) return;

    try {
      const jsonText = this.monacoEditor.getValue();
      const template = JSON.parse(jsonText);
      // Basic template validation
      const errors = [];
      if (!template.name) errors.push("Missing 'name' field");
      if (!template.rows || !Array.isArray(template.rows)) errors.push("Missing or invalid 'rows' field");

      if (!getSymVersion(template.version)) errors.push("Invalid template version. Must be in format 'x.y.z'");

      if (errors.length > 0) {
        // @ts-ignore
        ui.notifications.warn(`Template validation warnings: ${errors.join(", ")}`);
      } else {
        // @ts-ignore
        ui.notifications.info("Template JSON is valid!");
      }
    } catch (error) {
      // @ts-ignore
      ui.notifications.error(`Invalid JSON: ${error.message}`);
    }
  }

  formatJson() {
    if (!this.monacoEditor) return;

    try {
      const jsonText = this.monacoEditor.getValue();
      const template = JSON.parse(jsonText);
      const formatted = JSON.stringify(template, null, 2);

      this.monacoEditor.setValue(formatted);
      // @ts-ignore
      ui.notifications.info("JSON formatted successfully.");
    } catch (error) {
      // @ts-ignore
      ui.notifications.error(`Cannot format invalid JSON: ${error.message}`);
    }
  }

  _downloadTemplate(template, filename) {
    const jsonString = JSON.stringify(template, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async _promptForFilename() {
    return new Promise((resolve) => {
      // @ts-ignore
      new Dialog({
        title: "Save Template As",
        content: `
          <form>
            <div class="form-group">
              <label>Filename:</label>
              <input type="text" name="filename" value="${this.currentFilename.replace(".json", "")}" />
            </div>
          </form>
        `,
        buttons: {
          save: {
            label: "Save",
            callback: (html) => {
              const filename = html.find('[name="filename"]').val();
              resolve(filename);
            },
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null),
          },
        },
        default: "save",
      }).render(true);
    });
  }
}
