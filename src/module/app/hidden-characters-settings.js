/* eslint-disable no-undef */
export class HiddenCharactersSettings extends FormApplication {
  constructor(overrides) {
    super();
    this.overrides = overrides || {};
  }

  getData(options) {
    this.characterList = game.actors
      .filter((actor) => actor.type !== "npc")
      .map((actor) => {
        return { "uuid": actor.uuid, "name": actor.name };
      });
    const hiddenCharacters = game.settings.get("theater-of-the-mind", "hiddenCharacters");
    const enableOnlyOnline = game.settings.get("theater-of-the-mind", "enableOnlyOnline");

    return mergeObject(super.getData(options), {
      characters: this.characterList,
      hiddenCharacters,
      enableOnlyOnline,
      overrides: this.overrides,
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "totm-hidden-characters-settings",
      classes: ["form"],
      title: "Configure Hidden Characters",
      template: "modules/theater-of-the-mind/templates/hidden-characters.hbs",
      width: "auto",
      height: 300,
    });
  }

  saveHiddenCharacters() {
    const hiddenCharacters = [];
    for (const character of this.characterList) {
      const checkbox = document.getElementById(`hidden-character-${character.uuid}`);
      if (checkbox.checked) {
        hiddenCharacters.push(character.uuid);
      }
    }
    game.settings.set("theater-of-the-mind", "hiddenCharacters", hiddenCharacters);
    const closefunc = this.overrides?.onexit;
    if (closefunc) {
      closefunc();
    }
    super.close();
  }

  resetEffects() {
    // this.effects = game.settings.settings.get('monks-little-details.additional-effects').default;
    this.refresh();
  }

  activateListeners(html) {
    super.activateListeners(html);
    $('button[name="submit"]', html).click(this.saveHiddenCharacters.bind(this));
    $('button[name="reset"]', html).click(this.resetEffects.bind(this));
  }
}
