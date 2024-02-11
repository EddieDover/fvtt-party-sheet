import { HiddenCharactersSettings } from "./hidden-characters-settings";

export const registerSettings = () => {
  // @ts-ignore
  game.settings.register("theater-of-the-mind", "hiddenCharacters", {
    "scope": "world",
    "config": false,
    "default": [],
    "type": Array,
  });

  // @ts-ignore
  game.settings.register("theater-of-the-mind", "enableMinimalView", {
    "name": "theater-of-the-mind.settings.enable-minimal-view.name",
    "hint": "theater-of-the-mind.settings.enable-minimal-view.hint",
    "scope": "world",
    "config": true,
    "default": false,
    "type": Boolean,
  });

  // @ts-ignore
  game.settings.register("theater-of-the-mind", "enableOnlyOnline", {
    "name": "theater-of-the-mind.settings.enable-only-online.name",
    "hint": "theater-of-the-mind.settings.enable-only-online.hint",
    "scope": "world",
    "config": true,
    "default": true,
    "type": Boolean,
  });

  // @ts-ignore
  game.settings.register("theater-of-the-mind", "showDebugInfo", {
    "name": "theater-of-the-mind.settings.show-debug-info.name",
    "hint": "theater-of-the-mind.settings.show-debug-info.hint",
    "scope": "world",
    "config": true,
    "default": false,
    "type": Boolean,
  });

  // @ts-ignore
  game.settings.registerMenu("theater-of-the-mind", "configureHiddenCharacters", {
    "name": "",
    "label": "theater-of-the-mind.hide-sheet.button",
    "hint": "theater-of-the-mind.hide-sheet.hint",
    "icon": "fas fa-cog",
    "restricted": true,
    "type": HiddenCharactersSettings,
  });

  // // @ts-ignore
  // game.settings.register("theater-of-the-mind", "enableDarkMode", {
  //   "name": "theater-of-the-mind.settings.enable-dark-mode.name",
  //   "hint": "theater-of-the-mind.settings.enable-dark-mode.hint",
  //   "scope": "world",
  //   "config": true,
  //   "default": false,
  //   "type": Boolean,
  //   "onChange": () => {
  //     // Hooks.call("renderSceneControls");
  //   },
  // });

  // @ts-ignore
  game.settings.register("theater-of-the-mind", "enableSounds", {
    "name": "theater-of-the-mind.settings.enable-sounds.name",
    "hint": "theater-of-the-mind.settings.enable-sounds.hint",
    "scope": "world",
    "config": true,
    "default": false,
    "type": Boolean,
  });
};
