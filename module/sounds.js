import { SPELL_SOUNDS } from "./sounds/spells.js";
import { WEAPON_SOUNDS } from "./sounds/weapons.js";

export const THEATER_SOUNDS = {
  ...Object.keys(WEAPON_SOUNDS).reduce((acc, key) => {
    acc[key.toLowerCase()] = WEAPON_SOUNDS[key];
    return acc;
  }, {}),

  ...Object.keys(SPELL_SOUNDS).reduce((acc, key) => {
    acc[key.toLowerCase()] = SPELL_SOUNDS[key];
    return acc;
  }, {}),
};
