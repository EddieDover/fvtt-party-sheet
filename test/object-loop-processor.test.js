// eslint-disable-next-line no-shadow
import { jest } from "@jest/globals";
import { ObjectLoopProcessor } from "../src/module/parsing/processors/object-loop-processor.js";
import { setupFoundryMocks, cleanupFoundryMocks, createConsoleMocks } from "./test-mocks.js";

// Mock Handlebars SafeString
const mockSafeString = jest.fn().mockImplementation((content) => ({ content, __isSafeString: true }));
global.Handlebars = {
  SafeString: mockSafeString,
};

describe("ObjectLoopProcessor", () => {
  let processor;
  let mockParserEngine;
  let consoleMocks;

  beforeEach(() => {
    setupFoundryMocks();
    consoleMocks = createConsoleMocks();

    // Mock parser engine
    mockParserEngine = {
      parseText: jest.fn().mockReturnValue([false, "parsed_text"]),
    };

    processor = new ObjectLoopProcessor(mockParserEngine);

    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupFoundryMocks();
    consoleMocks.restore();
  });

  describe("dropdown counter management", () => {
    it("should initialize with dropdown counter at 0", () => {
      expect(processor.generated_dropdowns_count).toBe(0);
    });

    it("should increment dropdown counter when processing dropdown", () => {
      const character = {
        items: {
          spell: [{ name: "Fireball" }],
          equipment: [{ name: "Sword" }],
        },
      };

      // Process dropdown - this should increment the counter
      processor.process(character, "{dropdown} items{spell} => {name} || items{equipment} => {name}");

      expect(processor.generated_dropdowns_count).toBe(1);
    });

    it("should reset dropdown counter to 0", () => {
      // First increment the counter
      processor.generated_dropdowns_count = 5;
      expect(processor.generated_dropdowns_count).toBe(5);

      // Reset should bring it back to 0
      processor.resetDropdownCounter();
      expect(processor.generated_dropdowns_count).toBe(0);
    });

    it("should reset counter multiple times", () => {
      processor.generated_dropdowns_count = 10;
      processor.resetDropdownCounter();
      expect(processor.generated_dropdowns_count).toBe(0);

      processor.generated_dropdowns_count = 3;
      processor.resetDropdownCounter();
      expect(processor.generated_dropdowns_count).toBe(0);
    });
  });

  describe("dropdown creation with state provider", () => {
    it("should create dropdown without state provider", () => {
      const keys = ["option1", "option2"];
      const strings = ["content1", "content2"];

      const result = processor.createDropdown(1, keys, strings);

      expect(result).toContain('data-dropdownsection="dropdown-1-option1option2"');
      expect(result).toContain('<option value="option1" selected="selected">option1</option>'); // First option selected by default
      expect(result).toContain('<option value="option2">option2</option>');
      expect(result).toContain('style="display: block;"'); // First option visible
      expect(result).toContain('style="display: none;"'); // Second option hidden
    });

    it("should create dropdown with saved state", () => {
      // Mock a state provider
      const mockStateProvider = {
        dropdownStates: new Map([["dropdown-1-option1option2", "option2"]]),
      };

      mockParserEngine.getSavedDropdownState = jest.fn().mockReturnValue("option2");

      const keys = ["option1", "option2"];
      const strings = ["content1", "content2"];

      const result = processor.createDropdown(1, keys, strings);

      expect(result).toContain('<option value="option1">option1</option>');
      expect(result).toContain('<option value="option2" selected="selected">option2</option>');
      // The saved option should be visible
      expect(result).toContain('data-dropdownoption="option2" style="display: block;"');
      expect(result).toContain('data-dropdownoption="option1" style="display: none;"');
    });

    it("should fallback to first option when saved state not found", () => {
      mockParserEngine.getSavedDropdownState = jest.fn().mockReturnValue(null);

      const keys = ["option1", "option2"];
      const strings = ["content1", "content2"];

      const result = processor.createDropdown(1, keys, strings);

      expect(result).toContain('<option value="option1" selected="selected">option1</option>'); // First option selected when no saved state
      expect(result).toContain('<option value="option2">option2</option>');
      expect(result).toContain('data-dropdownoption="option1" style="display: block;"');
    });

    it("should generate stable dropdown IDs based on content", () => {
      const keys1 = ["talent", "focus"];
      const keys2 = ["talent", "focus"]; // Same content
      const keys3 = ["skill", "feat"]; // Different content

      const result1 = processor.createDropdown(1, keys1, ["content1", "content2"]);
      const result2 = processor.createDropdown(1, keys2, ["content1", "content2"]);
      const result3 = processor.createDropdown(1, keys3, ["content1", "content2"]);

      // Same content should generate same dropdown section ID
      expect(result1).toContain('data-dropdownsection="dropdown-1-talentfocus"');
      expect(result2).toContain('data-dropdownsection="dropdown-1-talentfocus"');

      // Different content should generate different ID
      expect(result3).toContain('data-dropdownsection="dropdown-1-skillfeat"');
    });
  });

  describe("basic object loop processing", () => {
    it("should process simple object loop", () => {
      const character = {
        spells: [
          { name: "Fireball", level: 3 },
          { name: "Shield", level: 1 },
        ],
      };

      const result = processor.process(character, "spells => {name} (Level {level})");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Fireball (Level 3) Shield (Level 1)", false);
      expect(result).toBe("parsed_text");
    });

    it("should handle multiple chunks separated by ||", () => {
      const character = {
        weapons: [{ name: "Sword" }],
        armor: [{ name: "Shield" }],
      };

      const result = processor.process(character, "weapons => {name} || armor => {name}");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Sword Shield", false);
      expect(result).toBe("parsed_text");
    });

    it("should process chunks with prefixes", () => {
      const character = {
        spells: [{ name: "Fireball" }],
      };

      const result = processor.process(character, "[Spells:] spells => {name}");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith("Spells: Fireball", false);
      expect(result).toBe("parsed_text");
    });
  });

  describe("dropdown functionality", () => {
    it("should detect dropdown syntax", () => {
      const character = {
        spells: [{ name: "Fireball" }],
      };

      const result = processor.process(character, "{dropdown} spells => {name}");

      expect(result).toBe("parsed_text");
    });

    it("should create dropdown with multiple valid sections", () => {
      const character = {
        weapons: [{ name: "Sword" }],
        armor: [{ name: "Shield" }],
      };

      // Mock to return SafeString for dropdown
      mockParserEngine.parseText.mockReturnValue([true, "<select>dropdown</select>"]);

      const result = processor.process(character, "{dropdown} weapons => {name} || armor => {name}");

      expect(mockSafeString).toHaveBeenCalled();
      expect(result.__isSafeString).toBe(true);
    });

    it("should not create dropdown with only one valid section", () => {
      const character = {
        weapons: [{ name: "Sword" }],
        emptyArray: [],
      };

      const result = processor.process(character, "{dropdown} weapons => {name} || emptyArray => {name}");

      expect(result).toBe("parsed_text");
    });

    it("should handle failed middle section in dropdown (bug fix)", () => {
      // Mock character with weapons and feats, but no spells
      const character = {
        items: [
          { type: "weapon", name: "Sword" },
          { type: "weapon", name: "Bow" },
          { type: "feat", name: "Power Attack" },
          { type: "feat", name: "Cleave" },
        ],
      };

      // Mock to return SafeString for dropdown
      mockParserEngine.parseText.mockReturnValue([true, "<select>dropdown with weapon and feat options</select>"]);

      const result = processor.process(
        character,
        "{dropdown} items{weapon} => {name} || items{spell} => {name} || items{feat} => {name}",
      );

      // Result should be a SafeString (indicating dropdown was created)
      expect(result.__isSafeString).toBe(true);
      expect(mockSafeString).toHaveBeenCalled();
    });

    it("should not create dropdown when all sections fail", () => {
      // Mock character with no items
      const character = {
        items: [],
      };

      const result = processor.process(
        character,
        "{dropdown} items{weapon} => {name} || items{spell} => {name} || items{feat} => {name}",
      );

      // Result should be parsed empty string (no dropdown created, finStrs is empty)
      expect(result).toBe("parsed_text");
      expect(mockParserEngine.parseText).toHaveBeenCalledWith("", false);
    });

    it("should not create dropdown with only one successful section", () => {
      // Mock character with only weapons
      const character = {
        items: [{ type: "weapon", name: "Sword" }],
      };

      const result = processor.process(
        character,
        "{dropdown} items{weapon} => {name} || items{spell} => {name} || items{feat} => {name}",
      );

      // Result should be plain text (not a dropdown, since validDropdownSections = 1)
      expect(typeof result).toBe("string");
      expect(result).toBe("parsed_text");
    });
  });

  describe("chunk processing", () => {
    it("should handle empty arrays in chunks", () => {
      const character = {
        emptySpells: [],
      };

      const result = processor.process(character, "emptySpells => {name}");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith("", false);
      expect(result).toBe("parsed_text");
    });

    it("should handle null/undefined data in chunks", () => {
      const character = {
        nullData: null,
      };

      const result = processor.process(character, "nullData => {name}");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith("", false);
      expect(result).toBe("parsed_text");
    });

    it("should process filters in chunks", () => {
      const character = {
        spells: [
          { name: "Fireball", level: 3, prepared: true },
          { name: "Shield", level: 1, prepared: false },
        ],
      };

      const result = processor.process(character, "spells{prepared == true} => {name}");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Fireball", false);
      expect(result).toBe("parsed_text");
    });

    it("should handle filtering by type", () => {
      const character = {
        items: [
          { name: "Sword", type: "weapon", equipped: true },
          { name: "Bow", type: "weapon", equipped: false },
          { name: "Shield", type: "armor", equipped: true },
        ],
      };

      const result = processor.process(character, "items{type == 'weapon'} => {name}");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Sword Bow", false);
      expect(result).toBe("parsed_text");
    });
  });

  describe("template processing", () => {
    it("should handle nested property access", () => {
      const character = {
        spells: [
          {
            name: "Fireball",
            damage: {
              dice: "8d6",
              type: "fire",
            },
          },
        ],
      };

      const result = processor.process(character, "spells => {name}: {damage.dice} {damage.type}");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Fireball: 8d6 fire", false);
      expect(result).toBe("parsed_text");
    });

    it("should handle missing properties gracefully", () => {
      const character = {
        spells: [
          { name: "Fireball" },
          // missing level property
        ],
      };

      const result = processor.process(character, "spells => {name} (Level {level})");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Fireball (Level {level})", false);
      expect(result).toBe("parsed_text");
    });
  });

  describe("filtering logic", () => {
    it("should apply simple boolean filters", () => {
      const character = {
        spells: [
          { name: "Fireball", prepared: true },
          { name: "Shield", prepared: false },
        ],
      };

      const result = processor.process(character, "spells{prepared == true} => {name}");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Fireball", false);
      expect(result).toBe("parsed_text");
    });

    it("should apply string value filters", () => {
      const character = {
        items: [
          { name: "Sword", type: "weapon" },
          { name: "Potion", type: "consumable" },
        ],
      };

      const result = processor.process(character, "items{type == 'weapon'} => {name}");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Sword", false);
      expect(result).toBe("parsed_text");
    });

    it("should apply numeric filters", () => {
      const character = {
        spells: [
          { name: "Fireball", level: 3 },
          { name: "Shield", level: 1 },
          { name: "Wish", level: 9 },
        ],
      };

      const result = processor.process(character, "spells{level == 3} => {name}");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Fireball", false);
      expect(result).toBe("parsed_text");
    });

    it("should handle multiple filter conditions", () => {
      const character = {
        items: [
          { name: "Magic Sword", type: "weapon", rarity: "rare" },
          { name: "Iron Sword", type: "weapon", rarity: "common" },
          { name: "Magic Shield", type: "armor", rarity: "rare" },
        ],
      };

      const result = processor.process(character, "items{rarity == 'rare'} => {name}");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Magic Sword Magic Shield", false);
      expect(result).toBe("parsed_text");
    });

    describe("string matching operators", () => {
      it("should filter using contains operator", () => {
        const character = {
          stats: {
            str: { name: "Strength", rollLabel: "Strength Check" },
            strSave: { name: "Strength", rollLabel: "Strength Save" },
            dex: { name: "Dexterity", rollLabel: "Dexterity Check" },
          },
        };

        const result = processor.process(character, "stats{rollLabel contains 'Save'} => {name}: {rollLabel}{nl}");

        expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Strength: Strength Save{nl}", false);
        expect(result).toBe("parsed_text");
      });

      it("should filter using !contains operator", () => {
        const character = {
          stats: {
            str: { name: "Strength", rollLabel: "Strength Check" },
            strSave: { name: "Strength", rollLabel: "Strength Save" },
            dex: { name: "Dexterity", rollLabel: "Dexterity Check" },
          },
        };

        const result = processor.process(character, "stats{rollLabel !contains 'Save'} => {name}: {rollLabel}{nl}");

        expect(mockParserEngine.parseText).toHaveBeenCalledWith(
          " Strength: Strength Check{nl} Dexterity: Dexterity Check{nl}",
          false,
        );
        expect(result).toBe("parsed_text");
      });

      it("should filter using startsWith operator", () => {
        const character = {
          stats: {
            str: { name: "Strength", rollLabel: "Strength Check" },
            arm: { name: "Armor", rollLabel: "Armor Save" },
            dex: { name: "Dexterity", rollLabel: "Dexterity Check" },
          },
        };

        const result = processor.process(character, "stats{rollLabel startsWith 'Armor'} => {name}: {rollLabel}{nl}");

        expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Armor: Armor Save{nl}", false);
        expect(result).toBe("parsed_text");
      });

      it("should filter using endsWith operator", () => {
        const character = {
          stats: {
            str: { name: "Strength", rollLabel: "Strength Check" },
            strSave: { name: "Strength", rollLabel: "Strength Save" },
            dex: { name: "Dexterity", rollLabel: "Dexterity Check" },
          },
        };

        const result = processor.process(character, "stats{rollLabel endsWith 'Check'} => {name}: {rollLabel}{nl}");

        expect(mockParserEngine.parseText).toHaveBeenCalledWith(
          " Strength: Strength Check{nl} Dexterity: Dexterity Check{nl}",
          false,
        );
        expect(result).toBe("parsed_text");
      });
    });

    describe("comparison operators", () => {
      it("should filter using == operator", () => {
        const character = {
          stats: {
            str: { name: "Strength", value: 18 },
            dex: { name: "Dexterity", value: 14 },
            con: { name: "Constitution", value: 18 },
          },
        };

        const result = processor.process(character, "stats{value == 18} => {name}: {value}{nl}");

        expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Strength: 18{nl} Constitution: 18{nl}", false);
        expect(result).toBe("parsed_text");
      });

      it("should filter using != operator", () => {
        const character = {
          stats: {
            str: { name: "Strength", value: 18 },
            dex: { name: "Dexterity", value: 14 },
            con: { name: "Constitution", value: 16 },
          },
        };

        const result = processor.process(character, "stats{value != 18} => {name}: {value}{nl}");

        expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Dexterity: 14{nl} Constitution: 16{nl}", false);
        expect(result).toBe("parsed_text");
      });

      it("should filter using > operator", () => {
        const character = {
          stats: {
            str: { name: "Strength", value: 18 },
            dex: { name: "Dexterity", value: 14 },
            con: { name: "Constitution", value: 16 },
          },
        };

        const result = processor.process(character, "stats{value > 15} => {name}: {value}{nl}");

        expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Strength: 18{nl} Constitution: 16{nl}", false);
        expect(result).toBe("parsed_text");
      });

      it("should filter using < operator", () => {
        const character = {
          stats: {
            str: { name: "Strength", value: 18 },
            dex: { name: "Dexterity", value: 14 },
            con: { name: "Constitution", value: 16 },
          },
        };

        const result = processor.process(character, "stats{value < 15} => {name}: {value}{nl}");

        expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Dexterity: 14{nl}", false);
        expect(result).toBe("parsed_text");
      });

      it("should filter using >= operator", () => {
        const character = {
          stats: {
            str: { name: "Strength", value: 18 },
            dex: { name: "Dexterity", value: 14 },
            con: { name: "Constitution", value: 16 },
          },
        };

        const result = processor.process(character, "stats{value >= 16} => {name}: {value}{nl}");

        expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Strength: 18{nl} Constitution: 16{nl}", false);
        expect(result).toBe("parsed_text");
      });

      it("should filter using <= operator", () => {
        const character = {
          stats: {
            str: { name: "Strength", value: 18 },
            dex: { name: "Dexterity", value: 14 },
            con: { name: "Constitution", value: 16 },
          },
        };

        const result = processor.process(character, "stats{value <= 16} => {name}: {value}{nl}");

        expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Dexterity: 14{nl} Constitution: 16{nl}", false);
        expect(result).toBe("parsed_text");
      });
    });

    describe("backwards compatibility", () => {
      it("should still support legacy type filter syntax", () => {
        const character = {
          items: [
            { name: "Sword", type: "weapon" },
            { name: "Potion", type: "consumable" },
          ],
        };

        const result = processor.process(character, "items{weapon} => {name}");

        expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Sword", false);
        expect(result).toBe("parsed_text");
      });
    });
  });

  describe("error handling", () => {
    it("should validate character parameter", () => {
      expect(() => {
        processor.process(null, "spells => {name}");
      }).toThrow("Character parameter is required");
    });

    it("should validate value parameter", () => {
      expect(() => {
        processor.process({}, null);
      }).toThrow("Value parameter is required");
    });

    it("should handle unrecognized filter that falls back to legacy type matching", () => {
      const character = {
        spells: [{ name: "Fireball", type: "spell" }],
      };

      const result = processor.process(character, "spells{invalidfilter} => {name}");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith("", false);
      expect(result).toBe("parsed_text");
    });

    it("should handle missing object properties", () => {
      const character = {};

      const result = processor.process(character, "nonexistent => {name}");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith("", false);
      expect(result).toBe("parsed_text");
    });
  });

  describe("SafeString handling", () => {
    it("should return SafeString when parser indicates it", () => {
      const character = {
        spells: [{ name: "Fireball" }],
      };

      mockParserEngine.parseText.mockReturnValue([true, "<b>Fireball</b>"]);

      const result = processor.process(character, "spells => <b>{name}</b>");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" <b>Fireball</b>", false);
      expect(mockSafeString).toHaveBeenCalledWith("<b>Fireball</b>");
      expect(result.__isSafeString).toBe(true);
    });

    it("should return plain text when SafeString not needed", () => {
      const character = {
        spells: [{ name: "Fireball" }],
      };

      mockParserEngine.parseText.mockReturnValue([false, "Fireball"]);

      const result = processor.process(character, "spells => {name}");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Fireball", false);
      expect(result).toBe("Fireball");
      expect(mockSafeString).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle empty template strings", () => {
      const character = {
        spells: [{ name: "Fireball" }],
      };

      const result = processor.process(character, "spells => ");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith("", false);
      expect(result).toBe("parsed_text");
    });

    it("should handle templates without property replacements", () => {
      const character = {
        spells: [{ name: "Fireball" }],
      };

      const result = processor.process(character, "spells => Static Text");

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Static Text", false);
      expect(result).toBe("parsed_text");
    });

    it("should handle complex nested object structures", () => {
      const character = {
        character: {
          class: {
            features: [
              {
                name: "Rage",
                uses: { value: 3, max: 3 },
                description: "Bonus damage and resistance",
              },
            ],
          },
        },
      };

      const result = processor.process(
        character,
        "character.class.features => {name} ({uses.value}/{uses.max}): {description}",
      );

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Rage (3/3): Bonus damage and resistance", false);
      expect(result).toBe("parsed_text");
    });
  });

  describe("nested loops", () => {
    it("should process nested loops with => separator", () => {
      const character = {
        items: [
          {
            name: "Longsword",
            type: "weapon",
            system: {
              attack: {
                damage: {
                  parts: [
                    { dice: "1d8", bonus: "+3" },
                    { dice: "1d6", bonus: "+0" },
                  ],
                },
              },
            },
          },
        ],
      };

      const result = processor.process(
        character,
        "items{weapon} => {name} - {system.attack.damage.parts} => {dice}{bonus}",
      );

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Longsword - 1d8+3 1d6+0", false);
      expect(result).toBe("parsed_text");
    });

    it("should handle nested loops with separators between items", () => {
      const character = {
        items: [
          {
            name: "Shortsword",
            type: "weapon",
            system: {
              attack: {
                damage: {
                  parts: [
                    { dice: "1d6", bonus: "+2" },
                    { dice: "1d4", bonus: "+1" },
                  ],
                },
              },
            },
          },
        ],
      };

      const result = processor.process(
        character,
        "items{weapon} => {name}: {system.attack.damage.parts} => {dice} ({bonus}), ",
      );

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Shortsword: 1d6 (+2), 1d4 (+1),", false);
      expect(result).toBe("parsed_text");
    });

    it("should handle multiple items with nested loops", () => {
      const character = {
        items: [
          {
            name: "Dagger",
            type: "weapon",
            system: {
              attack: {
                damage: {
                  parts: [{ dice: "1d4", bonus: "+1" }],
                },
              },
            },
          },
          {
            name: "Staff",
            type: "weapon",
            system: {
              attack: {
                damage: {
                  parts: [
                    { dice: "1d6", bonus: "+0" },
                    { dice: "1d8", bonus: "+2" },
                  ],
                },
              },
            },
          },
        ],
      };

      const result = processor.process(
        character,
        "items{weapon} => {name}: {system.attack.damage.parts} => {dice}{bonus} | ",
      );

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Dagger: 1d4+1 | Staff: 1d6+0 | 1d8+2 |", false);
      expect(result).toBe("parsed_text");
    });

    it("should handle empty nested arrays", () => {
      const character = {
        items: [
          {
            name: "Unarmed Strike",
            type: "weapon",
            system: {
              attack: {
                damage: {
                  parts: [],
                },
              },
            },
          },
        ],
      };

      const result = processor.process(
        character,
        "items{weapon} => {name} - {system.attack.damage.parts} => {dice}{bonus}",
      );

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Unarmed Strike - ", false);
      expect(result).toBe("parsed_text");
    });

    it("should handle nested loops with filter on outer loop", () => {
      const character = {
        items: [
          {
            name: "Longsword",
            type: "weapon",
            equipped: true,
            system: {
              attack: {
                damage: {
                  parts: [{ dice: "1d8", bonus: "+3" }],
                },
              },
            },
          },
          {
            name: "Dagger",
            type: "weapon",
            equipped: false,
            system: {
              attack: {
                damage: {
                  parts: [{ dice: "1d4", bonus: "+1" }],
                },
              },
            },
          },
        ],
      };

      const result = processor.process(
        character,
        "items{equipped == true} => {name}: {system.attack.damage.parts} => {dice}{bonus}",
      );

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Longsword: 1d8+3", false);
      expect(result).toBe("parsed_text");
    });

    it("should handle triple nested loops", () => {
      const character = {
        classes: [
          {
            name: "Wizard",
            spells: [
              {
                name: "Fireball",
                damage: {
                  types: [{ type: "fire", multiplier: "2x" }],
                },
              },
            ],
          },
        ],
      };

      const result = processor.process(
        character,
        "classes => {name}: {spells} => {name} - {damage.types} => {type} {multiplier}",
      );

      expect(mockParserEngine.parseText).toHaveBeenCalledWith(" Wizard: Fireball - fire 2x", false);
      expect(result).toBe("parsed_text");
    });
  });

  describe("parseValue method", () => {
    it("should parse quoted strings", () => {
      expect(processor.parseValue('"hello"')).toBe("hello");
      expect(processor.parseValue("'world'")).toBe("world");
    });

    it("should parse numbers", () => {
      expect(processor.parseValue("42")).toBe(42);
      expect(processor.parseValue("3.14")).toBe(3.14);
      expect(processor.parseValue("0")).toBe(0);
    });

    it("should parse booleans", () => {
      expect(processor.parseValue("true")).toBe(true);
      expect(processor.parseValue("false")).toBe(false);
    });

    it("should return strings for other values", () => {
      expect(processor.parseValue("notaquotedstring")).toBe("notaquotedstring");
    });
  });

  describe("getPropertyValue method", () => {
    it("should get direct property", () => {
      const obj = { name: "Test", level: 5 };
      expect(processor.getPropertyValue(obj, "name")).toBe("Test");
      expect(processor.getPropertyValue(obj, "level")).toBe(5);
    });

    it("should get nested property with dot notation", () => {
      const obj = {
        system: {
          attributes: {
            hp: { value: 50 },
          },
        },
      };
      expect(processor.getPropertyValue(obj, "system.attributes.hp.value")).toBe(50);
    });
  });

  describe("normalizeObjectData method", () => {
    it("should normalize regular object", () => {
      const objData = {
        item1: { name: "Sword", type: "weapon" },
        item2: { name: "Shield", type: "armor" },
      };

      const result = processor.normalizeObjectData(objData);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Sword");
      expect(result[0].objectLoopKey).toBe("Item1");
      expect(result[1].name).toBe("Shield");
      expect(result[1].objectLoopKey).toBe("Item2");
    });

    it("should handle FoundryVTT document structure", () => {
      const objData = {
        documentClass: "Item",
        _source: {
          item1: { name: "Potion" },
          item2: { name: "Scroll" },
        },
        foo: "bar",
        baz: "qux",
        extra1: "val1",
        extra2: "val2",
      };

      const result = processor.normalizeObjectData(objData);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Potion");
      expect(result[0].objectLoopKey).toBe("Item1");
      expect(result[1].name).toBe("Scroll");
      expect(result[1].objectLoopKey).toBe("Item2");
    });
  });

  describe("evaluateFilter edge cases", () => {
    it("should handle default comparison operators", () => {
      const data = { score: 10 };
      expect(processor.evaluateFilter(data, "score > 5")).toBe(true);
      expect(processor.evaluateFilter(data, "score < 5")).toBe(false);
      expect(processor.evaluateFilter(data, "score >= 10")).toBe(true);
      expect(processor.evaluateFilter(data, "score <= 10")).toBe(true);
    });

    it("should fallback to legacy type filter", () => {
      const data = { type: "weapon" };
      expect(processor.evaluateFilter(data, "weapon")).toBe(true);
      expect(processor.evaluateFilter(data, "armor")).toBe(false);
    });
  });

  describe("dropdown with filters and prefixes", () => {
    it("should handle dropdown with filters in chunks", () => {
      const character = {
        items: {
          item1: { type: "weapon", name: "Sword" },
          item2: { type: "armor", name: "Shield" },
          item3: { type: "weapon", name: "Bow" },
        },
      };

      // Mock parseText to return SafeString indicator
      mockParserEngine.parseText = jest.fn().mockReturnValue([true, "dropdown_html"]);

      const result = processor.process(character, "{dropdown} items{weapon} => {name} || items{armor} => {name}");

      expect(result).toHaveProperty("__isSafeString", true);
    });

    it("should handle dropdown with prefix in chunks", () => {
      const character = {
        weapons: {
          sword: { name: "Longsword" },
          bow: { name: "Shortbow" },
        },
        armor: {
          shield: { name: "Tower Shield" },
        },
      };

      mockParserEngine.parseText = jest.fn().mockReturnValue([true, "dropdown_html"]);

      const result = processor.process(character, "{dropdown} [Weapons] weapons => {name} || [Armor] armor => {name}");

      expect(result).toHaveProperty("__isSafeString", true);
    });
  });
});
