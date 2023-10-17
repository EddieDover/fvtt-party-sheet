/* eslint-disable no-undef */
import { THEATER_SOUNDS } from "./sounds.js";
import { registerSettings } from "./app/settings.js";
import { PartySheetForm } from "./app/party-sheet.js";

let isSyrinscapeInstalled = false;
let isMidiQoLInstalled = false;

function log(...message) {
  console.log("Theater of the Mind | ", message);
}

Handlebars.registerHelper("hccontains", function (needle, haystack, options) {
  needle = Handlebars.escapeExpression(needle);
  haystack = game.settings.get("theater-of-the-mind", "hiddenCharacters") ?? [];
  return haystack.indexOf(needle) > -1 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper("hcifgte", function (v1, v2, options) {
  if (v1 >= v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

let currentPartySheet = null;

function togglePartySheet() {
  if (currentPartySheet?.rendered) {
    currentPartySheet.close();
  } else {
    currentPartySheet = new PartySheetForm();
    currentPartySheet.render(true);
  }
}

async function playSound(weapon, crit, hitmiss, override = null) {
  if (!isSyrinscapeInstalled || !isMidiQoLInstalled) {
    return;
  }

  const hitmisscrit = override ? "any" : crit ? "critical" : hitmiss ? "hit" : "miss";

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
    log(`Key found: [${weapon.toLowerCase()}], No sound sub-type found [${subsound}].`);
  } else {
    game.syrinscape.playElement(soundid);
  }
}
/* Hooks */

Hooks.on("init", () => {
  log("Initializing");

  registerSettings();
});

//
Hooks.on("midi-qol.AttackRollComplete", async (roll) => {
  const weapon = roll.item.name;
  const roll_results = roll.attackTotal;
  const target = roll?.targets?.values().next().value || null;
  const target_actor = target?.document?.actors?.values().next().value || null;
  const ac = target_actor?.system?.attributes?.ac?.value || null;

  if (ac) {
    playSound(weapon, roll_results === 20, roll_results >= ac);
  }
});

Hooks.on("midi-qol.preambleComplete", async (roll) => {
  if (roll?.item?.type != "spell") {
    return;
  }
  playSound(roll.item.name, false, false, "any");
});

Hooks.on("ready", async () => {
  log("Ready");

  isSyrinscapeInstalled = game.modules.get("fvtt-syrin-control")?.active || false;
  log(`Syrinscape is installed: ${isSyrinscapeInstalled}`);

  isMidiQoLInstalled = game.modules.get("midi-qol")?.active || false;
  log(`Midi-QoL is installed: ${isMidiQoLInstalled}`);

  const soundsReady = isSyrinscapeInstalled && isMidiQoLInstalled;
  log(`Sounds enabled: ${soundsReady}`);
});

Hooks.on("renderPlayerList", () => {
  const showOnlyOnlineUsers = game.settings.get("theater-of-the-mind", "enableOnlyOnline");

  if (!game.user.isGM || !showOnlyOnlineUsers) {
    return;
  }
  if (currentPartySheet.rendered) {
    // PartySheetDialog.data.content = convertPlayerDataToTable();
    currentPartySheet.render(true);
  }
});

Hooks.on("renderSceneControls", () => {
  const showButton = game.user.isGM;

  const button = $(`<li class="control-tool "
            data-tool="PartySheet"
            aria-label="Show Party Sheet"
            role="button"
            data-tooltip="Party Sheet">
            <i class="fas fa-users"></i>
        </li>`);
  button.click(() => togglePartySheet());
  const controls = $("#tools-panel-token");

  if (showButton && controls.find(".control-tool[data-tool='PartySheet']")) {
    controls.append(button);
  } else if (!showButton) {
    controls.find(".control-tool[data-tool='PartySheet']").remove();
  }
});
