/* eslint-disable no-undef */
import {
  addSign,
  compareSymVer,
  extractPropertyByString,
  getCustomTemplates,
  getModuleTemplates,
  getSelectedTemplate,
  isVersionAtLeast,
  log,
  TemplateProcessError,
  updateSelectedTemplate,
} from "../utils.js";
import { sanitizeHTML } from "../utils/dompurify-sanitizer.js";
import { HiddenCharactersSettings } from "./hidden-characters-settings.js";
import { ParserFactory } from "../parsing/parser-factory.js";
import { TemplateProcessor } from "../parsing/template-processor.js";

const FEEDBACK_URL = "https://github.com/EddieDover/fvtt-party-sheet/issues/new/choose";
const BUGREPORT_URL =
  "https://github.com/EddieDover/fvtt-party-sheet/issues/new?assignees=EddieDover&labels=bug&projects=&template=bug_report.yml&title=%5BBug%5D%3A+";
const DISCORD_URL = "https://discord.gg/mvMdc7bH2d";

const DEFAULT_EXCLUDES = ["npc"];

export class PartySheetForm extends FormApplication {
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
   * Clean a string of html injection.
   * @param {string} str - The string to clean
   * @returns {string} The cleaned string
   * @memberof PartySheetForm
   */
  cleanString(str) {
    if (typeof str !== "string") {
      return str;
    }

    // Use DOMPurify for robust HTML sanitization
    return sanitizeHTML(str);
  }

  /**
   * Remove trailing commas from a string.
   * @param {string} str - The string to remove trailing commas from
   * @returns {string} The string without trailing commas
   * @memberof PartySheetForm
   */
  removeTrailingComma(str) {
    return str.replace(/,\s*$/, "");
  }

  /**
   * Process options for a value.
   * @param {*} value - The value to process
   * @param {*} options - The options for the value
   * @returns {*} - The processed value
   * @memberof PartySheetForm
   */
  processOptions(value, options) {
    if (options.showSign) {
      value = addSign(value);
    }
    return value;
  }

  /**
   * Process the largest value from an array.
   * @param {*} character - The character to process
   * @param {*} type - The type of data to process
   * @param {*} value - The value to process
   * @returns {string} The text to render
   */
  processLargestFromArray(character, type, value) {
    let lArr = extractPropertyByString(character, value);

    if (!Array.isArray(lArr) && lArr instanceof Set === false) {
      lArr = Object.keys(lArr).map((key) => {
        if (typeof lArr[key] !== "object") {
          return lArr[key];
        } else if (lArr[key].value) {
          return lArr[key].value;
        } else return "";
      });
    } else return "";

    if (lArr.length ?? lArr.length !== 0) {
      return lArr.reduce((a, b) => (a > b ? a : b));
    } else {
      return "";
    }
  }

  /**
   * Process the smallest value from an array.
   * @param {*} character - The character to process
   * @param {*} type - The type of data to process
   * @param {*} value - The value to process
   * @returns {string} The text to render
   */
  processSmallestFromArray(character, type, value) {
    let sArr = extractPropertyByString(character, value);

    if (!Array.isArray(sArr) && sArr instanceof Set === false) {
      sArr = Object.keys(sArr).map((key) => {
        if (typeof sArr[key] !== "object") {
          return sArr[key];
        } else if (sArr[key].value) {
          return sArr[key].value;
        } else return "";
      });
    } else return "";

    if (sArr.length ?? sArr.length !== 0) {
      return sArr.reduce((a, b) => (a < b ? a : b));
    } else {
      return "";
    }
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

  getData(options) {
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
    return foundry.utils.mergeObject(super.getData(options), {
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
    });
  }

  static get defaultOptions() {
    // @ts-ignore
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "fvtt-party-sheet-party-sheet",
      classes: ["form"],
      // @ts-ignore
      title: game.i18n.localize("fvtt-party-sheet.section-title"),
      // resizable: true,
      template: "modules/fvtt-party-sheet/templates/party-sheet.hbs",
      // @ts-ignore
      width: "auto", // $(window).width() > 960 ? 960 : $(window).width() - 100,
      height: "auto", //$(window).height() > 800 ? 800 : $(window).height() - 100,
    });
  }

  /**
   * Render the sheet
   * @memberof PartySheetForm
   * @param {boolean} [force] - Whether to force re-rendering the form.
   * @param {boolean} [focus] - Whether to focus the form after rendering.
   */
  doRender(force = false, focus = false) {
    const v13andUp = isVersionAtLeast(13);

    // Set a flag to indicate if this is a user-initiated action (force=true) or auto-refresh (force=false)
    this._isUserAction = force;

    // Save dropdown states before rendering (if this is a re-render)
    // @ts-ignore
    if (this.rendered && this.element) {
      // @ts-ignore
      this.saveDropdownStates(this.element);
    }

    if (v13andUp) {
      this.render({
        force,
        focus,
      });
    } else {
      this.render(force, { focus });
    }

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

  openOptions(event) {
    event.preventDefault();
    const overrides = {
      onexit: () => {
        setTimeout(() => {
          this.doRender(true, false);
        }, 350);
      },
    };
    const hcs = new HiddenCharactersSettings(overrides);
    // @ts-ignore
    hcs.render(true);
  }

  closeWindow() {
    // Clear the refresh timer when closing the window
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    // @ts-ignore
    this.close();
  }

  openActorSheet(event) {
    event.preventDefault();
    const actorId = event.currentTarget.dataset.actorid;
    // @ts-ignore
    const actor = game.actors.get(actorId.replace("Actor.", ""));
    actor.sheet.render(true);
  }

  changeSystem(event) {
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

    this.doRender(true, false);
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Start the refresh timer for periodic updates
    this.startRefreshTimer();

    // @ts-ignore
    $('button[name="fvtt-party-sheet-options"]', html).click(this.openOptions.bind(this));
    // @ts-ignore
    $('button[name="fvtt-party-sheet-close"]', html).click(this.closeWindow.bind(this));
    // @ts-ignore
    $('input[name="fvtt-party-sheet-actorimage"]', html).click(this.openActorSheet.bind(this));
    // @ts-ignore
    $('select[name="fvtt-party-sheet-system"]', html).change(this.changeSystem.bind(this));
    // @ts-ignore
    $('button[name="feedback"]', html).click(this.onFeedback.bind(this));
    // @ts-ignore
    $('button[name="bugreport"]', html).click(this.onBugReport.bind(this));
    // @ts-ignore
    $('button[name="discord"]', html).click(this.onDiscord.bind(this));
    // @ts-ignore
    $('button[name="installer"]', html).click(this.onInstaller.bind(this));
    // @ts-ignore
    $('button[class="fvtt-party-sheet-module-preview-button"]').click((event) => {
      const modulepath = event.currentTarget.dataset.modulepath;
      // Construct the Application instance
      // @ts-ignore
      const ip = new ImagePopout(
        `https://raw.githubusercontent.com/EddieDover/fvtt-party-sheet/main/example_templates/${modulepath}`,
      );

      // Display the image popout
      ip.render(true);
    });
    // @ts-ignore
    $('button[class="fvtt-party-sheet-module-install-button"]').click(async (event) => {
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
      await FilePicker.upload("data", "partysheets", fileObject);
      await this._postInstallCallback();
      this.label = "Installed";
    });

    // @ts-ignore
    $('select[class="fvtt-party-sheet-dropdown"]', html)
      .on("mousedown", (event) => {
        // User is starting to interact with dropdown (opening it)
        console.log("fvtt-party-sheet | Dropdown interaction started");
        this.isDropdownInteracting = true;
      })
      .on("change", (event) => {
        const dropdownSection = event.currentTarget.dataset.dropdownsection;
        const dropdownValue = event.currentTarget.value;

        // Save the new selection immediately to our state map
        if (dropdownSection && dropdownValue) {
          this.dropdownStates.set(dropdownSection, dropdownValue);
        }

        // @ts-ignore
        $(`div[data-dropdownsection="${dropdownSection}"]`).hide();

        // @ts-ignore
        $(`div[data-dropdownsection="${dropdownSection}"][data-dropdownoption="${dropdownValue}"]`).show();

        // User made a selection, they're done interacting
        // Small delay to allow the selection to complete
        setTimeout(() => {
          this.isDropdownInteracting = false;
        }, 50);
      })
      .on("blur", (event) => {
        // Dropdown lost focus without selection (clicked elsewhere)
        setTimeout(() => {
          this.isDropdownInteracting = false;
        }, 50);
      });
  }

  onFeedback(event) {
    event.preventDefault();
    const newWindow = window.open(FEEDBACK_URL, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = undefined;
  }

  onBugReport(event) {
    event.preventDefault();
    const newWindow = window.open(BUGREPORT_URL, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = undefined;
  }

  onDiscord(event) {
    event.preventDefault();
    const newWindow = window.open(DISCORD_URL, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = undefined;
  }

  onInstaller(event) {
    event.preventDefault();
    this.showInstaller = true;
    this._openingInstaller = true; // Flag to prevent immediate closure

    this.doRender(true, false);
  }
}
