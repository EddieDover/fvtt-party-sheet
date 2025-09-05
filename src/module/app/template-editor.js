/* eslint-disable no-undef */

import { getSymVersion } from "../utils";

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

  constructor(overrides) {
    super();
    this.overrides = overrides || {};

    // Initialize with current template if provided in overrides
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

  static getInstance(overrides) {
    // If an instance exists and is rendered, bring it to focus
    if (TemplateEditor._instance && TemplateEditor._instance.rendered) {
      TemplateEditor._instance.bringToTop();
      return TemplateEditor._instance;
    }
    // Otherwise create a new instance
    return new TemplateEditor(overrides);
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

  _onRender(context, options) {
    super._onRender(context, options);

    // Initialize Monaco Editor
    this._initializeMonacoEditor();

    // Set up file input handler
    this._setupFileInput();

    // Set up metadata field listeners
    this._setupMetadataFields();
  }

  async _initializeMonacoEditor() {
    const editorContainer = this.element.querySelector("#json-editor");
    if (!editorContainer) return;

    // Load Monaco Editor from CDN if not already loaded
    if (!window.monaco) {
      await this._loadMonacoEditor();
    }

    // Create the editor
    this.monacoEditor = window.monaco.editor.create(editorContainer, {
      value: this._getInitialTemplate(),
      language: "json",
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
    const nameInput = this.element.querySelector("#template-name");
    const authorInput = this.element.querySelector("#template-author");
    const systemInput = this.element.querySelector("#template-system");
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

      const nameInput = this.element.querySelector("#template-name");
      const authorInput = this.element.querySelector("#template-author");
      const systemInput = this.element.querySelector("#template-system");
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

      const nameInput = this.element.querySelector("#template-name");
      const authorInput = this.element.querySelector("#template-author");
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
      if (window.monaco) {
        resolve();
        return;
      }

      // Create script elements for Monaco Editor
      const loaderScript = document.createElement("script");
      loaderScript.src = "https://unpkg.com/monaco-editor@0.44.0/min/vs/loader.js";
      loaderScript.onload = () => {
        window.require.config({
          paths: {
            "vs": "https://unpkg.com/monaco-editor@0.44.0/min/vs",
          },
        });

        window.require(
          ["vs/editor/editor.main"],
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
    const fileInput = this.element.querySelector("#template-file-input");
    if (fileInput) {
      fileInput.addEventListener("change", (event) => {
        this.loadTemplateFromFile(event.target.files[0]);
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
      game.ui.notifications.info(`Template "${file.name}" loaded successfully.`);
    } catch (error) {
      game.ui.notifications.error(`Failed to load template: ${error.message}`);
    }
  }

  _updateTitle() {
    const title = `Template Editor${this.currentFilename ? ` - ${this.currentFilename}` : ""}${this.isDirty ? " *" : ""}`;
    // Update window title if possible
    if (this.options && this.options.window) {
      this.options.window.title = title;
    }
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
    game.ui.notifications.info("New template created.");
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
      ui.notifications.info(`Template saved as "${this.currentFilename}".`);
    } catch (error) {
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
      ui.notifications.info("JSON formatted successfully.");
    } catch (error) {
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
