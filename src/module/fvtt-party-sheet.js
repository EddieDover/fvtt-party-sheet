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
} from "./utils.js";
import { TemplateStatusForm } from "./app/template-status.js";

let currentPartySheet = null;
let currentRefreshInterval = null;
let currentTemplateStatusForm = null;

// @ts-ignore
Handlebars.registerPartial(
  "installer",
  `
<div style="display:flex;flex-direction:row;flex-wrap:wrap">
{{#each moduleSystemTemplates as |template|}}
    <div style="display:flex;flex-direction:row;flex-wrap:nowrap;padding: 3px;border: 1px solid black;border-radius: 5px;margin: 5px;">
        <div class="fvtt-party-sheet-ps-system-name" style="display:flex;flex-direction:column;flex-wrap:nowrap;width:200px;max-height:300px;">
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
        <div style="font-weight:bolder;text-transform:uppercase;">{{localize "fvtt-party-sheet.template-system-version"}}:</div>
        <div style="flex-grow:1;">{{template.minimumSystemVersion}}</div>
        {{#if template.installedVersion}}
              {{#compVersion template.installedVersion template.version}}
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
                  style="background-color:#29b125"
                  class="fvtt-party-sheet-module-install-button"
                  data-modulepath="{{template.path}}"
              >
                {{localize "fvtt-party-sheet.update"}}
              </button>
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
                class="fvtt-party-sheet-module-install-button"
                data-modulepath="{{template.path}}"
              >
              {{localize "fvtt-party-sheet.install"}}
            </button>
            {{/if}}
          {{/if}}
        {{/if}}
        </div>
    </div>
{{/each}}
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

/**
 * Toggles the party sheet
 */
function togglePartySheet() {
  if (currentPartySheet?.rendered) {
    currentPartySheet.close();
  } else {
    currentPartySheet = new PartySheetForm(afterInstall);
    // @ts-ignore
    currentPartySheet.render(true);

    // @ts-ignore
    const refreshRate = game.settings.get("fvtt-party-sheet", "refreshRate");
    if (refreshRate > 0) {
      currentRefreshInterval = setInterval(() => refreshSheet(), refreshRate * 1000);
    } else {
      if (currentRefreshInterval) {
        clearInterval(currentRefreshInterval);
      }
    }
  }
}

/**
 * Refreshes the party sheet
 */
function refreshSheet() {
  if (currentPartySheet?.rendered) {
    currentPartySheet.render(false, {
      focus: false,
    });
  } else {
    clearInterval(currentRefreshInterval);
  }
}

/**
 * Toggles the template status form
 * @param {TemplateValidityReturnData} template_validation - The template validation data
 */
function toggleTemplateStatusForm(template_validation) {
  if (currentTemplateStatusForm?.rendered) {
    currentTemplateStatusForm.close();
  } else {
    currentTemplateStatusForm = new TemplateStatusForm();
    // @ts-ignore
    currentTemplateStatusForm.render(true);
  }
}

const showButton = () => {
  if (areTemplatesLoaded()) {
    let v13AndUp = false;
    let controls = null;

    // @ts-ignore
    const version = game.version.split(".").map((v) => parseInt(v, 10));
    const majorVersion = version[0];

    if (majorVersion >= 13) {
      // @ts-ignore
      controls = $("#scene-controls-tools");
      v13AndUp = true;
    } else {
      // @ts-ignore
      controls = $("#tools-panel-token");
    }

    if (v13AndUp) {
      const newli = document.createElement("li");
      const newbutton = document.createElement("button");
      newbutton.setAttribute("type", "button");
      newbutton.setAttribute("class", "control ui-control tool icon toggle fas fa-users");
      newbutton.setAttribute("data-tool", "PartySheet");
      newbutton.setAttribute("aria-label", "Party Sheet");
      newbutton.setAttribute("aria-pressed", "false");
      newbutton.setAttribute(
        "data-tooltip-html",
        '<div class="toolclip themed theme-dark"><h4>Party Sheet</h4><p>Show the Party Sheet</p></div>',
      );
      newbutton.addEventListener("click", () => togglePartySheet());
      newli.appendChild(newbutton);
      if (controls.find(".control[data-tool='PartySheet']").length === 0) {
        controls.append(newli);
      }
    } else {
      // @ts-ignore
      const button = $(`<li class="control-tool "
      data-tool="PartySheet"
      aria-label="Show Party Sheet"
      role="button"
      data-tooltip="Party Sheet">
      <i class="fas fa-users"></i>
    </li>`);
      button.click(() => togglePartySheet());

      if (controls.find(".control-tool[data-tool='PartySheet']").length === 0) {
        controls.append(button);
      }
    }
  }
};

const hideButton = () => {
  // @ts-ignore
  const control_parent = $("#tools-panel-token");
  const controls = control_parent.find(".control-tool[data-tool='PartySheet']");
  if (controls.length > 0) {
    for (const control of controls) {
      control.remove();
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
  await ReloadTemplates(true);
});

const ReloadTemplates = async (fullReload = false) => {
  // @ts-ignore
  if (game.user.isGM) {
    hideButton();

    if (fullReload) {
      clearCustomTemplates();
    }

    if (!areTemplatesLoaded() || fullReload) {
      await loadSystemTemplates();

      const template_validation = await validateSystemTemplates();
      // @ts-ignore
      game.settings.set("fvtt-party-sheet", "validationInfo", template_validation);
    }

    showButton();
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
    currentPartySheet.render(true);
  }
});

// @ts-ignore
Hooks.on("renderSceneControls", () => {
  showButton();
});
