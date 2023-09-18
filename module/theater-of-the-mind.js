const FEATURE_SYRIN = false;

const THEATER_SOUNDS = {
  "attack roll": {
    rapier: {
      miss: "2717034",
      hit: "2717035",
      crit: "2717036",
    },
  },
};

import "./styles/theater-of-the-mind.scss";

let pendingMessages = [];
let enableSounds = false;
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
          const userSys = user.character.system;
          const stats = userSys.abilities;
          const ac = userSys.attributes.ac.value;

          const passives = {
            per: userSys.skills.per.passive,
            inv: userSys.skills.inv.passive,
            ins: userSys.skills.ins.passive,
          };

          return {
            name: user.name,
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

    console.log(players);
    let table = `<table id='totm-cv-table'>`;
    table += `<tr><th>Name</th>`;
    for (const stat in players[0].stats) {
      table += `<th style="padding:5px">${stat.toUpperCase()}</th>`;
    }
    table += `<th>AC</th><th>Inv</th></tr>`;
    table += `<tr><th></th>`;
    for (let i = 0; i < 6; i++) {
      table += `<th></th>`;
    }
    table += ` <th style="padding:5px">Per</th><th style="padding:5px">Ins</th></tr>`;
    players.forEach((player) => {
      table += `<tr><td rowspan='2'>${player.name}</td>`;
      for (const stat in player.stats) {
        table += `<td>${player.stats[stat].value}</td>`;
      }
      table += `<td>${player.ac}</td>`;
      table += `<td>${player.passives.inv}</td>`;
      table += `</tr>`;

      table += `<tr class="finrow">`;
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

const CombinedViewDialog = new Dialog({
  title: "Combined View",
  content: convertPlayerDataToTable(),
  buttons: {
    close: {
      icon: '<i class="fas fa-times"></i>',
      label: "Close",
      callback: () => CombinedViewDialog.close(),
    },
  },
  render: () => {
    CombinedViewDialog.setPosition({
      height: "auto",
      width: "auto",
    });
  },
});

function toggleCombinedView() {
  if (CombinedViewDialog.rendered) {
    CombinedViewDialog.close();
  } else {
    CombinedViewDialog.data.content = convertPlayerDataToTable();
    CombinedViewDialog.render(true);
  }
}

async function playSound(message, type, hitmisscrit) {
  // If we're not using the fvtt-syrin-control (Syrinscape) module, return
  // TODO: Use our own implementation of Syrinscape? Maybe we can use the API to search instead of hard coding sounds.
  if (!enableSounds) {
    return;
  }

  // Get the attack weapon from the message
  const regexPattern = new RegExp(`(.*) - ${type}`, "i");

  const matchResult = message.flavor.match(regexPattern);

  if (matchResult) {
    const weapon = matchResult[1];
    // Get the sound from the THEATER_SOUNDS object
    const sound =
      THEATER_SOUNDS[type.toLowerCase()][weapon.toLowerCase()][
        hitmisscrit.toLowerCase()
      ];
    if (sound) {
      game.syrinscape.playElement(sound);
    }
  }
}

async function parseMessagesForSounds(message) {
  if (!isSyrinscapeInstalled) {
    return;
  }
  const flavor = message?.flavor || "";

  if (flavor.toLowerCase().includes("attack roll")) {
    pendingMessages.push(message);
  }

  if (message.flags?.["attack-roll-check-5e"]?.isResultCard) {
    const roll = message.content.match(
      /<div class="roll-display">(.*)<\/div>/
    )[1];
    const applicableMessages =
      pendingMessages.filter(
        (imessage) =>
          imessage.flavor.toLowerCase().includes("attack roll") &&
          imessage.content === roll
      ) || [];
    if (applicableMessages.length > 0) {
      const applicableMessage = applicableMessages[0];
      pendingMessages = pendingMessages.filter(
        (imessage) => imessage !== applicableMessage
      );
      const hitmisscrit = message.content.match(
        /<div class="status-chip ([a-z]*)">/
      )[1];
      playSound(applicableMessage, "Attack Roll", hitmisscrit);
    }
  }
}

/* Hooks */

// eslint-disable-next-line no-unused-vars
Hooks.on("preCreateChatMessage", (_chatLog, message, _chatData) => {
  parseMessagesForSounds(message);
});

Hooks.on("init", () => {
  log("Initializing Theater of the Mind");
});

Hooks.on("ready", async () => {
  log("Ready");

  if (FEATURE_SYRIN) {
    // Check if Syrinscape plugin is installed
    isSyrinscapeInstalled =
      game.modules.get("fvtt-syrin-control")?.active || false;
    log(`Syrinscape is installed: ${isSyrinscapeInstalled}`);

    // Check if Attack Roll Check is installed
    isAttackRollCheckInstalled =
      game.modules.get("foundryvtt-attack-roll-check-5e")?.active || false;
    log(`Attack Roll Check is installed: ${isSyrinscapeInstalled}`);
    enableSounds = isSyrinscapeInstalled && isAttackRollCheckInstalled;
  }
});

// When a player connects or disconnects, refresh the combined view
Hooks.on("renderPlayerList", () => {
  // Check if user is GM
  if (!game.user.isGM) {
    return;
  }
  if (CombinedViewDialog.rendered) {
    CombinedViewDialog.data.content = convertPlayerDataToTable();
    CombinedViewDialog.render(true);
  }
});

Hooks.on("renderSceneControls", () => {
  if (!game.user.isGM) {
    return;
  }
  const button = $(`<li class="control-tool "
            data-tool="combinedview"
            aria-label="Show Combined View"
            role="button"
            data-tooltip="Combined View">
            <i class="fas fa-theater-masks"></i>
        </li>`);
  button.click(() => toggleCombinedView());
  const controls = $("#tools-panel-token");
  controls.append(button);
});
