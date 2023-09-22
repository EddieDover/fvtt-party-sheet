import { THEATER_SOUNDS } from "./sounds.js";

import "./styles/theater-of-the-mind.scss";

let pendingMessages = [];
let isSyrinscapeInstalled = false;
let isAttackRollCheckInstalled = false;

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
            per: userSys.skills.per.passive,
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
      table += `<td>${player.passives.per}</td>`;
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
  buttons: {
    close: {
      icon: '<i class="fas fa-times"></i>',
      label: "Close",
      callback: () => PartySheetDialog.close(),
    },
  },
  render: () => {
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

async function playSound(message, type, hitmisscrit) {
  // TODO: Use our own implementation of Syrinscape? Maybe we can use the API to search instead of hard coding sounds.

  if (!game.settings.get("theater-of-the-mind", "enableSounds")) {
    return;
  }

  // Get the attack weapon from the message
  const regexPattern = new RegExp(`(.*) - ${type}`, "i");
  const matchResult = message?.flavor.match(regexPattern);
  const backup = message?.flavor ?? "";
  const primary = matchResult ? matchResult[1] : backup;

  // Get the sound from the THEATER_SOUNDS object
  const primarysound = THEATER_SOUNDS[primary.toLowerCase()];
  if (!primarysound) {
    log(`No sound key found [${primary.toLowerCase()}].`);
    return;
  }

  const subsound = hitmisscrit.toLowerCase() || "any";
  const soundid = primarysound[subsound];

  if (!soundid) {
    log(
      `Key found: [${primary.toLowerCase()}], No sound sub-type found [${subsound}].`,
    );
  } else {
    game.syrinscape.playElement(soundid);
  }
}

async function parseMessagesForSounds(message) {
  if (!game.settings.get("theater-of-the-mind", "enableSounds")) {
    return;
  }

  if (message.flags?.["attack-roll-check-5e"]?.isResultCard) {
    const roll = message.content.match(
      /<div class="roll-display">(.*)<\/div>/,
    )[1];

    const applicableMessages =
      game.messages.filter(
        (imessage) =>
          imessage.flavor.toLowerCase().includes("attack roll") &&
          imessage.content.includes(roll),
      ) || [];

    if (applicableMessages.length > 0) {
      const applicableMessage =
        applicableMessages[applicableMessages.length - 1];
      pendingMessages = pendingMessages.filter(
        (imessage) => imessage !== applicableMessage,
      );
      const hitmisscrit = message.content.match(
        /<div class="status-chip ([a-z]*)">/,
      )[1];

      playSound(applicableMessage, "Attack Roll", hitmisscrit);
    }
  } else if (
    !message.rolls?.some((rolltext) => rolltext.includes("DamageRoll")) &&
    message.flags?.["dnd5e"]?.use?.type !== "weapon"
  ) {
    log(message);
    playSound(message, "", "any");
  }
}

/* Hooks */

// eslint-disable-next-line no-unused-vars
Hooks.on("preCreateChatMessage", (_chatLog, message, _chatData) => {
  parseMessagesForSounds(message);
});

Hooks.on("init", () => {
  log("Initializing");
  game.settings.register("theater-of-the-mind", "enableSounds", {
    "name": "theater-of-the-mind.settings.enable-sounds.name",
    "hint": "theater-of-the-mind.settings.enable-sounds.hint",
    "scope": "world",
    "config": true,
    "default": false,
    "type": Boolean,
  });

  game.settings.register("theater-of-the-mind", "enablePartySheet", {
    "name": "theater-of-the-mind.settings.enable-party-sheet.name",
    "hint": "theater-of-the-mind.settings.enable-party-sheet.hint",
    "scope": "world",
    "config": true,
    "default": true,
    "type": Boolean,
    "onChange": () => {
      Hooks.call("renderSceneControls");
    },
  });
});

Hooks.on("ready", async () => {
  log("Ready");

  // Check if Syrinscape plugin is installed
  isSyrinscapeInstalled =
    game.modules.get("fvtt-syrin-control")?.active || false;
  log(`Syrinscape is installed: ${isSyrinscapeInstalled}`);

  // Check if Attack Roll Check is installed
  isAttackRollCheckInstalled =
    game.modules.get("attack-roll-check-5e")?.active || false;
  log(`Attack Roll Check is installed: ${isAttackRollCheckInstalled}`);
  const soundsReady = isSyrinscapeInstalled && isAttackRollCheckInstalled;
  log(`Sounds enabled: ${soundsReady}`);
});

// When a player connects or disconnects, refresh the combined view
Hooks.on("renderPlayerList", () => {
  // Check if user is GM
  if (
    !game.user.isGM ||
    !game.settings.get("theater-of-the-mind", "enablePartySheet")
  ) {
    return;
  }
  if (PartySheetDialog.rendered) {
    PartySheetDialog.data.content = convertPlayerDataToTable();
    PartySheetDialog.render(true);
  }
});

Hooks.on("renderSceneControls", () => {
  const showButton =
    game.user.isGM &&
    game.settings.get("theater-of-the-mind", "enablePartySheet");

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
