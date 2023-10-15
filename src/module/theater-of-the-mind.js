import { THEATER_SOUNDS } from "./sounds.js";

let isSyrinscapeInstalled = false;
let isMidiQoLInstalled = false;

function log(...message) {
  console.log("Theater of the Mind | ", message);
}

const getPlayerData = () => {
  try {
    return game.users
      .map((user) => {
        if (user.active && user.character) {
          const userChar = user.character;
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
        }
      })
      .filter((player) => player);
  } catch (ex) {
    log(ex);
  }
  return [];
};

const convertPlayerDataToTable = () => {
  try {
    const players = getPlayerData();
    if (players.length === 0) {
      return "No players connected";
    }

    let table = `<table id='totm-ps-table'>`;

    const localize = {
      name: game.i18n.localize("theater-of-the-mind.party-sheet.name"),
      race: game.i18n.localize("theater-of-the-mind.party-sheet.race"),
      senses: game.i18n.localize("theater-of-the-mind.party-sheet.senses"),
      classes: game.i18n.localize("theater-of-the-mind.party-sheet.classes"),
    };

    table += `<tr><th class="namerace"><div>${localize.name}</div><div>${localize.race}</div></th>`;
    for (const stat in players[0].stats) {
      table += `<th class="p-1">${stat.toUpperCase()}</th>`;
    }
    table += `<th>AC</th><th>Inv</th><th>${localize.senses}</th></tr>`;

    table += `<tr><th>${localize.classes}</th>`;
    for (let i = 0; i < 6; i++) {
      table += `<th></th>`;
    }
    table += ` <th class="p-1">Per</th><th class="p-1">Ins</th><th></th></tr>`;

    players.forEach((player) => {
      table += `<tr><td rowspan="2"><div class="totm-ps-name-bar">${player.img}`;
      table += `<div class='totm-ps-name-bar-namerace'>
          <div class='entry'>${player.name}</div>
          <div class='entry'>${player.race}</div>
          <div class='fullentry'>${player.classNames}</div>
      </div>`;
      table += `</div></td>`;
      for (const stat in player.stats) {
        table += `<td>${player.stats[stat].value}</td>`;
      }
      table += `<td>${player.ac}</td>`;
      table += `<td>${player.passives.inv}</td>`;
      table += `<td rowspan="2" style="white-space: nowrap;">${player.senses}</td>`;
      table += `</tr>`;

      table += `<tr class="totm-ps-finrow">`;
      for (const stat in player.stats) {
        table += `<td>${player.stats[stat].mod >= 0 ? "+" : ""}${
          player.stats[stat].mod
        }</td>`;
      }
      table += `<td>${player.passives.prc}</td>`;
      table += `<td>${player.passives.ins}</td>`;
      table += `</tr>`;
    });
    table += `</table>`;
    return table;
  } catch (ex) {
    log(ex);
    return ex.message;
  }
};

const PartySheetDialog = new Dialog({
  title: "Party Sheet",
  content: convertPlayerDataToTable(),
  classNames: ["totm-ps-dialog"],
  buttons: {
    close: {
      icon: '<i class="fas fa-times"></i>',
      label: "Close",
      callback: () => PartySheetDialog.close(),
    },
  },
  render: (html) => {
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
    "type": Boolean,
    "onChange": () => {
    },
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
