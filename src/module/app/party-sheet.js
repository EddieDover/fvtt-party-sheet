/* eslint-disable no-undef */
import {
  extractPropertyByString,
  getCustomSystems,
  getSelectedSystem,
  parseExtras,
  parsePluses,
  trimIfString,
  updateSelectedSystem,
} from "../utils.js";
import { HiddenCharactersSettings } from "./hidden-characters-settings.js";

const FEEDBACK_URL = "https://github.com/eddiedover/fvtt-party-sheet/issues/new?template=feature_request.md";
const BUGREPORT_URL = "https://github.com/eddiedover/fvtt-party-sheet/issues/new?template=bug_report.md";
const DISCORD_URL = "https://discord.gg/XuGx7zNMKZ";

const DEFAULT_EXCLUDES = ["npc"];
// @ts-ignore
export class PartySheetForm extends FormApplication {
  constructor() {
    super();
  }

  /**
   * @typedef { 'direct' | 'math' | 'direct-complex' | 'string' | 'array-string-builder' } SystemDataColumnType
   * @typedef { 'show' | 'hide' | 'skip' } SystemDataColumnHeader
   * @typedef { 'left' | 'center' | 'right' } SystemDataColumnAlignType
   * @typedef { 'top' | 'bottom' } SystemDataColumnVAlignType
   */

  /**
   * @typedef SystemDataColumn
   * @property {string} name - The name of the column.
   * @property {SystemDataColumnType} type - The type of data to display. See below for details.
   * @property {SystemDataColumnHeader} header - Whether to show, hide, or skip the column.
   * @property {SystemDataColumnAlignType} align - The horizontal alignment of the column.
   * @property {SystemDataColumnVAlignType} valign - The vertical alignment of the column.
   * @property {number} colspan - The number of columns to span.
   * @property {number} maxwidth - The maximum width of the column in pixels.
   * @property {number} minwidth - The minimum width of the column in pixels.
   * @property {string} text - The value to display. See below for details.
   */

  /**
   * @typedef ColOptions
   * @property {SystemDataColumnHeader} header - Whether to show, hide, or skip the column.
   * @property {SystemDataColumnAlignType} align - The horizontal alignment of the column.
   * @property {SystemDataColumnVAlignType} valign - The vertical alignment of the column.
   * @property {number} colspan - The number of columns to span.
   * @property {number} maxwidth - The maximum width of the column in pixels.
   * @property {number} minwidth - The minimum width of the column in pixels.
   */

  /**
   * @typedef SystemData
   * @property { string } system - The system this data is for.
   * @property { string } author - The author of this data.
   * @property { string } name - The name of this data.
   * @property { Array<Array<SystemDataColumn>> } rows - The rows of data to display. See below for details.
   * @property { string } offline_excludes_property - The property to use to exclude players. Note: This is optional and defaults to the actors.type property.
   * @property { Array<string> } offline_excludes - The types you want to exclude when showing offline players.
   * @property { string } offline_includes_property - The property to use to show players online.
   * @property { Array<string> } offline_includes - The types you want to include when showing online players.
   */

  /**
   * @typedef { {name: string, author: string, players: any, rowcount: number} } CustomPlayerData
   */

  /**
   * Get the custom player data.
   * @param { SystemData } data - The system data
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
      console.log("======= TOTM DEBUG ACTORS LIST ======= ");
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
        console.log("======= TOTM DEBUG CHARACTER LIST ======= ");
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

          data.rows.map((row_obj) => {
            let customData = {};

            row_obj.forEach((colobj) => {
              const colname = colobj.name;
              customData[colname] = {
                text: this.getCustomData(userChar, colobj.type, colobj.text),
                options: {
                  align: colobj.align,
                  valign: colobj.valign,
                  colspan: colobj.colspan,
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
      console.log(ex);
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
   * @returns {[boolean, string]} Whether a safe string is needed and the value
   */
  parseDirect(character, value) {
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
        `<input type="image" name="totm-actorimage" data-actorid="${character.uuid}" class="token-image" src="${
          character.prototypeToken.texture.src
        }" title="${character.prototypeToken.name}" width="36" height="36" style="transform: rotate(${
          character.prototypeToken.rotation ?? 0
        }deg);"/>`,
      );
    }

    value = parsePluses(value);
    [isSafeStringNeeded, value] = parseExtras(value, isSafeStringNeeded);

    return [isSafeStringNeeded, value];
  }

  /**
   * Process a "direct" type
   * @param {*} character - The character to process
   * @param {*} type - The type of data to process
   * @param {*} value - The value to process
   * @returns {string} The text to render
   */
  processDirect(character, type, value) {
    let isSafeStringNeeded = false;
    [isSafeStringNeeded, value] = this.parseDirect(character, value);

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
   * @returns {string} The text to render
   */
  processDirectComplex(character, type, value) {
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
    [isSafeStringNeeded, outputText] = this.parseDirect(character, outputText);
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
    let outStr = value.split("=>")[1];
    let finalStr = "";

    let objData = extractPropertyByString(character, objName);

    if (!Array.isArray(objData) && objData instanceof Set === false) {
      objData = Object.keys(objData).map((key) => {
        return objData[key];
      });
    }

    const regValue = /(?:\*\.|[\w.]+)+/g;
    const reg = new RegExp(regValue);
    const allMatches = Array.from(outStr.matchAll(reg), (match) => match[0]);

    if (objData.size ?? objData.length !== 0) {
      for (const objSubData of objData) {
        for (const m of allMatches) {
          if (m === "value") {
            finalStr += outStr.replace(m, objSubData);
            continue;
          }
          outStr = outStr.replace(m, extractPropertyByString(objSubData, m));
        }
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
    return finalStr === value ? "" : finalStr;
  }

  /**
   * Process an "object-loop" type
   * @param {*} character - The character to process
   * @param {*} type - The type of data to process
   * @param {*} value - The value to process
   * @returns {string} The text to render
   */
  processObjectLoop(character, type, value) {
    const objName = value.split("=>")[0].trim();
    const actualValue = value.split("=>")[1];
    const objData = extractPropertyByString(character, objName);

    let loopData = [];
    const objKeys = Object.keys(objData);
    let outStr = "";
    let outputText = "";
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
    outStr = outStr.trim();
    outStr = this.cleanString(outStr);
    let isSafeStringNeeded = false;
    [isSafeStringNeeded, outputText] = parseExtras(outStr);
    // @ts-ignore
    return isSafeStringNeeded ? new Handlebars.SafeString(outputText) : outputText;
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
   * @returns {string} The text to render
   * @memberof PartySheetForm
   */
  getCustomData(character, type, value) {
    switch (type) {
      case "direct":
        return this.processDirect(character, type, value);
      case "direct-complex":
        return this.processDirectComplex(character, type, value);
      case "charactersheet":
        // @ts-ignore
        return new Handlebars.SafeString(
          `<input type="image" name="totm-actorimage" data-actorid="${character.uuid}" class="token-image" src="${
            character.prototypeToken.texture.src
          }" title="${character.prototypeToken.name}" width="36" height="36" style="transform: rotate(${
            character.prototypeToken.rotation ?? 0
          }deg);"/>`,
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
  }

  getData(options) {
    // @ts-ignore
    const minimalView = game.settings.get("fvtt-party-sheet", "enableMinimalView");
    // @ts-ignore
    const hiddenCharacters = game.settings.get("fvtt-party-sheet", "hiddenCharacters");
    // @ts-ignore
    const enableOnlyOnline = game.settings.get("fvtt-party-sheet", "enableOnlyOnline");
    // @ts-ignore
    const customSystems = getCustomSystems();

    const applicableSystems = customSystems.filter((data) => {
      // @ts-ignore
      return data.system === game.system.id;
    });
    let selectedIdx = getSelectedSystem() ? applicableSystems.findIndex((data) => data === getSelectedSystem()) : 0;

    updateSelectedSystem(applicableSystems[selectedIdx]);
    const selectedSystem = getSelectedSystem();
    let { name: sysName, author: sysAuthor, players, rowcount } = this.getCustomPlayerData(selectedSystem);
    // @ts-ignore
    return mergeObject(super.getData(options), {
      minimalView,
      hiddenCharacters,
      enableOnlyOnline,
      rowcount,
      players,
      applicableSystems,
      selectedName: sysName,
      selectedAuthor: sysAuthor,
      // @ts-ignore
      overrides: this.overrides,
    });
  }

  static get defaultOptions() {
    // @ts-ignore
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "totm-party-sheet",
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
    const selectedSystemName = event.currentTarget.value.split("___")[0];
    const selectedSystemAuthor = event.currentTarget.value.split("___")[1];
    const selectedIndex =
      getCustomSystems().findIndex(
        (data) => data.name === selectedSystemName && data.author === selectedSystemAuthor,
      ) ?? -1;
    if (selectedIndex != -1) {
      updateSelectedSystem(getCustomSystems()[selectedIndex]);
    }
    // @ts-ignore
    this.render(true);
  }

  activateListeners(html) {
    super.activateListeners(html);
    // @ts-ignore
    $('button[name="totm-options"]', html).click(this.openOptions.bind(this));
    // @ts-ignore
    $('button[name="totm-close"]', html).click(this.closeWindow.bind(this));
    // @ts-ignore
    $('input[name="totm-actorimage"]', html).click(this.openActorSheet.bind(this));
    // @ts-ignore
    $('select[name="totm-system"]', html).change(this.changeSystem.bind(this));
    // @ts-ignore
    $('button[name="feedback"]', html).click(this.onFeedback.bind(this));
    // @ts-ignore
    $('button[name="bugreport"]', html).click(this.onBugReport.bind(this));
    // @ts-ignore
    $('button[name="discord"]', html).click(this.onDiscord.bind(this));
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
}
