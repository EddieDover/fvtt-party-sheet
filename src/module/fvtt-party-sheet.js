/* eslint-disable no-undef */
import { registerSettings } from "./app/settings.js";
import { PartySheetForm } from "./app/party-sheet.js";
import {
  log,
  loadSystemTemplates,
  toProperCase,
  areTemplatesLoaded,
  validateSystemTemplates,
  setTemplatesLoaded,
  clearCustomTemplates,
  showVersionDifferenceNotifications,
  isVersionAtLeast,
  compareSymVer,
} from "./utils.js";
import { TemplateStatusForm } from "./app/template-status.js";

/** @type {PartySheetForm} */
let currentPartySheet = null;
let currentRefreshInterval = null;
let currentTemplateStatusForm = null;
// @ts-ignore
Handlebars.registerPartial(
  "installer",
  `
<div style="display:flex;flex-direction:row;flex-wrap:wrap;width:100%;min-width:600px;">
{{#ifCond moduleSystemTemplates.length '>' 0}}
{{#each moduleSystemTemplates as |template|}}
    <div style="display:flex;flex-direction:row;flex-wrap:nowrap;padding: 3px;border: 1px solid black;border-radius: 5px;margin: 5px;">
        <div class="fvtt-party-sheet-ps-system-name" style="display:flex;flex-direction:column;flex-wrap:nowrap;width:200px;height:100%;max-height:400px;">
        <div style="font-weight:bolder;text-transform:uppercase;">{{localize "fvtt-party-sheet.template-name"}}:</div>
        <div style="padding-bottom:3px;">{{template.name}}</div>
        <div style="font-weight:bolder;text-transform:uppercase;">{{localize "fvtt-party-sheet.author"}}:</div>
        <div style="padding-bottom:3px">{{template.author}}</div>
        <div style="font-weight:bolder;text-transform:uppercase;">{{localize "fvtt-party-sheet.version"}}:</div>
        <div style="padding-bottom:3px">{{template.version}}</div>
        <div style="font-weight:bolder;text-transform:uppercase;">{{localize "fvtt-party-sheet.template-installed-version"}}:</div>
        <div style="padding-bottom:3px">
            {{#if template.installedVersion}}        
              {{#compVersion template.installedVersion template.version}}
                  {{template.installedVersion}}
              {{else}}
                  <span style="color:#ff6666;background-color:#000000;border-radius:5px;padding:2px;">{{template.installedVersion}}</span>
              {{/compVersion}}
            {{else}}
              <span style="border-radius:5px;padding:2px;"></span>
            {{/if}}
        </div>
        <div style="font-weight:bolder;text-transform:uppercase;">{{localize "fvtt-party-sheet.template-status.current-system-version"}}:</div>
        <div style="padding-bottom:3px;font-weight:bold;color:#4a90e2;">{{../currentSystemVersion}}</div>
        <div style="font-weight:bolder;text-transform:uppercase;">{{localize "fvtt-party-sheet.template-system-version"}}:</div>
        {{#systemVersionBelowMin template.minimumSystemVersion}}
        <div style="padding-bottom:3px;color:#ff6666;background-color:#000000;border-radius:5px;padding:2px;">{{template.minimumSystemVersion}}</div>
        {{else}}
        <div style="padding-bottom:3px;">{{template.minimumSystemVersion}}</div>
        {{/systemVersionBelowMin}}
        {{#if template.maximumSystemVersion}}
        <div style="font-weight:bolder;text-transform:uppercase;">{{localize "fvtt-party-sheet.template-max-system-version"}}:</div>
        {{#systemVersionAboveMax template.maximumSystemVersion}}
        <div style="flex-grow:1;color:#ff6666;background-color:#000000;border-radius:5px;padding:2px;">{{template.maximumSystemVersion}}</div>
        {{else}}
        <div style="flex-grow:1;">{{template.maximumSystemVersion}}</div>
        {{/systemVersionAboveMax}}
        {{else}}
        <div style="flex-grow:1;"></div>
        {{/if}}
        {{#if template.installedVersion}}
              {{#compVersion template.installedVersion template.version}}
              {{#systemVersionInRange template.minimumSystemVersion template.maximumSystemVersion}}
              <button
                  type="button"
                  class="fvtt-party-sheet-module-install-button"
                  data-modulepath="{{template.path}}"
              >
                  {{localize "fvtt-party-sheet.reinstall"}}
              </button>
              {{else}}
              <button
                  type="button"
                  class="fvtt-party-sheet-module-install-button"
                  data-modulepath="{{template.path}}"
                  disabled
                  style="opacity:0.5;cursor:not-allowed;"
                  title="System version {{../currentSystemVersion}} is incompatible with this template (requires {{template.minimumSystemVersion}}{{#if template.maximumSystemVersion}} - {{template.maximumSystemVersion}}{{/if}})"
              >
                  {{localize "fvtt-party-sheet.reinstall"}}
              </button>
              {{/systemVersionInRange}}
              {{else}}
                  {{#systemVersionInRange template.minimumSystemVersion template.maximumSystemVersion}}
                  <button
                  type="button"
                  style="background-color:#29b125"
                  class="fvtt-party-sheet-module-install-button"
                  data-modulepath="{{template.path}}"
              >
                {{localize "fvtt-party-sheet.update"}}
              </button>
                  {{else}}
                  <button
                  type="button"
                  style="background-color:#666;opacity:0.5;cursor:not-allowed;"
                  class="fvtt-party-sheet-module-install-button"
                  data-modulepath="{{template.path}}"
                  disabled
                  title="System version {{../currentSystemVersion}} is incompatible with this template (requires {{template.minimumSystemVersion}}{{#if template.maximumSystemVersion}} - {{template.maximumSystemVersion}}{{/if}})"
              >
                {{localize "fvtt-party-sheet.update"}}
              </button>
                  {{/systemVersionInRange}}
              {{/compVersion}}
        {{else}}
          {{#if template.version}}
            <button
              type="button"
              class="fvtt-party-sheet-module-preview-button"
              data-modulepath="{{template.preview}}"
              >
                {{localize "fvtt-party-sheet.preview"}}
            </button>
            {{#if template.installed}}
              {{#systemVersionInRange template.minimumSystemVersion template.maximumSystemVersion}}
              <button
                  type="button"
                  style="background-color:#29b125"
                  class="fvtt-party-sheet-module-install-button"
                  data-modulepath="{{template.path}}"
                >
                {{localize "fvtt-party-sheet.update"}}
              </button>
              {{else}}
              <button
                  type="button"
                  style="background-color:#666;opacity:0.5;cursor:not-allowed;"
                  class="fvtt-party-sheet-module-install-button"
                  data-modulepath="{{template.path}}"
                  disabled
                  title="System version {{../currentSystemVersion}} is incompatible with this template (requires {{template.minimumSystemVersion}}{{#if template.maximumSystemVersion}} - {{template.maximumSystemVersion}}{{/if}})"
                >
                {{localize "fvtt-party-sheet.update"}}
              </button>
              {{/systemVersionInRange}}
            {{else}}
              {{#systemVersionInRange template.minimumSystemVersion template.maximumSystemVersion}}
              <button
                type="button"
                class="fvtt-party-sheet-module-install-button"
                data-modulepath="{{template.path}}"
              >
              {{localize "fvtt-party-sheet.install"}}
            </button>
              {{else}}
              <button
                type="button"
                class="fvtt-party-sheet-module-install-button"
                data-modulepath="{{template.path}}"
                disabled
                style="opacity:0.5;cursor:not-allowed;"
                title="System version {{../currentSystemVersion}} is incompatible with this template (requires {{template.minimumSystemVersion}}{{#if template.maximumSystemVersion}} - {{template.maximumSystemVersion}}{{/if}})"
              >
              {{localize "fvtt-party-sheet.install"}}
            </button>
              {{/systemVersionInRange}}
            {{/if}}
          {{/if}}
        {{/if}}
        </div>
    </div>
{{/each}}
{{else}}
  <div>
    There are currently no community created templates available for your system.
    <br/>
    Visit <a href='https://github.com/EddieDover/fvtt-party-sheet/blob/main/TEMPLATE_README.md'>TEMPLATE_README.md</a> for more information on how to create your own.
  </div>
{{/ifCond}}
</div>
`,
);

// @ts-ignore
Handlebars.registerHelper("hccontains", function (needle, haystack, options) {
  // @ts-ignore
  needle = Handlebars.escapeExpression(needle);
  // @ts-ignore
  haystack = game.settings.get("fvtt-party-sheet", "hiddenCharacters") ?? [];
  return haystack.indexOf(needle) > -1 ? options.fn(this) : options.inverse(this);
});

// @ts-ignore
Handlebars.registerHelper("hcifgte", function (v1, v2, options) {
  if (v1 >= v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

// @ts-ignore
Handlebars.registerHelper("hciflte", function (v1, v2, options) {
  if (v1 <= v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

// @ts-ignore
Handlebars.registerHelper("checkIndex", function (index, options) {
  if (index % 2 == 0) {
    return options.fn(this);
  }
  return options.inverse(this);
});

// @ts-ignore
Handlebars.registerHelper("hcifhidden", function (row, options) {
  const key = options.hash["key"];
  const myoptions = row[key]?.options ?? {};

  if (myoptions?.header === "show") {
    return options.inverse(this);
  } else {
    return options.fn(this);
  }
});

// @ts-ignore
Handlebars.registerHelper("getAlignment", function (row, key) {
  const myoptions = row[key]?.options ?? {};
  return myoptions.align ?? "center";
});

// @ts-ignore
Handlebars.registerHelper("getVAlignment", function (row, key) {
  const myoptions = row[key]?.options ?? {};
  if (myoptions.valign === "top" || myoptions.valign === "bottom") {
    return myoptions.valign;
  } else {
    return "inherit";
  }
});

// @ts-ignore
Handlebars.registerHelper("getColSpan", function (row, key) {
  const myoptions = row[key]?.options ?? {};
  return myoptions?.colspan ?? 1;
});

// @ts-ignore
Handlebars.registerHelper("shouldSkipForColspan", function (row, currentKey, options) {
  const keys = Object.keys(row);
  const currentIndex = keys.indexOf(currentKey);

  // Check if any previous cell in this row spans into this position
  for (let i = 0; i < currentIndex; i++) {
    const prevKey = keys[i];
    const prevColspan = row[prevKey]?.options?.colspan ?? 1;

    // If the previous cell spans enough columns to cover this position
    if (i + prevColspan > currentIndex) {
      return options.fn(this); // Skip this cell
    }
  }

  return options.inverse(this); // Don't skip this cell
});

// @ts-ignore
Handlebars.registerHelper("getRowSpan", function (row, key) {
  const myoptions = row[key]?.options ?? {};
  return myoptions?.rowspan ?? 1;
});

// @ts-ignore
Handlebars.registerHelper("getMaxWidth", function (row, key) {
  const myoptions = row[key]?.options ?? {};
  return myoptions?.maxwidth ? `${myoptions?.maxwidth}px` : "none";
});

// @ts-ignore
Handlebars.registerHelper("getMinWidth", function (row, key) {
  const myoptions = row[key]?.options ?? {};
  return myoptions?.minwidth ? `${myoptions?.minwidth}px` : "auto";
});

// @ts-ignore
Handlebars.registerHelper("shouldShowTotal", function (row, key) {
  const myoptions = row[key]?.options ?? {};
  return myoptions?.showTotal === true;
});

// @ts-ignore
Handlebars.registerHelper("getColumnTotal", function (players, columnKey, rowIndex) {
  // Validate that players is iterable
  if (!players || !Array.isArray(players) || players.length === 0) {
    return "";
  }

  let total = 0;
  let hasNumericValues = false;

  try {
    for (let i = 0; i < players.length; i++) {
      const playerData = players[i];

      if (playerData && playerData[rowIndex] && playerData[rowIndex][columnKey]) {
        const cellText = playerData[rowIndex][columnKey].text;

        // Try to extract numeric value from the text
        const numericValue = parseFloat(cellText);

        if (!isNaN(numericValue)) {
          total += numericValue;
          hasNumericValues = true;
        }
      }
    }
  } catch (error) {
    console.warn("Error calculating column total:", error);
    return "";
  }

  return hasNumericValues ? total : "";
});

// @ts-ignore
Handlebars.registerHelper("eachInMap", function (map, block) {
  let out = "";
  Object.keys(map).map(function (prop) {
    out += block.fn({ key: prop, value: map[prop] });
  });
  return out;
});

// @ts-ignore
Handlebars.registerHelper("debug", function (data) {
  console.log(data);
  return "";
});

// @ts-ignore
Handlebars.registerHelper("getKeys", function (obj, options) {
  const keys = Object.keys(obj);
  let result = "";
  for (const element of keys) {
    result += options.fn(element);
  }
  return result;
});

// @ts-ignore
Handlebars.registerHelper("isSpanOver", function (row, obj, options) {
  const spanover = row[obj]?.options?.spanover;
  if (!spanover) {
    return options.fn(this);
  }
  return options.inverse(this);
});

// @ts-ignore
Handlebars.registerHelper("getData", function (obj, key) {
  return obj[key].text;
});

// @ts-ignore
Handlebars.registerHelper("toUpperCase", function (str) {
  return str.toUpperCase();
});

// @ts-ignore
Handlebars.registerHelper("toProperCase", function (str) {
  return toProperCase(str);
});

// @ts-ignore
Handlebars.registerHelper("ifCond", function (v1, operator, v2, options) {
  switch (operator) {
    case "==":
      return v1 == v2 ? options.fn(this) : options.inverse(this);
    case "===":
      return v1 === v2 ? options.fn(this) : options.inverse(this);
    case "!=":
      return v1 != v2 ? options.fn(this) : options.inverse(this);
    case "!==":
      return v1 !== v2 ? options.fn(this) : options.inverse(this);
    case "<":
      return v1 < v2 ? options.fn(this) : options.inverse(this);
    case "<=":
      return v1 <= v2 ? options.fn(this) : options.inverse(this);
    case ">":
      return v1 > v2 ? options.fn(this) : options.inverse(this);
    case ">=":
      return v1 >= v2 ? options.fn(this) : options.inverse(this);
    case "&&":
      return v1 && v2 ? options.fn(this) : options.inverse(this);
    case "||":
      return v1 || v2 ? options.fn(this) : options.inverse(this);
    default:
      return options.inverse(this);
  }
});

// @ts-ignore
Handlebars.registerHelper("compVersion", function (v1, v2, options) {
  const v1Parts = v1.split(".");
  const v2Parts = v2.split(".");

  const maxLen = Math.max(v1Parts.length, v2Parts.length);

  let v1Num, v2Num;
  for (let i = 0; i < maxLen; i++) {
    v1Num = parseInt(v1Parts[i], 10);
    v2Num = parseInt(v2Parts[i], 10);

    if (isNaN(v1Num)) {
      v1Num = 0;
    }
    if (isNaN(v2Num)) {
      v2Num = 0;
    }

    if (v1Num > v2Num) {
      return options.fn(this);
    }
    if (v1Num < v2Num) {
      return options.inverse(this);
    }
  }

  return options.fn(this);
});

// @ts-ignore
Handlebars.registerHelper("systemVersionInRange", function (minVersion, maxVersion, options) {
  // @ts-ignore
  const currentSystemVersion = game.system.version;

  if (!compareSymVer) {
    // Fallback: simple string comparison if compareSymVer is not available
    const minCheck = currentSystemVersion >= minVersion;
    const maxCheck = !maxVersion || currentSystemVersion <= maxVersion;

    if (minCheck && maxCheck) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  }

  const aboveMin = compareSymVer(currentSystemVersion, minVersion) >= 0;
  const belowMax = !maxVersion || compareSymVer(currentSystemVersion, maxVersion) <= 0;

  const inRange = aboveMin && belowMax;

  if (inRange) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

// @ts-ignore
Handlebars.registerHelper("systemVersionAboveMax", function (maxVersion, options) {
  if (!maxVersion) {
    return options.inverse(this);
  }

  // @ts-ignore
  const currentSystemVersion = game.system.version;

  const aboveMax = compareSymVer(currentSystemVersion, maxVersion) > 0;

  if (aboveMax) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

// @ts-ignore
Handlebars.registerHelper("systemVersionBelowMin", function (minVersion, options) {
  // @ts-ignore
  const currentSystemVersion = game.system.version;

  const belowMin = compareSymVer(currentSystemVersion, minVersion) < 0;

  if (belowMin) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

/**
 * Toggles the party sheet
 * @param {PartySheetRenderOptions} [options] - Additional Options
 */
function togglePartySheet(options = {}) {
  if (currentPartySheet?.rendered) {
    currentPartySheet.close();
  } else {
    currentPartySheet = new PartySheetForm(options, afterInstall);
    // @ts-ignore
    currentPartySheet.doRender(true);

    // @ts-ignore
    const refreshRate = game.settings.get("fvtt-party-sheet", "refreshRate");
    if (refreshRate > 0) {
      currentRefreshInterval = setInterval(() => refreshSheet(), refreshRate * 1000);
    } else {
      if (currentRefreshInterval) {
        clearInterval(currentRefreshInterval);
        currentRefreshInterval = null;
      }
    }
  }
}

/**
 * Refreshes the party sheet
 */
function refreshSheet() {
  if (currentPartySheet?.rendered) {
    try {
      currentPartySheet.doRender(false, false);
    } catch (error) {
      console.warn("fvtt-party-sheet | Error during auto-refresh:", error);
    }
  } else {
    // Party sheet is not rendered, cleanup the timer
    if (currentRefreshInterval) {
      clearInterval(currentRefreshInterval);
      currentRefreshInterval = null;
    }
  }
}

/**
 * Toggles the template status form
 */
function toggleTemplateStatusForm() {
  if (currentTemplateStatusForm?.rendered) {
    currentTemplateStatusForm.close();
  } else {
    currentTemplateStatusForm = new TemplateStatusForm();
    // @ts-ignore
    currentTemplateStatusForm.render(true);
  }
}

/**
 * Make an element a sibling to another element
 * @param {*} element - The element to make a sibling
 * @param {*} sibling - The sibling element
 */
function makeSibling(element, sibling) {
  element.parentNode.insertBefore(sibling, element.nextSibling);
}

const showSettingsButton = () => {
  const v13andUp = isVersionAtLeast(13);
  let button = document.querySelector("#PartySheet");
  const v12SettingsAreaName = "settings-fvtt-party-sheet";
  const v13SettingsAreaName = "fvtt-party-sheet-settings";
  let settingsArea = document.querySelector(`#${v12SettingsAreaName}`); //V12
  if (v13andUp) {
    settingsArea = document.querySelector(`.${v13SettingsAreaName}`);
  }

  if (!button) {
    if (v13andUp) {
      const sidebarSettings = document.querySelector("section.settings.flexcol");
      if (sidebarSettings && !settingsArea) {
        const settingsAreaSection = document.createElement("section");
        settingsAreaSection.classList.add(v13SettingsAreaName, "flexcol");
        const settingsAreaHeader = document.createElement("h4");
        settingsAreaHeader.classList.add("divider");
        // @ts-ignore
        settingsAreaHeader.textContent = game.i18n.localize("fvtt-party-sheet.section-title");
        settingsAreaSection.append(settingsAreaHeader);

        makeSibling(sidebarSettings, settingsAreaSection);

        let settingsButton = document.createElement("button");
        settingsButton.classList.add("settings-button");
        settingsButton.dataset.action = "openApp";
        settingsButton.type = "button";
        // @ts-ignore
        let localizedLabel = game.i18n.localize("fvtt-party-sheet.template-status.template-status");
        settingsButton.innerHTML = `<i class='fas fa-download'></i> ${localizedLabel}`;
        settingsButton.addEventListener("click", () => {
          toggleTemplateStatusForm();
        });
        makeSibling(settingsAreaHeader, settingsButton);

        settingsButton = document.createElement("button");
        settingsButton.classList.add("settings-button");
        settingsButton.dataset.action = "openApp";
        settingsButton.type = "button";
        // @ts-ignore
        localizedLabel = game.i18n.localize("fvtt-party-sheet.installer");
        settingsButton.innerHTML = `<i class='fas fa-download'></i> ${localizedLabel}`;
        settingsButton.addEventListener("click", () => {
          togglePartySheet({
            showInstaller: true,
          });
        });
        makeSibling(settingsAreaHeader, settingsButton);
      }
    } else {
      const sidebarSettings = document.querySelector("#settings-game");

      const settingsAreaHeader = document.createElement("h2");
      // @ts-ignore
      settingsAreaHeader.textContent = game.i18n.localize("fvtt-party-sheet.section-title");

      makeSibling(sidebarSettings, settingsAreaHeader);

      const settingsAreaDiv = document.createElement("div");
      settingsAreaDiv.id = v12SettingsAreaName;
      let settingsButton = document.createElement("button");
      settingsButton.classList.add("settings-button");
      // @ts-ignore
      let localizedLabel = game.i18n.localize("fvtt-party-sheet.template-status.template-status");
      settingsButton.innerHTML = `<i class='fas fa-download'></i> ${localizedLabel}`;
      settingsButton.addEventListener("click", () => {
        toggleTemplateStatusForm();
      });
      settingsAreaDiv.append(settingsButton);

      settingsButton = document.createElement("button");
      settingsButton.classList.add("settings-button");
      // @ts-ignore
      localizedLabel = game.i18n.localize("fvtt-party-sheet.installer");
      settingsButton.innerHTML = `<i class='fas fa-download'></i> ${localizedLabel}`;
      settingsButton.addEventListener("click", () => {
        togglePartySheet({
          showInstaller: true,
        });
      });
      settingsAreaDiv.append(settingsButton);

      makeSibling(settingsAreaHeader, settingsAreaDiv);
    }
  }
};

/**
 * Register the API
 */
function registerAPI() {
  // @ts-ignore
  game["fvtt-party-sheet"] = {};
  // @ts-ignore
  game["fvtt-party-sheet"].api = {
    togglePartySheet: togglePartySheet,
    toggleTemplateStatusForm: toggleTemplateStatusForm,
  };
  log("API registered");
}

/**
 * Runs after installation of template;
 */
async function afterInstall() {
  togglePartySheet();
  // @ts-ignore
  setTemplatesLoaded(false);
  await ReloadTemplates(true);
  currentPartySheet = null;
  setTimeout(() => {
    togglePartySheet();
  }, 550);
}

/* Hooks */

// @ts-ignore
Hooks.on("init", () => {
  log("Initializing");

  registerSettings();
});

// @ts-ignore
Hooks.on("ready", async () => {
  log("Ready");
  // @ts-ignore
  if (game.user.isGM) {
    registerAPI();
  }
  showSettingsButton();

  await ReloadTemplates(true);
});

const ReloadTemplates = async (fullReload = false) => {
  // @ts-ignore
  if (game.user.isGM) {
    if (fullReload) {
      clearCustomTemplates();
    }

    if (!areTemplatesLoaded() || fullReload) {
      await loadSystemTemplates();

      const template_validation = await validateSystemTemplates();
      // @ts-ignore
      game.settings.set("fvtt-party-sheet", "validationInfo", template_validation);

      // Show notification banners for version differences
      showVersionDifferenceNotifications(template_validation);
    }
  }
};

// @ts-ignore
Hooks.on("renderPlayerList", () => {
  // @ts-ignore
  const showOnlyOnlineUsers = game.settings.get("fvtt-party-sheet", "enableOnlyOnline");

  // @ts-ignore
  if (!game.user.isGM || !showOnlyOnlineUsers) {
    return;
  }
  if (currentPartySheet?.rendered) {
    currentPartySheet.doRender(true);
  }
});

// @ts-ignore
Hooks.on("getSceneControlButtons", (controls) => {
  const v13andUp = isVersionAtLeast(13);
  const button = {
    name: "partysheet",
    // @ts-ignore
    title: game.i18n.localize("fvtt-party-sheet.section-title"),
    icon: "fas fa-users",
    visible: true,
    onClick: () => togglePartySheet(),
    onChange: v13andUp ? () => {} : undefined,
    button: true,
  };

  // @ts-ignore
  if (!game.user.isGM) {
    return;
  }

  if (v13andUp) {
    controls.tokens.tools["partysheet"] = button;
  } else {
    controls.find((c) => c.name === "token").tools.push(button);
  }
});
