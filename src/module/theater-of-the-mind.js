import { THEATER_SOUNDS } from "./sounds.js";

let isSyrinscapeInstalled = false;
let isMidiQoLInstalled = false;

function log(...message) {
  console.log("Theater of the Mind | ", message);
}

const getPlayerData = () => {

  const showOnlyOnlineUsers = game.settings.get("theater-of-the-mind", "enableOnlyOnline");
  const actorList = showOnlyOnlineUsers ? game.users.filter( (user) => user.active && user.character).map(user => user.character) : game.actors.filter(actor => actor.type !== "npc");
  //const actorList = game.users.filter( (user) => user.active && user.character).map(user => user.character);

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

          const classNamesAndLevels = Object.values(userChar.classes).map(
            (c) => `${c.name} ${c.system.levels}`,
          );

          const charToken = userChar.prototypeToken;

          const charSenses = [];
          if (userSys.attributes.senses.darkvision) {
            charSenses.push(
              `Darkvision ${userSys.attributes.senses.darkvision} ${userSys.attributes.senses.units}`,
            );
          }
          if (userSys.attributes.senses.blindsight) {
            charSenses.push(
              `Blindsight ${userSys.attributes.senses.blindsight} ${userSys.attributes.senses.units}`,
            );
          }
          if (userSys.attributes.senses.tremorsense) {
            charSenses.push(
              `Tremorsense ${userSys.attributes.senses.tremorsense} ${userSys.attributes.senses.units}`,
            );
          }
          if (userSys.attributes.senses.truesight) {
            charSenses.push(
              `Truesight ${userSys.attributes.senses.truesight} ${userSys.attributes.senses.units}`,
            );
          }
          if (userSys.attributes.senses.special) {
            charSenses.push(userSys.attributes.senses.special);
          }

          return {
            name: userChar.name,
            race: userChar.system.details.race,
            img: `<img class="token-image" src="${
              charToken.texture.src
            }" title="${
              charToken.name
            }" width="36" height="36" style="transform: rotate(${
              charToken.rotation ?? 0
            }deg);"></img>`,
            senses: charSenses.join(", "),
            classNames: classNamesAndLevels.join(" - ") || "",
            stats,
            ac,
            passives,
          };

      })
      .filter((player) => player);
  } catch (ex) {
    log(ex);
  }
  return [];
};

export function hidePlayer(name) {
  console.log("theater", "Hiding Player: " + name);
}

const convertPlayerDataToTable = () => {
  const showOnlyOnlineUsers = game.settings.get("theater-of-the-mind", "enableOnlyOnline") ?? true;
  const currentlyHiddenCharacters = game.settings.get('theater-of-the-mind', 'hiddenCharacters') ?? [];
  try {
    const players = getPlayerData();
    if (players.length === 0) {
      return "No players connected";
    }

    const localize = {
      name: game.i18n.localize("theater-of-the-mind.party-sheet.name"),
      race: game.i18n.localize("theater-of-the-mind.party-sheet.race"),
      senses: game.i18n.localize("theater-of-the-mind.party-sheet.senses"),
      classes: game.i18n.localize("theater-of-the-mind.party-sheet.classes"),
    };
    let table = `<table id='totm-ps-table'>`;
    let thead = `<tr><th class="namerace"><div>${localize.name}</div><div>${localize.race}</div></th>`;
    for (const stat in players[0].stats) {
      thead += `<th class="p-1">${stat.toUpperCase()}</th>`;
    }
    thead += `<th>AC</th><th>Inv</th><th>${localize.senses}</th>`;
    if (!showOnlyOnlineUsers) {
      // Add a column for the 'hide' selection.
      thead += `<th>Hide</th>`;
    }
    thead += `</tr>`;

    thead += `<tr><th>${localize.classes}</th>`;
    for (let i = 0; i < 6; i++) {
      thead += `<th></th>`;
    }
    thead += ` <th class="p-1">Per</th><th class="p-1">Ins</th><th></th></tr>`;

    table += thead;
    let tbody = "";
    players.filter(player => !currentlyHiddenCharacters.includes(player.name)).forEach((player) => {
      let pbody = `<tr><td rowspan="2"><div class="totm-ps-name-bar">${player.img}`;
      pbody += `<div class='totm-ps-name-bar-namerace'>
          <div class='entry'>${player.name}</div>
          <div class='entry'>${player.race}</div>
          <div class='fullentry'>${player.classNames}</div>
      </div>`;
      pbody += `</div></td>`;
      for (const stat in player.stats) {
        pbody += `<td>${player.stats[stat].value}</td>`;
      }
      pbody += `<td>${player.ac}</td>`;
      pbody += `<td>${player.passives.inv}</td>`;
      pbody += `<td rowspan="2" style="white-space: nowrap;">${player.senses}</td>`;
      if (!showOnlyOnlineUsers) {
        pbody += `<td rowspan='2'>`;
        pbody += `<button type="button" class="hideplayer" data-playername='${player.name}'>Hide</button>`;
        pbody += `</td>`;
      }
      pbody += `</tr>`;

      pbody += `<tr class="totm-ps-finrow">`;
      for (const stat in player.stats) {
        pbody += `<td>${player.stats[stat].mod >= 0 ? "+" : ""}${
          player.stats[stat].mod
        }</td>`;
      }
      pbody += `<td>${player.passives.prc}</td>`;
      pbody += `<td>${player.passives.ins}</td>`;
      pbody += `</tr>`;
      tbody += pbody;
    });
    table += tbody + `</table>`;
    let hiddenstuff = `<details><summary>Hidden Characters</summary>`;

    let hiddentable = `<table id='totm-ps-table'>`;
    let hiddenthead = `<tr><th class="namerace"><div>${localize.name}</div><div>${localize.race}</div></th>`;
    for (const stat in players[0].stats) {
      hiddenthead += `<th class="p-1">${stat.toUpperCase()}</th>`;
    }
    hiddenthead += `<th>AC</th><th>Inv</th><th>${localize.senses}</th>`;
    if (!showOnlyOnlineUsers) {
      // Add a column for the 'hide' selection.
      hiddenthead += `<th>Hide</th>`;
    }
    hiddenthead += `</tr>`;

    hiddenthead += `<tr><th>${localize.classes}</th>`;
    for (let i = 0; i < 6; i++) {
      hiddenthead += `<th></th>`;
    }
    hiddenthead += ` <th class="p-1">Per</th><th class="p-1">Ins</th><th></th></tr>`;

    hiddentable += hiddenthead;
    let hiddentbody = "";

    players.filter(player => currentlyHiddenCharacters.includes(player.name)).forEach((player) => {
      let pbody = `<tr><td rowspan="2"><div class="totm-ps-name-bar">${player.img}`;
      pbody += `<div class='totm-ps-name-bar-namerace'>
          <div class='entry'>${player.name}</div>
          <div class='entry'>${player.race}</div>
          <div class='fullentry'>${player.classNames}</div>
      </div>`;
      pbody += `</div></td>`;
      for (const stat in player.stats) {
        pbody += `<td>${player.stats[stat].value}</td>`;
      }
      pbody += `<td>${player.ac}</td>`;
      pbody += `<td>${player.passives.inv}</td>`;
      pbody += `<td rowspan="2" style="white-space: nowrap;">${player.senses}</td>`;
      if (!showOnlyOnlineUsers) {
        pbody += `<td rowspan='2'>`;
        pbody += `<button type="button" class="showplayer" data-playername='${player.name}'>Show</button>`;
        pbody += `</td>`;
      }
      pbody += `</tr>`;

      pbody += `<tr class="totm-ps-finrow">`;
      for (const stat in player.stats) {
        pbody += `<td>${player.stats[stat].mod >= 0 ? "+" : ""}${
          player.stats[stat].mod
        }</td>`;
      }
      pbody += `<td>${player.passives.prc}</td>`;
      pbody += `<td>${player.passives.ins}</td>`;
      pbody += `</tr>`;
      hiddentbody += pbody;
    });
    hiddentable += hiddentbody + `</table>`;

    hiddenstuff += hiddentable + `</details>`
    const html = showOnlyOnlineUsers ? table : table + hiddenstuff;
    return html;
  } catch (ex) {
    log(ex);
    return ex.message;
  }
};

const PartySheetDialog = new Dialog({
  title: "Party Sheet",
  content: null, //convertPlayerDataToTable(),
  classNames: ["totm-ps-dialog"],
  buttons: {
    close: {
      icon: '<i class="fas fa-times"></i>',
      label: "Close",
      callback: () => PartySheetDialog.close(),
    },
  },
  render: (html) => {
    html.on('click', 'button.hideplayer', (event) => {
      // Get the data-playername attribute from the button
      const name = event.currentTarget.dataset.playername ?? '';
      if (name) {
        let currentlyHiddenCharacters = game.settings.get('theater-of-the-mind', 'hiddenCharacters') ?? [];
        if (!currentlyHiddenCharacters.includes(name)) {
          currentlyHiddenCharacters.push(name);
          game.settings.set('theater-of-the-mind', 'hiddenCharacters', currentlyHiddenCharacters);
          setTimeout(() => {
            PartySheetDialog.data.content = convertPlayerDataToTable();
            PartySheetDialog.render(true);
          }, 250);
        }
      }
    });
    html.on('click', 'button.showplayer', (event) => {
      // Get the data-playername attribute from the button
      const name = event.currentTarget.dataset.playername ?? '';
      if (name) {
        let currentlyHiddenCharacters = game.settings.get('theater-of-the-mind', 'hiddenCharacters') ?? [];
        currentlyHiddenCharacters = currentlyHiddenCharacters.filter(player => player !== name);
        game.settings.set('theater-of-the-mind', 'hiddenCharacters', currentlyHiddenCharacters);
        setTimeout(() => {
          PartySheetDialog.data.content = convertPlayerDataToTable();
          PartySheetDialog.render(true);
        }, 250);
      }
    });
    if (game.settings.get("theater-of-the-mind", "enableDarkMode")) {
      var parentElement = html[0].parentElement;
      parentElement.id = "totm-dialog-darkmode";
    }
    PartySheetDialog.setPosition({
      height: "auto",
      width: 600,
    });
  },
});

function togglePartySheet() {
  if (PartySheetDialog.rendered) {
    PartySheetDialog.close();
  } else {
    PartySheetDialog.data.content = convertPlayerDataToTable();
    PartySheetDialog.render(true);
  }
}

async function playSound(weapon, crit, hitmiss, override = null) {

  if (!isSyrinscapeInstalled || !isMidiQoLInstalled) { return ;}

  const hitmisscrit = override ? "any" : (crit ? "critical" : hitmiss ? "hit" : "miss");

  if (!game.settings.get("theater-of-the-mind", "enableSounds")) {
    return;
  }

  // Get the sound from the THEATER_SOUNDS object
  const weaponsound = THEATER_SOUNDS[weapon.toLowerCase()];

  if (!weaponsound) {
    log(`No sound key found [${weapon.toLowerCase()}].`);
    return;
  }

  const subsound = hitmisscrit.toLowerCase() || "any";
  const soundid = weaponsound[subsound];

  if (!soundid) {
    log(
      `Key found: [${weapon.toLowerCase()}], No sound sub-type found [${subsound}].`,
    );
  } else {
    game.syrinscape.playElement(soundid);
  }
}
/* Hooks */

Hooks.on("init", () => {
  log("Initializing");

  game.settings.register('theater-of-the-mind', 'hiddenCharacters', {
    "scope":"world",
    "config": false,
    "default": [],
    "type": Array
  });

  game.settings.register("theater-of-the-mind", "enableOnlyOnline", {
    "name": "theater-of-the-mind.settings.enable-only-online.name",
    "hint": "theater-of-the-mind.settings.enable-only-online.hint",
    "scope": "world",
    "config": true,
    "default": true,
    "type": Boolean
  });

  game.settings.register("theater-of-the-mind", "enableDarkMode", {
    "name": "theater-of-the-mind.settings.enable-dark-mode.name",
    "hint": "theater-of-the-mind.settings.enable-dark-mode.hint",
    "scope": "world",
    "config": true,
    "default": false,
    "type": Boolean,
    "onChange": () => {
      // Hooks.call("renderSceneControls");
    },
  });

  game.settings.register("theater-of-the-mind", "enableSounds", {
    "name": "theater-of-the-mind.settings.enable-sounds.name",
    "hint": "theater-of-the-mind.settings.enable-sounds.hint",
    "scope": "world",
    "config": true,
    "default": false,
    "type": Boolean
  });
});

//
Hooks.on('midi-qol.AttackRollComplete', async (roll) => {
  const weapon = roll.item.name;
  const roll_results = roll.attackTotal;
  const target = roll?.targets?.values().next().value || null;
  const target_actor = target?.document?.actors?.values().next().value || null;
  const ac = target_actor?.system?.attributes?.ac?.value || null;

  if (ac) {
    playSound(weapon, roll_results === 20, roll_results >= ac);
  }

});

Hooks.on('midi-qol.preambleComplete', async (roll) => {

  if (roll?.item?.type != "spell") {
    return;
  }
  playSound(roll.item.name, false, false, "any");

})

Hooks.on("ready", async () => {
  log("Ready");

  isSyrinscapeInstalled = game.modules.get("fvtt-syrin-control")?.active || false;
  log(`Syrinscape is installed: ${isSyrinscapeInstalled}`);

  isMidiQoLInstalled =
  game.modules.get("midi-qol")?.active || false;
  log(`Midi-QoL is installed: ${isMidiQoLInstalled}`);

  const soundsReady = isSyrinscapeInstalled && isMidiQoLInstalled;
  log(`Sounds enabled: ${soundsReady}`);
});

// When a player connects or disconnects, refresh the combined view
Hooks.on("renderPlayerList", () => {
  // Check if user is GM
  if (!game.user.isGM) {
    return;
  }
  if (PartySheetDialog.rendered) {
    PartySheetDialog.data.content = convertPlayerDataToTable();
    PartySheetDialog.render(true);
  }
});

Hooks.on("renderSceneControls", () => {
  const showButton = game.user.isGM

  const button = $(`<li class="control-tool "
            data-tool="PartySheet"
            aria-label="Show Party Sheet"
            role="button"
            data-tooltip="Party Sheet">
            <i class="fas fa-users"></i>
        </li>`);
  button.click(() => togglePartySheet());
  const controls = $("#tools-panel-token");

  // Render the button if the showButton is true and the button doesn't already exist
  if (showButton && controls.find(".control-tool[data-tool='PartySheet']")) {
    controls.append(button);
  } else if (!showButton) {
    controls.find(".control-tool[data-tool='PartySheet']").remove();
  }
});
