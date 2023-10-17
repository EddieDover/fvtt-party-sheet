/* eslint-disable no-undef */
import { HiddenCharactersSettings } from "./hidden-characters-settings.js";

export class PartySheetForm extends FormApplication {
  constructor() {
    super();
  }

  getPlayerData() {
    const showOnlyOnlineUsers = game.settings.get("theater-of-the-mind", "enableOnlyOnline");
    const actorList = showOnlyOnlineUsers
      ? game.users.filter((user) => user.active && user.character).map((user) => user.character)
      : game.actors.filter((actor) => actor.type !== "npc");

    try {
      return actorList
        .map((character) => {
          const userChar = character;
          const userSys = userChar.system;
          const stats = userSys.abilities;
          const ac = userSys.attributes.ac.value;

          const passives = {
            prc: userSys.skills.prc.passive,
            inv: userSys.skills.inv.passive,
            ins: userSys.skills.ins.passive,
          };

          const classNamesAndLevels = Object.values(userChar.classes).map((c) => `${c.name} ${c.system.levels}`);

          const charToken = userChar.prototypeToken;

          const charSenses = [];
          if (userSys.attributes.senses.darkvision) {
            charSenses.push(`Darkvision ${userSys.attributes.senses.darkvision} ${userSys.attributes.senses.units}`);
          }
          if (userSys.attributes.senses.blindsight) {
            charSenses.push(`Blindsight ${userSys.attributes.senses.blindsight} ${userSys.attributes.senses.units}`);
          }
          if (userSys.attributes.senses.tremorsense) {
            charSenses.push(`Tremorsense ${userSys.attributes.senses.tremorsense} ${userSys.attributes.senses.units}`);
          }
          if (userSys.attributes.senses.truesight) {
            charSenses.push(`Truesight ${userSys.attributes.senses.truesight} ${userSys.attributes.senses.units}`);
          }
          if (userSys.attributes.senses.special) {
            charSenses.push(userSys.attributes.senses.special);
          }

          return {
            name: userChar.name,
            race: userChar.system.details.race,
            uuid: userChar.uuid,
            img: `<input type="image" name="totm-actorimage" data-actorid="${
              character.uuid
            }" class="token-image" src="${charToken.texture.src}" title="${
              charToken.name
            }" width="36" height="36" style="transform: rotate(${charToken.rotation ?? 0}deg);"/>`,
            senses: charSenses.join(", "),
            classNames: classNamesAndLevels.join(" - ") || "",
            stats,
            ac,
            passives,
          };
        })
        .filter((player) => player);
    } catch (ex) {
      console.log(ex);
    }
    return [];
  }

  // eslint-disable-next-line no-unused-vars
  _updateObject(event, formData) {
    // Update the currently loggged in players
  }

  getData(options) {
    const hiddenCharacters = game.settings.get("theater-of-the-mind", "hiddenCharacters");
    const enableOnlyOnline = game.settings.get("theater-of-the-mind", "enableOnlyOnline");
    let players = this.getPlayerData();

    if (!enableOnlyOnline) {
      players = players.filter((player) => !hiddenCharacters.includes(player.uuid));
    }

    return mergeObject(super.getData(options), {
      hiddenCharacters,
      enableOnlyOnline,
      players,
      overrides: this.overrides,
    });
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "totm-party-sheet",
      classes: ["form"],
      title: "Party Sheet",
      template: "modules/theater-of-the-mind/templates/party-sheet.hbs",
      width: "auto",
      height: "auto",
    });
  }

  // saveHiddenCharacters() {
  //   const hiddenCharacters = [];
  //   for (const character of this.characterList) {
  //     const checkbox = document.getElementById(`hidden-character-${character}`);
  //     if (checkbox.checked) {
  //       hiddenCharacters.push(character);
  //     }
  //   }
  //   game.settings.set('theater-of-the-mind', 'hiddenCharacters', hiddenCharacters);
  //   const closefunc = this.overrides?.onexit;
  //   if (closefunc) {
  //     closefunc();
  //   }
  //   super.close();
  // }

  // resetEffects() {
  //   // this.effects = game.settings.settings.get('monks-little-details.additional-effects').default;
  //   this.refresh();
  // }

  openOptions(event) {
    event.preventDefault();
    const overrides = {
      onexit: () => {
        // this.close();
        setTimeout(() => {
          this.render(true);
        }, 350);
      },
    };
    const hcs = new HiddenCharactersSettings(overrides);
    hcs.render(true);
  }

  closeWindow() {
    this.close();
  }

  openActorSheet(event) {
    const actorId = event.currentTarget.dataset.actorid;
    const actor = game.actors.get(actorId.replace("Actor.", ""));
    actor.sheet.render(true);
  }

  activateListeners(html) {
    super.activateListeners(html);
    $('button[name="totm-options"]', html).click(this.openOptions.bind(this));
    $('button[name="totm-close"]', html).click(this.closeWindow.bind(this));
    $('input[name="totm-actorimage"]', html).click(this.openActorSheet.bind(this));
    // $('button[name="submit"]', html).click(this.saveHiddenCharacters.bind(this));
    // $('button[name="reset"]', html).click(this.resetEffects.bind(this));
  }
}
