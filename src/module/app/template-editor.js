/* eslint-disable no-undef */

import { setPreviewMode, updatePreviewTemplate, validateTemplateJson, formatTemplateJson } from "../utils";

import * as templateSchema from "../../template.schema.json";

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
      onValidate: TemplateEditor.onValidate,
      onFormatJson: TemplateEditor.onFormatJson,
    },
  };

  static PARTS = {
    form: {
      template: "modules/fvtt-party-sheet/templates/template-editor.hbs",
    },
  };

  static formHandler(event, form, formData) {
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

    // Preview mode properties
    this.previewMode = false;
    this.partySheetInstance = options.partySheetInstance || null;
    this.previewUpdateDebounce = null;

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

  async close(options) {
    // Disable preview mode before closing
    await this._disablePreviewMode();

    // Properly dispose of Monaco Editor and its model
    if (this.monacoEditor) {
      const model = this.monacoEditor.getModel();
      if (model) {
        model.dispose();
      }
      this.monacoEditor.dispose();
      this.monacoEditor = null;
    }

    // Clear any pending timeouts
    if (this.previewUpdateDebounce) {
      clearTimeout(this.previewUpdateDebounce);
      this.previewUpdateDebounce = null;
    }

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

    // Setup preview mode
    await this._setupPreviewMode();
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

    // Check if a model with this URI already exists and dispose it
    // @ts-ignore
    const existingModel = window.monaco.editor.getModel(modelUri);
    if (existingModel) {
      existingModel.dispose();
    }

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
      this._updatePreviewDebounced();
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

  _loadMonacoEditor() {
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

  _configureJsonSchema() {
    try {
      // Embedded schema - avoids fetch issues in Foundry modules
      const schema = templateSchema;

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
    } catch (error) {
      console.warn("Failed to configure template schema for IntelliSense:", error);
    }
  }

  async _setupPreviewMode() {
    // Always enable preview mode when template editor is open
    this.previewMode = true;

    // If no current template, use the default template for preview
    let previewTemplate = this.currentTemplate;

    if (!previewTemplate) {
      try {
        const defaultTemplateJson = this._getInitialTemplate();
        previewTemplate = JSON.parse(defaultTemplateJson);
      } catch (error) {
        previewTemplate = null;
      }
    }

    setPreviewMode(true, previewTemplate);

    // Update all active party sheet instances if any exist
    const { PartySheetForm } = await import("./party-sheet.js");
    if (PartySheetForm._activeInstances && PartySheetForm._activeInstances.size > 0) {
      PartySheetForm.updateAllInstancesWithPreview(previewTemplate);
    }

    // Force an immediate preview update to ensure the default template is displayed
    if (!this.currentTemplate && this.monacoEditor) {
      // Small delay to ensure Monaco editor is fully initialized
      setTimeout(() => {
        this._updatePreview();
      }, 100);
    }
  }

  _updatePreviewDebounced() {
    // Clear existing timeout
    if (this.previewUpdateDebounce) {
      clearTimeout(this.previewUpdateDebounce);
    }

    // Set new timeout for debounced update
    this.previewUpdateDebounce = setTimeout(() => {
      this._updatePreview();
    }, 300); // 300ms debounce
  }

  async _updatePreview() {
    if (!this.previewMode || !this.monacoEditor) {
      return;
    }

    try {
      const jsonText = this.monacoEditor.getValue();
      const template = JSON.parse(jsonText);

      // Validate it's a proper template (has required fields)
      if (template.name && template.author && template.rows) {
        updatePreviewTemplate(template);

        // Update all active party sheet instances
        const { PartySheetForm } = await import("./party-sheet.js");
        PartySheetForm.updateAllInstancesWithPreview(template);
      }
    } catch (error) {
      // Invalid JSON - don't update preview
      console.debug("TemplateEditor: Invalid JSON, skipping preview update");
    }
  }

  async _disablePreviewMode() {
    if (this.previewMode) {
      this.previewMode = false;
      setPreviewMode(false);

      // Clear any pending updates
      if (this.previewUpdateDebounce) {
        clearTimeout(this.previewUpdateDebounce);
        this.previewUpdateDebounce = null;
      }

      // Restore all party sheet instances to original template
      const { PartySheetForm } = await import("./party-sheet.js");
      PartySheetForm.restoreAllInstances();
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
    // Get the active instance and call the method on it
    const instance = TemplateEditor._instance;
    if (instance) {
      instance.createNewTemplate();
    } else {
      console.error("TemplateEditor: No active instance found for new template operation");
    }
  }

  static onLoad(event, target) {
    event.preventDefault();
    // Get the active instance and trigger file input
    const instance = TemplateEditor._instance;
    if (instance && instance.element) {
      const fileInput = instance.element.querySelector("#template-file-input");
      if (fileInput) {
        fileInput.click();
      } else {
        console.error("TemplateEditor: File input not found");
      }
    } else {
      console.error("TemplateEditor: No active instance found for load operation");
    }
  }

  static onSave(event, target) {
    event.preventDefault();
    // Get the active instance and call the method on it
    const instance = TemplateEditor._instance;
    if (instance) {
      instance.copyToClipboard();
    } else {
      console.error("TemplateEditor: No active instance found for copy operation");
    }
  }

  static onValidate(event, target) {
    event.preventDefault();
    // Get the active instance and call the method on it
    const instance = TemplateEditor._instance;
    if (instance) {
      instance.validateTemplate();
    } else {
      console.error("TemplateEditor: No active instance found for validate operation");
    }
  }

  static onFormatJson(event, target) {
    event.preventDefault();
    // Get the active instance and call the method on it
    const instance = TemplateEditor._instance;
    if (instance) {
      instance.formatJson();
    } else {
      console.error("TemplateEditor: No active instance found for format operation");
    }
  }

  static onTest(event) {
    event.preventDefault();
    // @ts-ignore
    ui.notifications.info("Template Editor test button works!");
  }

  static onClose(event) {
    event.preventDefault();
    // Get the active instance and call the method on it
    const instance = TemplateEditor._instance;
    if (instance) {
      instance.close();
    } else {
      console.error("TemplateEditor: No active instance found for close operation");
    }
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

  async copyToClipboard() {
    if (!this.monacoEditor) {
      return;
    }

    try {
      const jsonText = this.monacoEditor.getValue();
      const template = JSON.parse(jsonText);

      console.log("TemplateEditor: Template parsed successfully", template.name);

      // Validate template before copying (don't show UI notifications, we'll handle that)
      const validationResult = this.validateTemplate(false);
      if (!validationResult.isValid) {
        // @ts-ignore
        ui.notifications.error(`Cannot copy template: ${validationResult.errors.join(", ")}`);
        return;
      }

      this.currentTemplate = template;
      this.isDirty = false;

      const jsonString = JSON.stringify(template, null, 2);

      // Try to copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonString);
        // @ts-ignore
        ui.notifications.info("Template copied to clipboard! Paste into a text file and save as .json");
      } else {
        // Fallback for older browsers
        this._showCopyDialog(jsonString, "template.json");
      }

      this._updateTitle();
    } catch (error) {
      console.error("TemplateEditor: Copy failed:", error);
      // @ts-ignore
      ui.notifications.error(`Failed to copy template: ${error.message}`);
    }
  }

  validateTemplate(showNotifications = true) {
    if (!this.monacoEditor) return { isValid: false, errors: ["No Monaco editor found"] };

    const jsonText = this.monacoEditor.getValue();
    const validationResult = validateTemplateJson(jsonText);

    // Show notifications only if requested (for manual validation button)
    if (showNotifications) {
      if (!validationResult.isValid) {
        // @ts-ignore
        ui.notifications.warn(`Template validation issues: ${validationResult.errors.join(", ")}`);
      } else {
        // @ts-ignore
        ui.notifications.info("Template JSON is valid!");
      }
    }

    return validationResult;
  }
  formatJson() {
    if (!this.monacoEditor) return;

    const jsonText = this.monacoEditor.getValue();
    const result = formatTemplateJson(jsonText);

    if (result.success) {
      this.monacoEditor.setValue(result.formatted);
      // @ts-ignore
      ui.notifications.info("JSON formatted successfully.");
    } else {
      // @ts-ignore
      ui.notifications.error(result.error);
    }
  }

  _showCopyDialog(jsonString, filename) {
    // @ts-ignore
    new Dialog(
      {
        title: "Copy Template JSON",
        content: `
        <div style="margin-bottom: 10px;">
          <p>Copy the JSON below and save it manually as <strong>${filename}</strong>:</p>
        </div>
        <textarea readonly style="width: 100%; height: 300px; font-family: monospace; font-size: 12px;">${jsonString}</textarea>
      `,
        buttons: {
          copy: {
            label: "Copy to Clipboard",
            callback: (html) => {
              const textarea = html.find("textarea")[0];
              textarea.select();
              document.execCommand("copy");
              // @ts-ignore
              ui.notifications.info("Template JSON copied to clipboard!");
            },
          },
          close: {
            label: "Close",
            callback: () => {},
          },
        },
        default: "copy",
      },
      {
        width: 600,
        height: 450,
      },
    ).render(true);
  }

  _promptForFilename() {
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
