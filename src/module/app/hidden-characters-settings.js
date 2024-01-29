/* eslint-disable no-undef */
// @ts-ignore
export class HiddenCharactersSettings extends FormApplication {
  constructor(overrides) {
    super();
    this.overrides = overrides || {};
  }

  getData(options) {
    // @ts-ignore
    this.characterList = game.actors
      .filter((actor) => actor.type !== "npc")
      .map((actor) => {
        return { "uuid": actor.uuid, "name": actor.name };
      });
    // @ts-ignore
    const hiddenCharacters = game.settings.get("theater-of-the-mind", "hiddenCharacters");
    // @ts-ignore
    const enableOnlyOnline = game.settings.get("theater-of-the-mind", "enableOnlyOnline");

    // @ts-ignore
    return mergeObject(super.getData(options), {
      characters: this.characterList,
      hiddenCharacters,
      enableOnlyOnline,
      overrides: this.overrides,
    });
  }

  static get defaultOptions() {
    // @ts-ignore
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "totm-hidden-characters-settings",
      classes: ["form"],
      title: "Configure Hidden Characters",
      // resizable: true,
      template: "modules/theater-of-the-mind/templates/hidden-characters.hbs",
      // @ts-ignore
      width: "auto", // $(window).width() > 960 ? 960 : $(window).width() - 100,
      height: "auto",
    });
  }

  saveHiddenCharacters() {
    const hiddenCharacters = [];
    for (const character of this.characterList) {
      const checkbox = document.getElementById(`hidden-character-${character.uuid}`);
      // @ts-ignore
      if (checkbox.checked) {
        hiddenCharacters.push(character.uuid);
      }
    }
    // @ts-ignore
    game.settings.set("theater-of-the-mind", "hiddenCharacters", hiddenCharacters);
    const closefunc = this.overrides?.onexit;
    if (closefunc) {
      closefunc();
    }
    super.close();
  }

  resetEffects() {
    // this.effects = game.settings.settings.get('monks-little-details.additional-effects').default;
    // @ts-ignore
    this.refresh();
  }

  activateListeners(html) {
    super.activateListeners(html);
    // @ts-ignore
    $('button[name="submit"]', html).click(this.saveHiddenCharacters.bind(this));
    // @ts-ignore
    $('button[name="reset"]', html).click(this.resetEffects.bind(this));
  }
}
