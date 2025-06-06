/* eslint-disable no-undef */
import {
  addSign,
  compareSymVer,
  extractPropertyByString,
  getCustomTemplates,
  getModuleTemplates,
  getSelectedTemplate,
  parseExtras,
  parsePluses,
  TemplateProcessError,
  trimIfString,
  updateSelectedTemplate,
} from "../utils.js";
import { HiddenCharactersSettings } from "./hidden-characters-settings.js";

const FEEDBACK_URL = "https://github.com/EddieDover/fvtt-party-sheet/issues/new/choose";
const BUGREPORT_URL =
  "https://github.com/EddieDover/fvtt-party-sheet/issues/new?assignees=EddieDover&labels=bug&projects=&template=bug_report.yml&title=%5BBug%5D%3A+";
const DISCORD_URL = "https://discord.gg/mvMdc7bH2d";

const DEFAULT_EXCLUDES = ["npc"];

let generated_dropdowns = 0;
// @ts-ignore
export class PartySheetForm extends FormApplication {
  constructor(postInstallCallback = async () => {}) {
    super();
    this._postInstallCallback = postInstallCallback;
    this.showInstaller = false;
    this.savedOptions = undefined;
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
    return str.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
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
   * Parse a direct string.
   * @param {*} character - The character to parse
   * @param {*} value - The value to parse
   * @param {{}} options - The options for the value
   * @returns {[boolean, string]} Whether a safe string is needed and the value
   */
  parseDirect(character, value, options) {
    let isSafeStringNeeded = false;

    value = this.cleanString(value);

    //Parse out normal data
    for (const m of value.split(" ")) {
      const fValue = extractPropertyByString(character, m);
      if (fValue !== undefined) {
        value = value.replace(m, fValue);
      }
    }

    if (value.indexOf("{charactersheet}") > -1) {
      isSafeStringNeeded = true;
      value = value.replaceAll(
        "{charactersheet}",
        `<input type="image" name="fvtt-party-sheet-actorimage" data-actorid="${
          character.uuid
        }" class="token-image" src="${character.prototypeToken.texture.src}" title="${
          character.prototypeToken.name
        }" width="36" height="36" style="transform: rotate(${character.prototypeToken.rotation ?? 0}deg);"/>`,
      );
    }

    value = parsePluses(value);
    value = this.processOptions(value, options);
    [isSafeStringNeeded, value] = parseExtras(value, isSafeStringNeeded);

    return [isSafeStringNeeded, value];
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
   * Process a "direct" type
   * @param {*} character - The character to process
   * @param {*} type - The type of data to process
   * @param {*} value - The value to process
   * @param {{}} options - The options for the data
   * @returns {string} The text to render
   */
  processDirect(character, type, value, options = {}) {
    let isSafeStringNeeded = false;
    [isSafeStringNeeded, value] = this.parseDirect(character, value, options);

    //Finally detect if a safe string cast is needed.
    if (isSafeStringNeeded) {
      // @ts-ignore
      return new Handlebars.SafeString(value);
    }
    return value;
  }

  /**
   * Process a "direct-complex" type
   * @param {*} character - The character to process
   * @param {*} type - The type of data to process
   * @param {*} value - The value to process
   * @param {{}} options - The options for the data
   * @returns {string} The text to render
   */
  processDirectComplex(character, type, value, options = {}) {
    // Call .trim() on item.value but only if it's a string
    let outputText = "";
    for (let item of value) {
      const trimmedItem = trimIfString(item);
      if (trimmedItem.type === "exists") {
        const eValue = extractPropertyByString(character, trimmedItem.value);
        if (eValue) {
          outputText += trimmedItem.text.replaceAll(trimmedItem.value, eValue);
        } else {
          if (trimmedItem.else) {
            const nValue = extractPropertyByString(character, trimmedItem.else);
            if (nValue) {
              outputText += nValue;
            } else {
              outputText += trimmedItem.else;
            }
          }
        }
      } else if (trimmedItem.type === "match") {
        const mValue = extractPropertyByString(character, trimmedItem.ifdata);
        const match_value = extractPropertyByString(character, trimmedItem.matches) ?? trimmedItem.matches;
        if (mValue === match_value) {
          outputText += extractPropertyByString(character, trimmedItem.text) ?? trimmedItem.text;
        } else {
          if (trimmedItem.else) {
            const mnValue = extractPropertyByString(character, trimmedItem.else);
            if (mnValue) {
              outputText += mnValue;
            } else {
              outputText += trimmedItem.else;
            }
          }
        }
      } else if (trimmedItem.type === "match-any") {
        const maValues = (Array.isArray(trimmedItem.text) ? trimmedItem.text : [trimmedItem.text]).map((val) =>
          extractPropertyByString(character, val),
        );
        const matchValue = extractPropertyByString(character, trimmedItem.match) ?? trimmedItem.match;

        for (const maVal of maValues) {
          if (maVal === matchValue) {
            outputText += extractPropertyByString(character, trimmedItem.text) ?? trimmedItem.text;
          } else {
            if (trimmedItem.else) {
              const manValue = extractPropertyByString(character, trimmedItem.else);
              if (manValue) {
                outputText += manValue;
              } else {
                outputText += trimmedItem.else;
              }
            }
          }
        }
      }
    }
    let isSafeStringNeeded = false;
    [isSafeStringNeeded, outputText] = this.parseDirect(character, outputText, options);
    // @ts-ignore
    return isSafeStringNeeded ? new Handlebars.SafeString(outputText) : outputText;
  }

  /**
   * Process an "array-string-builder" type
   * @param {*} character - The character to process
   * @param {*} type - The type of data to process
   * @param {*} value - The value to process
   * @returns {string} The text to rendera
   */
  processArrayStringBuilder(character, type, value) {
    const objName = value.split("=>")[0].trim();
    let outStrTemplate = value.split("=>")[1];
    let finalStr = "";

    let objData = extractPropertyByString(character, objName);

    if (!Array.isArray(objData) && objData instanceof Set === false) {
      objData = Object.keys(objData).map((key) => {
        return objData[key];
      });
    }

    const regValue = /(\{[^}]*\})|((?:\*\.|[\w.]+)+)/g;
    const reg = new RegExp(regValue);
    const allMatches = Array.from(outStrTemplate.matchAll(reg), (match) => match[0]).filter(
      (m) => !m.startsWith("{") && !m.endsWith("}"),
    );

    let outStr = "";
    if (objData.size ?? objData.length !== 0) {
      let subCount = 0;
      for (const objSubData of objData) {
        let templateCopy = outStrTemplate;
        for (const m of allMatches) {
          if (m === "value") {
            finalStr += outStrTemplate.replace(m, objSubData);
            continue;
          }
          templateCopy = templateCopy.replace(m, extractPropertyByString(objSubData, m));
        }
        outStr += templateCopy + (subCount > 0 ? "\n" : "");
        subCount += 1;
      }
    } else {
      return "";
    }
    if (finalStr === "") {
      finalStr = outStr;
    }
    finalStr = finalStr.trim();
    finalStr = this.cleanString(finalStr);
    finalStr = this.removeTrailingComma(finalStr);
    finalStr = finalStr === value ? "" : finalStr;

    const [isSafeStringNeeded, outputText] = parseExtras(finalStr);

    // @ts-ignore
    return isSafeStringNeeded ? new Handlebars.SafeString(outputText) : outputText;
  }

  /**
   * Process an "object-loop" type
   * @param {*} character - The character to process
   * @param {*} type - The type of data to process
   * @param {*} value - The value to process
   * @returns {string} The text to render
   */
  processObjectLoop(character, type, value) {
    const isDropdown = value.trim().startsWith("{dropdown} ");
    const dropdownKeys = [];

    if (isDropdown) {
      value = value.replace("{dropdown} ", "");
      generated_dropdowns += 1;
    }
    const chunks = value.split("||").map((thing) => thing.trim());
    let finStr = "";
    let finStrs = [];
    let outputText = "";
    let validDropdownSections = 0;

    chunks.forEach((chunk) => {
      let outStr = "";
      let prefix = "";
      let objName = chunk.split("=>")[0].trim();
      const findPrefixMatches = objName.match(/^(.*)\s/);

      if (findPrefixMatches?.length) {
        prefix = findPrefixMatches[1].trim();

        objName = objName.replace(prefix, "").trim();
      }

      let objFilter = null;

      const filterMatches = objName.match(/(?<=.)\{([^}]+)\}(?=$)/);

      if (filterMatches?.length) {
        objFilter = filterMatches[1];
        objName = objName.replace(`{${objFilter}}`, "");
      }

      if (isDropdown) {
        dropdownKeys.push(objFilter || objName);
        validDropdownSections += 1;
      }

      const actualValue = chunk.split("=>")[1];

      const objData = extractPropertyByString(character, objName);

      let loopData = [];
      const objKeys = Object.keys(objData);
      if (
        objKeys.length == 6 &&
        objKeys[0] == "documentClass" &&
        objKeys[1] == "name" &&
        objKeys[2] == "model" &&
        objKeys[3] == "_initialized" &&
        objKeys[4] == "_source" &&
        objKeys[5] == "invalidDocumentIds"
      ) {
        loopData = Object.keys(objData._source).map((key) => {
          return objData._source[key];
        });
      } else {
        loopData = Object.keys(objData).map((key) => {
          return objData[key];
        });
      }

      if (objFilter) {
        loopData = loopData.filter((data) => data.type === objFilter);
      }

      if (loopData.length === 0) {
        if (isDropdown) {
          dropdownKeys.pop();
          validDropdownSections -= 1;
        }
      }

      const regValue = /(?<!{)\s(?:\w+(?:\.\w+)*)+\s(?!})/g;
      const reg = new RegExp(regValue);
      const allMatches = Array.from(actualValue.matchAll(reg), (match) => match[0].trim());

      if (loopData.length ?? loopData.length !== 0) {
        for (const objSubData of loopData) {
          let tempLine = actualValue;
          for (const m of allMatches) {
            tempLine = tempLine.replace(m, extractPropertyByString(objSubData, m));
          }
          outStr += tempLine;
        }
      } else {
        return "";
      }
      if (outStr) {
        finStrs.push(prefix + outStr);
      }
    });

    let dropdownString = "";
    let isSafeStringNeeded = false;

    if (isDropdown && dropdownKeys.length === validDropdownSections && validDropdownSections > 1) {
      isSafeStringNeeded = true;
      dropdownString = `<select class='fvtt-party-sheet-dropdown' data-dropdownsection='${generated_dropdowns}' >`;
      for (let i = 0; i < finStrs.length; i++) {
        dropdownString += `<option value="${i}">${dropdownKeys[i]}</option>`;
      }
      dropdownString += "</select><br/>";
    }
    if (isDropdown) {
      const dd_section_start = (idx) =>
        `<div data-dropdownsection='${generated_dropdowns}' data-dropdownoption='${idx}' ${
          idx != 0 ? 'style="display: none;"' : ""
        } >`;
      const dd_section_end = "</div>";
      finStrs = finStrs.map((str, idx) => dd_section_start(idx) + this.cleanString(str) + dd_section_end);
      finStr = finStrs.join("");
    } else {
      finStr = finStrs.join(chunks?.length > 0 ? "" : ", ");
      finStr = finStr.trim();
      finStr = this.cleanString(finStr);
    }

    [isSafeStringNeeded, outputText] = parseExtras(finStr);

    return isSafeStringNeeded
      ? // @ts-ignore
        new Handlebars.SafeString((dropdownString || "") + outputText)
      : outputText;
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
      switch (type) {
        case "direct":
          return this.processDirect(character, type, value, options);
        case "direct-complex":
          return this.processDirectComplex(character, type, value, options);
        case "charactersheet":
          // @ts-ignore
          return new Handlebars.SafeString(
            `<input type="image" name="fvtt-party-sheet-actorimage" data-actorid="${
              character.uuid
            }" class="token-image" src="${character.prototypeToken.texture.src}" title="${
              character.prototypeToken.name
            }" width="36" height="36" style="transform: rotate(${character.prototypeToken.rotation ?? 0}deg);"/>`,
          );
        case "array-string-builder":
          return this.processArrayStringBuilder(character, type, value);
        case "string":
          return value;
        case "object-loop":
          return this.processObjectLoop(character, type, value);
        case "largest-from-array":
          return this.processLargestFromArray(character, type, value);
        case "smallest-from-array":
          return this.processSmallestFromArray(character, type, value);
        default:
          return "";
      }
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
      return (
        // @ts-ignore
        data.system === game.system.id &&
        // @ts-ignore
        compareSymVer(data.minimumSystemVersion, game.system.version) <= 0
      );
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
    this.showInstaller = false;

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
      overrides: this.overrides,
    });
  }

  static get defaultOptions() {
    // @ts-ignore
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "fvtt-party-sheet-party-sheet",
      classes: ["form"],
      title: "Party Sheet",
      // resizable: true,
      template: "modules/fvtt-party-sheet/templates/party-sheet.hbs",
      // @ts-ignore
      width: "auto", // $(window).width() > 960 ? 960 : $(window).width() - 100,
      height: "auto", //$(window).height() > 800 ? 800 : $(window).height() - 100,
    });
  }

  openOptions(event) {
    event.preventDefault();
    const overrides = {
      onexit: () => {
        setTimeout(() => {
          // @ts-ignore
          this.render(true);
        }, 350);
      },
    };
    const hcs = new HiddenCharactersSettings(overrides);
    // @ts-ignore
    hcs.render(true);
  }

  closeWindow() {
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
    // @ts-ignore
    this.render(true);
  }

  activateListeners(html) {
    super.activateListeners(html);

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
    $('select[class="fvtt-party-sheet-dropdown"]', html).change((event) => {
      const dropdownSection = event.currentTarget.dataset.dropdownsection;
      const dropdownValue = event.currentTarget.value;

      // @ts-ignore
      $(`div[data-dropdownsection="${dropdownSection}"]`).hide();

      // @ts-ignore
      $(`div[data-dropdownsection="${dropdownSection}"][data-dropdownoption="${dropdownValue}"]`).show();
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
    // @ts-ignore
    this.render(true);
  }
}
