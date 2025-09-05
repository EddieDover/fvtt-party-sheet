/* eslint-disable no-undef */
import {
  addSign,
  compareSymVer,
  extractPropertyByString,
  getCustomTemplates,
  getModuleTemplates,
  getSelectedTemplate,
  log,
  TemplateProcessError,
  updateSelectedTemplate,
} from "../utils.js";
import { HiddenCharactersSettings } from "./hidden-characters-settings.js";
import { ParserFactory } from "../parsing/parser-factory.js";
import { TemplateEditor } from "./template-editor.js";
// @ts-ignore
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const FEEDBACK_URL = "https://github.com/EddieDover/fvtt-party-sheet/issues/new/choose";
const BUGREPORT_URL =
  "https://github.com/EddieDover/fvtt-party-sheet/issues/new?assignees=EddieDover&labels=bug&projects=&template=bug_report.yml&title=%5BBug%5D%3A+";
const DISCORD_URL = "https://discord.gg/mvMdc7bH2d";

const DEFAULT_EXCLUDES = ["npc"];

export class PartySheetForm extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    form: {
      handler: PartySheetForm.formHandler,
      submitOnChange: false,
      closeOnSubmit: false,
    },
    window: {
      title: "fvtt-party-sheet.section-title",
      width: "auto",
      height: "auto",
    },
    classes: ["fvtt-party-sheet"],
    actions: {
      onOpenOptions: PartySheetForm.onOpenOptions,
      onCloseWindow: PartySheetForm.onCloseWindow,
      onOpenActorSheet: PartySheetForm.onOpenActorSheet,
      onFeedback: PartySheetForm.onFeedback,
      onBugReport: PartySheetForm.onBugReport,
      onDiscord: PartySheetForm.onDiscord,
      onInstaller: PartySheetForm.onInstaller,
      onOpenEditor: PartySheetForm.onOpenEditor,
    },
  };

  static PARTS = {
    form: {
      template: "modules/fvtt-party-sheet/templates/party-sheet.hbs",
    },
  };

  static async formHandler(event, form, formData) {
    event.preventDefault();
    event.stopPropagation();

    // Handle form submission logic here
    // For example, you can process the formData and update the application state
    // console.log("Form submitted with data:", formData);

    // Optionally, you can close the form after submission
    // this.close();
  }

  constructor(options = {}, postInstallCallback = async () => {}) {
    super();
    this._postInstallCallback = postInstallCallback;
    this.savedOptions = undefined;
    this.showInstaller = options.showInstaller ?? false;
    this.refreshTimer = null;
    this.dropdownStates = new Map(); // Store dropdown selection states
    this.isDropdownInteracting = false; // Track if user is interacting with dropdowns

    // If the form is being opened directly with installer, set the opening flag
    if (this.showInstaller) {
      this._openingInstaller = true;
    }

    this.parserEngine = ParserFactory.createParserEngine();
    // Set this instance as the dropdown states provider for the parser engine
    this.parserEngine.setDropdownStatesProvider(this);
  }

  /**
   * Get the custom player data.
   * @param { TemplateData } data - The template data
   * @returns { CustomPlayerData } The custom player data
   * @memberof PartySheetForm
   */

  getCustomPlayerData(data) {
    //@ts-ignore
    const showDebugOutput = game.settings.get("fvtt-party-sheet", "showDebugInfo");
    const excludeTypes = data?.offline_excludes ? data.offline_excludes : DEFAULT_EXCLUDES;

    if (!data) {
      return { name: "", author: "", players: [], rowcount: 0 };
    }

    // @ts-ignore
    const showOnlyOnlineUsers = game.settings.get("fvtt-party-sheet", "enableOnlyOnline");
    // @ts-ignore
    const hiddenCharacters = game.settings.get("fvtt-party-sheet", "hiddenCharacters");

    if (showDebugOutput) {
      console.log("======= FVTT-PARTY-SHEET DEBUG ACTORS LIST ======= ");
      console.log(
        "These are all the actors in your game. They have not yet been filtered based on your inclusions/exclusions.",
      );
    }

    let actorList = showOnlyOnlineUsers
      ? // @ts-ignore
        game.users.filter((user) => user.active && user.character).map((user) => user.character)
      : // @ts-ignore
        game.actors.filter((actor) => {
          // @ts-ignore
          if (game.settings.get("fvtt-party-sheet", "showDebugInfo")) {
            console.log(actor);
          }
          if (data.offline_includes_property && data.offline_includes) {
            const propval = extractPropertyByString(actor, data.offline_includes_property);
            return data.offline_includes.includes(propval);
          } else if (excludeTypes) {
            let incpropval = actor.type;
            if (data.offline_excludes_property) {
              incpropval = extractPropertyByString(actor, data.offline_excludes_property);
            }
            return !excludeTypes.includes(incpropval);
          }
        });

    if (showDebugOutput) {
      console.log("====================================== ");
    }

    if (!showOnlyOnlineUsers) {
      actorList = actorList.filter((player) => !hiddenCharacters.includes(player.uuid));
    }

    try {
      if (showDebugOutput) {
        console.log("======= FVTT-PARTY-SHEET DEBUG CHARACTER LIST ======= ");
        console.log("These are all the actors your party sheet will display.");
      }
      const finalActorList = actorList
        .map((character) => {
          const userChar = character;

          // @ts-ignore
          if (game.settings.get("fvtt-party-sheet", "showDebugInfo")) {
            console.log(userChar);
          }

          let row_data = [];

          data.rows.forEach((row_obj) => {
            let customData = {};

            row_obj.forEach((colobj) => {
              const colname = colobj.name;
              customData[colname] = {
                text: this.getCustomData(userChar, colobj.type, colobj.text, { showSign: colobj.showSign }),
                options: {
                  align: colobj.align,
                  valign: colobj.valign,
                  colspan: colobj.colspan,
                  rowspan: colobj.rowspan,
                  spanover: colobj.type === "span",
                  maxwidth: colobj.maxwidth,
                  minwidth: colobj.minwidth,
                  header: colobj.header,
                  showTotal: colobj.showTotal,
                },
              };
            });
            row_data.push(customData);
          });

          return row_data;
        })
        .filter((player) => player);
      if (showDebugOutput) {
        console.log("========================================= ");
      }
      return { name: data.name, author: data.author, players: finalActorList, rowcount: data.rows.length };
    } catch (ex) {
      // Detect if this is a TemplateProcessError or not
      if (ex instanceof TemplateProcessError) {
        ex.data.name = data.name;
        ex.data.author = data.author;
        throw ex;
      } else {
        console.log(ex);
      }
    }
    return { name: "", author: "", players: [], rowcount: 0 };
  }

  /**
   * Get the custom data for a character.
   * @param {*} character - The character to get the data for
   * @param {*} type - The type of data to get
   * @param {*} value - The value to get
   * @param {{}} options - The options for the data
   * @returns {string} The text to render
   * @memberof PartySheetForm
   */
  getCustomData(character, type, value, options = {}) {
    try {
      if (this.parserEngine.hasProcessor(type)) {
        return this.parserEngine.process(character, type, value, options);
      }

      // Fallback for any unregistered types
      console.warn(`No processor registered for type: ${type}. Returning empty string.`);
      return "";
    } catch (ex) {
      console.log(ex);
      throw new TemplateProcessError(ex);
    }
  }

  // eslint-disable-next-line no-unused-vars
  // @ts-ignore
  _updateObject(event, formData) {
    // Don't delete this function or FoundryVTT complains...
  }

  updateSelectedTemplateIndex(applicableTemplates) {
    // @ts-ignore

    let selectedIdx = getSelectedTemplate()
      ? applicableTemplates.findIndex(
          (data) => data.name === getSelectedTemplate().name && data.author === getSelectedTemplate().author,
        )
      : 0;

    updateSelectedTemplate(applicableTemplates[selectedIdx]);
    return getSelectedTemplate();
  }

  // @ts-ignore
  _prepareContext(options, b, c) {
    // Reset dropdown counters at the beginning of each render cycle
    if (this.parserEngine && this.parserEngine.resetDropdownCounters) {
      this.parserEngine.resetDropdownCounters();
    }

    if (options) {
      this.savedOptions = options;
    } else if (this.savedOptions) {
      options = this.savedOptions;
    }

    // @ts-ignore
    const minimalView = game.settings.get("fvtt-party-sheet", "enableMinimalView");
    // @ts-ignore
    const hiddenCharacters = game.settings.get("fvtt-party-sheet", "hiddenCharacters");
    // @ts-ignore
    const enableOnlyOnline = game.settings.get("fvtt-party-sheet", "enableOnlyOnline");

    const customTemplates = getCustomTemplates();
    const applicableTemplates = customTemplates.filter((data) => {
      // @ts-ignore
      const systemMatch = data.system === game.system.id;
      // @ts-ignore
      const minVersionOk = compareSymVer(data.minimumSystemVersion, game.system.version) <= 0;
      // @ts-ignore
      const maxVersionOk =
        // @ts-ignore
        !data.maximumSystemVersion || compareSymVer(game.system.version, data.maximumSystemVersion) <= 0;

      if (systemMatch && !maxVersionOk) {
        // @ts-ignore
        log(
          // @ts-ignore
          `Template "${data.name}" by ${data.author} filtered out: Current system v${game.system.version} exceeds maximum v${data.maximumSystemVersion}`,
        );
      }

      return systemMatch && minVersionOk && maxVersionOk;
    });
    const selectedTemplate = this.updateSelectedTemplateIndex(applicableTemplates);

    let selectedName, selectedAuthor, players, rowcount;
    let invalidTemplateError = false;
    try {
      let result = this.getCustomPlayerData(selectedTemplate);
      selectedName = result.name;
      selectedAuthor = result.author;
      players = result.players;
      rowcount = result.rowcount;
    } catch (ex) {
      if (ex instanceof TemplateProcessError) {
        // @ts-ignore
        ui.notifications.error(
          `There was an error processing the template for ${selectedTemplate.name} by ${selectedTemplate.author}.`,
        );
        selectedName = ex.data.name;
        selectedAuthor = ex.data.author;
        invalidTemplateError = true;
      } else {
        console.log(ex);
      }
    }

    const doShowInstaller = this.showInstaller;

    // Only reset showInstaller on user-initiated actions, not auto-refresh
    // Exception: Don't reset if we're opening the installer
    if (this._isUserAction && !this._openingInstaller) {
      this.showInstaller = false;
    }

    // Clean up the flags
    this._isUserAction = undefined;
    this._openingInstaller = undefined;

    /** @typedef {TemplateData & {installedVersion?:string, installed:boolean}} InstalledTemplateData */
    /** @type {InstalledTemplateData[]} */
    // @ts-ignore
    let moduleSystemTemplates = getModuleTemplates().filter((template) => template.system === game.system.id);

    moduleSystemTemplates.forEach((template) => {
      const foundTemplate = customTemplates.find(
        (data) => data.name === template.name && data.author === template.author,
      );
      if (foundTemplate) {
        template.installedVersion = foundTemplate.version || "";
        template.installed = true;
      } else {
        template.installed = false;
      }
    });

    // @ts-ignore
    const payload = {
      minimalView,
      hiddenCharacters,
      enableOnlyOnline,
      rowcount,
      players,
      applicableTemplates,
      // @ts-ignore
      moduleSystemTemplates,
      selectedName,
      selectedAuthor,
      invalidTemplateError,
      showInstaller: doShowInstaller,
      // @ts-ignore
      currentSystemVersion: game.system.version,
      // @ts-ignore
      overrides: this.overrides,
    };

    return payload;
  }

  /**
   * Render the sheet
   * @memberof PartySheetForm
   * @param {boolean} [force] - Whether to force re-rendering the form.
   * @param {boolean} [focus] - Whether to focus the form after rendering.
   */
  doRender(force = false, focus = false) {
    // Set a flag to indicate if this is a user-initiated action (force=true) or auto-refresh (force=false)
    this._isUserAction = force;

    // @ts-ignore
    this.render({
      force,
      focus,
    });

    // If installer is showing, ensure adequate window width after render
    if (this.showInstaller) {
      setTimeout(() => {
        this._ensureInstallerWidth();
      }, 50);
    }
  }

  /**
   * Ensures adequate width for installer layout
   * @memberof PartySheetForm
   */
  _ensureInstallerWidth() {
    // @ts-ignore
    if (!this.rendered || !this.showInstaller) return;

    try {
      // @ts-ignore - Access current position
      const currentPos = this.position;
      const minRequiredWidth = 700; // Minimum width needed for row layout

      if (currentPos.width < minRequiredWidth) {
        // @ts-ignore - FormApplication has setPosition method
        this.setPosition({
          width: minRequiredWidth,
        });
      }
    } catch (error) {
      // Silently ignore width adjustment errors
    }
  }

  /**
   * Start the refresh timer for periodic updates
   * @memberof PartySheetForm
   */
  startRefreshTimer() {
    // Clear any existing timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Save the current state of all dropdowns
   * @memberof PartySheetForm
   */
  saveDropdownStates(html) {
    // @ts-ignore
    if (!html && this.element) html = this.element;
    if (!html) return;

    // @ts-ignore
    const dropdowns = html.find('select[class="fvtt-party-sheet-dropdown"]');

    dropdowns.each((index, dropdown) => {
      // @ts-ignore
      const $dropdown = $(dropdown);
      const section = $dropdown.data("dropdownsection");
      const value = $dropdown.val();

      if (section && value !== undefined && value !== null && value !== "") {
        console.log(`fvtt-party-sheet | Saving dropdown state: ${section} = ${value}`);
        this.dropdownStates.set(section, value);
      }
    });
  }

  /**
   * Restore the saved state of all dropdowns
   * @memberof PartySheetForm
   */
  restoreDropdownStates(html) {
    // @ts-ignore
    if (!html && this.element) html = this.element;
    if (!html) return;

    // @ts-ignore
    const dropdowns = html.find('select[class="fvtt-party-sheet-dropdown"]');

    dropdowns.each((index, dropdown) => {
      // @ts-ignore
      const $dropdown = $(dropdown);
      const section = $dropdown.data("dropdownsection");

      if (section && this.dropdownStates.has(section)) {
        const savedValue = this.dropdownStates.get(section);

        // Check all available options
        const availableOptions = [];
        $dropdown.find("option").each((i, option) => {
          // @ts-ignore
          availableOptions.push($(option).val());
        });

        // Only restore if the saved value exists as an option
        if ($dropdown.find(`option[value="${savedValue}"]`).length > 0) {
          $dropdown.val(savedValue);

          // Manually trigger the UI update without triggering interaction tracking
          const dropdownSection = section;
          const dropdownValue = savedValue;

          // @ts-ignore
          $(`div[data-dropdownsection="${dropdownSection}"]`).hide();
          // @ts-ignore
          $(`div[data-dropdownsection="${dropdownSection}"][data-dropdownoption="${dropdownValue}"]`).show();
        }
      }
    });
  }

  /**
   * Check if the user is currently interacting with dropdowns
   * @returns {boolean}
   * @memberof PartySheetForm
   */
  isUserInteractingWithDropdowns() {
    return this.isDropdownInteracting;
  }

  /**
   * Ensure dropdown select elements have the correct values set
   * @memberof PartySheetForm
   */
  ensureDropdownSelectValues(html) {
    // @ts-ignore
    if (!html && this.element) html = this.element;
    if (!html) return;

    // @ts-ignore
    const dropdowns = html.find('select[class="fvtt-party-sheet-dropdown"]');

    dropdowns.each((index, dropdown) => {
      // @ts-ignore
      const $dropdown = $(dropdown);
      const section = $dropdown.data("dropdownsection");

      if (section && this.dropdownStates.has(section)) {
        const savedValue = this.dropdownStates.get(section);

        // Only set the select value if it differs from current value and the option exists
        if ($dropdown.val() !== savedValue && $dropdown.find(`option[value="${savedValue}"]`).length > 0) {
          $dropdown.val(savedValue);
        }
      }
    });
  }

  /**
   * Override close method to ensure timer cleanup
   * @returns {Promise<void>}
   * @memberof PartySheetForm
   */
  async close() {
    // Clear the refresh timer when closing
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    return super.close();
  }

  static onOpenOptions(event) {
    event.preventDefault();
    const overrides = {
      onexit: () => {
        setTimeout(() => {
          this.doRender(true, false);
        }, 350);
      },
    };
    const hcs = HiddenCharactersSettings.getInstance(overrides);
    // @ts-ignore
    hcs.render(true);
  }

  static onOpenEditor(event) {
    event.preventDefault();
    const currentTemplate = getSelectedTemplate();
    const overrides = {
      onexit: () => {
        setTimeout(() => {
          this.doRender(true, false);
        }, 350);
      },
      currentTemplate: currentTemplate,
    };
    const te = TemplateEditor.getInstance(overrides);
    // @ts-ignore
    te.render(true);
  }

  static onCloseWindow() {
    // Clear the refresh timer when closing the window
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.close();
  }

  static onOpenActorSheet(event) {
    event.preventDefault();
    const actorId = event.currentTarget.dataset.actorid;
    // @ts-ignore
    const actor = game.actors.get(actorId.replace("Actor.", ""));
    actor.sheet.render(true);
  }

  static onChangeSystem(event) {
    const namedata = event.currentTarget.value.split("___");
    const selectedSystemName = namedata[0];
    const selectedSystemAuthor = namedata[1];
    const selectedIndex =
      getCustomTemplates().findIndex(
        (data) => data.name === selectedSystemName && data.author === selectedSystemAuthor,
      ) ?? -1;
    if (selectedIndex != -1) {
      updateSelectedTemplate(getCustomTemplates()[selectedIndex]);
    }

    // User made a template selection, they're done interacting
    // Small delay to allow the selection to complete
    setTimeout(() => {
      this.isDropdownInteracting = false;
    }, 50);

    this.doRender(true, false);
  }

  _onRender(context, options) {
    super._onRender(context, options);

    // Start the refresh timer for periodic updates
    this.startRefreshTimer();
    const sheetSelectDropdown = document.querySelector('select[name="fvtt-party-sheet-system"]');

    sheetSelectDropdown?.addEventListener("change", PartySheetForm.onChangeSystem.bind(this));
    sheetSelectDropdown?.addEventListener("blur", (event) => {
      // Template selector lost focus without selection (clicked elsewhere)
      setTimeout(() => {
        this.isDropdownInteracting = false;
      }, 50);
    });
    sheetSelectDropdown?.addEventListener("mousedown", (event) => {
      // User is starting to interact with template dropdown (opening it)
      console.log("fvtt-party-sheet | Template selector interaction started");
      this.isDropdownInteracting = true;
    });

    document.querySelector('select[name="fvtt-party-sheet-system"]').addEventListener("mousedown", (event) => {
      // User is starting to interact with template dropdown (opening it)
      console.log("fvtt-party-sheet | Template selector interaction started");
      this.isDropdownInteracting = true;
    });

    document.querySelectorAll('button[class="fvtt-party-sheet-feedback-button"]').forEach((button) => {
      button.addEventListener("click", PartySheetForm.onFeedback.bind(this));
    });

    document.querySelectorAll('button[class="fvtt-party-sheet-module-preview-button"]').forEach((button) => {
      button.addEventListener("click", (event) => {
        const modulepath = event.currentTarget.dataset.modulepath;
        // Construct the Application instance
        // @ts-ignore
        const ip = new ImagePopout(
          `https://raw.githubusercontent.com/EddieDover/fvtt-party-sheet/main/example_templates/${modulepath}`,
        );

        // Display the image popout
        ip.render(true);
      });
    });

    // @ts-ignore
    const installButtons = document.querySelectorAll('button[class="fvtt-party-sheet-module-install-button"]');
    installButtons.forEach((button) => {
      button.addEventListener("click", async (event) => {
        // Check if the button is disabled
        if (event.currentTarget.disabled) {
          return;
        }

        const dataModuleTemplatePath = event.currentTarget.dataset.modulepath;
        const dataModuleTemplateFilename = dataModuleTemplatePath.split("/").pop();
        const dataModuleTemplateFolder = dataModuleTemplatePath.split("/").slice(0, -1).join("/") + "/";
        // @ts-ignore
        const fileContents = JSON.parse(
          await fetch(`${dataModuleTemplateFolder}${dataModuleTemplateFilename}`).then((r) => r.text()),
        );
        const fileObject = new File([JSON.stringify(fileContents)], dataModuleTemplateFilename, {
          type: "application/json",
        });
        // @ts-ignore
        await foundry.applications.app.FilePicker.upload("data", "partysheets", fileObject);
        await this._postInstallCallback();
        this.label = "Installed";
      });
    });

    const allDropdowns = document.querySelectorAll('select[class="fvtt-party-sheet-dropdown"]');
    allDropdowns.forEach((dropdown) => {
      dropdown.addEventListener("mousedown", (event) => {
        // User is starting to interact with dropdown (opening it)
        console.log("fvtt-party-sheet | Dropdown interaction started");
        this.isDropdownInteracting = true;
      });
      dropdown.addEventListener("change", (event) => {
        const dropdownSection = event.currentTarget.dataset.dropdownsection;
        const dropdownValue = event.currentTarget.value;

        // Save the new selection immediately to our state map
        if (dropdownSection && dropdownValue) {
          this.dropdownStates.set(dropdownSection, dropdownValue);
        }

        // @ts-ignore
        document
          .querySelectorAll(`div[data-dropdownsection="${dropdownSection}"]`)
          .forEach((div) => (div.style.display = "none"));

        // @ts-ignore
        document
          .querySelectorAll(`div[data-dropdownsection="${dropdownSection}"][data-dropdownoption="${dropdownValue}"]`)
          .forEach((div) => (div.style.display = "block"));

        // User made a selection, they're done interacting
        // Small delay to allow the selection to complete
        setTimeout(() => {
          this.isDropdownInteracting = false;
        }, 50);
      });
      dropdown.addEventListener("blur", (event) => {
        // Dropdown lost focus without selection (clicked elsewhere)
        setTimeout(() => {
          this.isDropdownInteracting = false;
        }, 50);
      });
    });
  }

  static onFeedback(event) {
    event.preventDefault();
    const newWindow = window.open(FEEDBACK_URL, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = undefined;
  }

  static onBugReport(event) {
    event.preventDefault();
    const newWindow = window.open(BUGREPORT_URL, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = undefined;
  }

  static onDiscord(event) {
    event.preventDefault();
    const newWindow = window.open(DISCORD_URL, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = undefined;
  }

  static onInstaller(event) {
    event.preventDefault();

    // In ApplicationV2, 'this' in static action handlers refers to the instance
    // Toggle the installer view - if it's showing, hide it; if hidden, show it
    // @ts-ignore
    this.showInstaller = !this.showInstaller;
    // @ts-ignore
    this._openingInstaller = this.showInstaller; // Only flag as opening if we're showing it

    // @ts-ignore
    this.doRender(true, false);
  }
}
