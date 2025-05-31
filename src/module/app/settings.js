import { HiddenCharactersSettings } from "./hidden-characters-settings";
import { TemplateStatusForm } from "./template-status";

export const registerSettings = () => {
  // @ts-ignore
  game.settings.register("fvtt-party-sheet", "hiddenCharacters", {
    "scope": "world",
    "config": false,
    "default": [],
    "type": Array,
  });

  // @ts-ignore
  game.settings.register("fvtt-party-sheet", "validationInfo", {
    "scope": "world",
    "config": false,
    default: {
      outOfDateTemplates: [],
      outOfDateSystems: [],
      noVersionInformation: [],
      noSystemInformation: [],
    },
    "type": Object,
  });

  // @ts-ignore
  game.settings.register("fvtt-party-sheet", "refreshRate", {
    "name": "fvtt-party-sheet.settings.refresh-rate.name",
    "hint": "fvtt-party-sheet.settings.refresh-rate.hint",
    "scope": "world",
    "config": true,
    "default": 0,
    "type": Number,
  });

  // @ts-ignore
  game.settings.register("fvtt-party-sheet", "enableMinimalView", {
    "name": "fvtt-party-sheet.settings.enable-minimal-view.name",
    "hint": "fvtt-party-sheet.settings.enable-minimal-view.hint",
    "scope": "world",
    "config": true,
    "default": false,
    "type": Boolean,
  });

  // @ts-ignore
  game.settings.register("fvtt-party-sheet", "enableOnlyOnline", {
    "name": "fvtt-party-sheet.settings.enable-only-online.name",
    "hint": "fvtt-party-sheet.settings.enable-only-online.hint",
    "scope": "world",
    "config": true,
    "default": true,
    "type": Boolean,
  });

  // @ts-ignore
  game.settings.register("fvtt-party-sheet", "showDebugInfo", {
    "name": "fvtt-party-sheet.settings.show-debug-info.name",
    "hint": "fvtt-party-sheet.settings.show-debug-info.hint",
    "scope": "world",
    "config": true,
    "default": false,
    "type": Boolean,
  });

  // @ts-ignore
  game.settings.registerMenu("fvtt-party-sheet", "configureHiddenCharacters", {
    "name": "",
    "label": "fvtt-party-sheet.hide-sheet.button",
    "hint": "fvtt-party-sheet.hide-sheet.hint",
    "icon": "fas fa-cog",
    "restricted": true,
    "type": HiddenCharactersSettings,
  });

  // @ts-ignore
  game.settings.registerMenu("fvtt-party-sheet", "showTemplateStatusForm", {
    "name": "",
    "label": "fvtt-party-sheet.settings.show-template-status-form.name",
    "hint": "fvtt-party-sheet.settings.show-template-status-form.hint",
    "icon": "fas fa-heartbeat",
    "restructed": true,
    "type": TemplateStatusForm,
  });
};
