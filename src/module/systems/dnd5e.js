export /** @type {SystemData} */
const DND5E = {
  "name": "dnd5e",
  "system": "dnd5e",
  "author": "Built-In",
  "offline_excludes": ["npc", "base", "vehicle", "group"],
  "rows": [
    [
      {
        "name": "Character Sheet",
        "type": "charactersheet",
        "header": "hide",
        "text": "",
      },
      {
        "name": "Name",
        "type": "direct",
        "header": "show",
        "text": "name {newline} system.details.race",
      },
      {
        "name": "STR",
        "type": "direct",
        "header": "show",
        "text": "system.abilities.str.value",
      },
      {
        "name": "DEX",
        "type": "direct",
        "header": "show",
        "text": "system.abilities.dex.value",
      },
      {
        "name": "CON",
        "type": "direct",
        "header": "show",
        "text": "system.abilities.con.value",
      },
      {
        "name": "INT",
        "type": "direct",
        "header": "show",
        "text": "system.abilities.int.value",
      },
      {
        "name": "WIS",
        "type": "direct",
        "header": "show",
        "text": "system.abilities.wis.value",
      },
      {
        "name": "CHA",
        "type": "direct",
        "header": "show",
        "text": "system.abilities.cha.value",
      },
      {
        "name": "AC",
        "type": "direct",
        "header": "show",
        "text": "system.attributes.ac.value",
      },
      {
        "name": "Inv",
        "type": "direct",
        "header": "show",
        "text": "system.skills.inv.passive",
      },
      {
        "name": "Vision",
        "type": "string",
        "header": "show",
        "text": "",
      },
    ],
    [
      {
        "name": "Spacer1",
        "type": "",
        "header": "hide",
        "text": "",
      },
      {
        "name": "Classes",
        "type": "array-string-builder",
        "header": "show",
        "text": "classes => name - system.levels",
      },
      {
        "name": "STR Mod",
        "type": "direct",
        "header": "hide",
        "text": "system.abilities.str.mod",
      },
      {
        "name": "DEX Mod",
        "type": "direct",
        "header": "hide",
        "text": "system.abilities.dex.mod",
      },
      {
        "name": "CON Mod",
        "type": "direct",
        "header": "hide",
        "text": "system.abilities.con.mod",
      },
      {
        "name": "INT Mod",
        "type": "direct",
        "header": "hide",
        "text": "system.abilities.int.mod",
      },
      {
        "name": "WIS Mod",
        "type": "direct",
        "header": "hide",
        "text": "system.abilities.wis.mod",
      },
      {
        "name": "CHA Mod",
        "type": "direct",
        "header": "hide",
        "text": "system.abilities.cha.mod",
      },
      {
        "name": "Per",
        "type": "direct",
        "header": "show",
        "text": "system.skills.prc.passive",
      },
      {
        "name": "Ins",
        "type": "direct",
        "header": "show",
        "text": "system.skills.ins.passive",
      },
      {
        "name": "Senses",
        "type": "direct-complex",
        "header": "hide",
        "text": [
          {
            "type": "exists",
            "value": "system.attributes.senses.darkvision",
            "text": "Darkvision: system.attributes.senses.darkvision",
          },
          {
            "type": "exists",
            "value": "system.attributes.senses.blindsight",
            "text": "Blindsight: system.attributes.senses.blindsight",
          },
          {
            "type": "exists",
            "value": "system.attributes.senses.tremorsense",
            "text": "Tremorsense: system.attributes.senses.tremorsense",
          },
          {
            "type": "exists",
            "value": "system.attributes.senses.truesight",
            "text": "Truesight: system.attributes.senses.truesight",
          },
          {
            "type": "exists",
            "value": "system.attributes.senses.special",
            "text": "Special: system.attributes.senses.special",
          },
        ],
      },
    ],
  ],
};
