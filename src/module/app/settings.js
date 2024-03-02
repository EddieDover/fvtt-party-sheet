import { HiddenCharactersSettings } from "./hidden-characters-settings";

export const registerSettings = () => {
  // @ts-ignore
  game.settings.register("fvtt-party-sheet", "hiddenCharacters", {
    "scope": "world",
    "config": false,
    "default": [],
    "type": Array,
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
};
