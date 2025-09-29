/* eslint-disable no-undef */
// @ts-ignore
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class HiddenCharactersSettings extends HandlebarsApplicationMixin(ApplicationV2) {
  static _instance = null;

  static DEFAULT_OPTIONS = {
    tag: "form",
    form: {
      handler: HiddenCharactersSettings.formHandler,
      submitOnChange: false,
      closeOnSubmit: false,
    },
    window: {
      title: "fvtt-party-sheet.hide-sheet.button",
      width: "auto",
      height: "auto",
    },
    classes: ["fvtt-party-sheet-hidden-characters-settings"],
    actions: {
      onSubmit: HiddenCharactersSettings.onSubmit,
      onReset: HiddenCharactersSettings.onReset,
    },
  };

  static PARTS = {
    form: {
      template: "modules/fvtt-party-sheet/templates/hidden-characters.hbs",
    },
  };

  static async formHandler(event, form, formData) {
    event.preventDefault();
    event.stopPropagation();
    // Handle form submission logic here if needed
  }

  constructor(overrides) {
    super();
    this.overrides = overrides || {};
    // Store reference to this instance
    HiddenCharactersSettings._instance = this;
  }

  static getInstance(overrides) {
    // If an instance exists and is rendered, bring it to focus
    if (HiddenCharactersSettings._instance && HiddenCharactersSettings._instance.rendered) {
      HiddenCharactersSettings._instance.bringToTop();
      return HiddenCharactersSettings._instance;
    }
    // Otherwise create a new instance
    return new HiddenCharactersSettings(overrides);
  }

  close(options) {
    // Clear the static reference when closing
    if (HiddenCharactersSettings._instance === this) {
      HiddenCharactersSettings._instance = null;
    }
    return super.close(options);
  }

  _prepareContext(options) {
    // @ts-ignore
    this.characterList = game.actors
      .filter((actor) => actor.type !== "npc")
      .map((actor) => {
        return { "uuid": actor.uuid, "name": actor.name };
      });
    // @ts-ignore
    const hiddenCharacters = game.settings.get("fvtt-party-sheet", "hiddenCharacters");
    // @ts-ignore
    const enableOnlyOnline = game.settings.get("fvtt-party-sheet", "enableOnlyOnline");

    return {
      characters: this.characterList,
      hiddenCharacters,
      enableOnlyOnline,
      overrides: this.overrides,
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    // Actions are automatically bound by ApplicationV2
  }

  saveHiddenCharacters(event) {
    if (event) event.preventDefault();

    const hiddenCharacters = [];
    for (const character of this.characterList) {
      const checkbox = document.getElementById(`hidden-character-${character.uuid}`);
      // @ts-ignore
      if (checkbox.checked) {
        hiddenCharacters.push(character.uuid);
      }
    }
    // @ts-ignore
    game.settings.set("fvtt-party-sheet", "hiddenCharacters", hiddenCharacters);
    const closefunc = this.overrides?.onexit;
    if (closefunc) {
      closefunc();
    }
    // @ts-ignore
    this.close();
  }

  resetEffects(event) {
    if (event) event.preventDefault();
    // @ts-ignore
    this.render();
  }

  static onSubmit(event, target) {
    event.preventDefault();
    // @ts-ignore
    this.saveHiddenCharacters(event);
  }

  static onReset(event, target) {
    event.preventDefault();
    // @ts-ignore
    this.resetEffects(event);
  }
}
