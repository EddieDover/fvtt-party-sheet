import { jest } from "@jest/globals";
import { setupFoundryMocks, cleanupFoundryMocks } from "./test-mocks.js";

describe("Handlebars Helpers", () => {
  let Handlebars;

  beforeEach(() => {
    setupFoundryMocks();

    // Mock Handlebars
    global.Handlebars = {
      registerHelper: jest.fn(),
      registerPartial: jest.fn(),
      escapeExpression: jest.fn((str) => str),
    };
    global.Hooks = {
      on: jest.fn(),
      once: jest.fn(),
      callAll: jest.fn(),
    };
    // Need to reset modules to ensure fvtt-party-sheet runs its registration again
    jest.resetModules();
  });

  afterEach(() => {
    cleanupFoundryMocks();
    delete global.Handlebars;
  });

  it("registers helpers correctly", async () => {
    await import("../src/module/fvtt-party-sheet.js");
    expect(global.Handlebars.registerHelper).toHaveBeenCalledWith("inArray", expect.any(Function));
    expect(global.Handlebars.registerHelper).toHaveBeenCalledWith("hchiddentype", expect.any(Function));
  });

  it("inArray correctly unboxes Handlebars strings", async () => {
    await import("../src/module/fvtt-party-sheet.js");
    const inArrayCall = global.Handlebars.registerHelper.mock.calls.find((call) => call[0] === "inArray");
    const inArrayHelper = inArrayCall[1];

    const options = {
      fn: jest.fn().mockReturnValue("true"),
      inverse: jest.fn().mockReturnValue("false"),
    };

    // Test with primitive
    inArrayHelper("test", ["test", "other"], options);
    expect(options.fn).toHaveBeenCalledTimes(1);

    // Test with Handlebars "boxed" string
    const boxedString = new String("test");
    inArrayHelper(boxedString, ["test", "other"], options);
    expect(options.fn).toHaveBeenCalledTimes(2);

    // Test false case
    inArrayHelper("missing", ["test", "other"], options);
    expect(options.inverse).toHaveBeenCalledTimes(1);
  });

  it("hchiddentype correctly checks against game settings with unboxed strings", async () => {
    await import("../src/module/fvtt-party-sheet.js");
    const hchiddentypeCall = global.Handlebars.registerHelper.mock.calls.find((call) => call[0] === "hchiddentype");
    const hchiddentypeHelper = hchiddentypeCall[1];

    const options = {
      fn: jest.fn().mockReturnValue("true"),
      inverse: jest.fn().mockReturnValue("false"),
    };

    // Setup mock game setting for hiddenCharacterTypes
    global.game.settings.get.mockImplementation((mod, setting) => {
      if (mod === "fvtt-party-sheet" && setting === "hiddenCharacterTypes") {
        return ["npc", "vehicle"];
      }
      return [];
    });

    // Test with primitive
    hchiddentypeHelper("npc", options);
    expect(options.fn).toHaveBeenCalledTimes(1);

    // Test with Handlebars "boxed" string
    const boxedString = new String("vehicle");
    hchiddentypeHelper(boxedString, options);
    expect(options.fn).toHaveBeenCalledTimes(2);

    // Test false case
    hchiddentypeHelper("character", options);
    expect(options.inverse).toHaveBeenCalledTimes(1);
  });
  describe("getHeaderGroups", () => {
    const getHelper = async () => {
      await import("../src/module/fvtt-party-sheet.js");
      return global.Handlebars.registerHelper.mock.calls.find((call) => call[0] === "getHeaderGroups")[1];
    };
    const col = (options = {}) => ({ text: "", options });

    it("returns an empty array when no column has a header group", async () => {
      const getHeaderGroups = await getHelper();
      expect(getHeaderGroups({ a: col(), b: col({ colspan: 2 }), c: col() })).toEqual([]);
      expect(getHeaderGroups(undefined)).toEqual([]);
    });

    it("merges consecutive columns sharing the same header group", async () => {
      const getHeaderGroups = await getHelper();
      const row = {
        name: col(),
        str: col({ headerGroup: "Abilities" }),
        dex: col({ headerGroup: "Abilities" }),
        con: col({ headerGroup: "Abilities" }),
        hp: col(),
        ac: col(),
      };
      expect(getHeaderGroups(row)).toEqual([
        { text: "", colspan: 1, key: "name" },
        { text: "Abilities", colspan: 3 },
        { text: "", colspan: 1, key: "hp" },
        { text: "", colspan: 1, key: "ac" },
      ]);
    });

    it("does not merge identical groups separated by another column", async () => {
      const getHeaderGroups = await getHelper();
      const row = { a: col({ headerGroup: "X" }), b: col(), c: col({ headerGroup: "X" }) };
      expect(getHeaderGroups(row)).toEqual([
        { text: "X", colspan: 1 },
        { text: "", colspan: 1, key: "b" },
        { text: "X", colspan: 1 },
      ]);
    });

    it("accounts for colspan and skips covered columns", async () => {
      const getHeaderGroups = await getHelper();
      const row = {
        name: col({ colspan: 2 }),
        covered: col({ headerGroup: "Ignored" }),
        str: col({ headerGroup: "Abilities", colspan: 2 }),
        covered2: col(),
        dex: col({ headerGroup: "Abilities" }),
      };
      expect(getHeaderGroups(row)).toEqual([
        { text: "", colspan: 2, key: "name" },
        { text: "Abilities", colspan: 3 },
      ]);
    });

    it("uses the column name as text for ungrouped columns with a shown header", async () => {
      const getHeaderGroups = await getHelper();
      const row = { sheet: col({ header: "hide" }), name: col({ header: "show" }), str: col({ headerGroup: "A" }) };
      expect(getHeaderGroups(row)).toEqual([
        { text: "", colspan: 1, key: "sheet" },
        { text: "name", colspan: 1, key: "name" },
        { text: "A", colspan: 1 },
      ]);
    });
  });

  describe("isInHeaderGroupRow", () => {
    const col = (options = {}) => ({ text: "", options });
    const run = async (row, key) => {
      await import("../src/module/fvtt-party-sheet.js");
      const helper = global.Handlebars.registerHelper.mock.calls.find((call) => call[0] === "isInHeaderGroupRow")[1];
      const options = { fn: jest.fn().mockReturnValue("skip"), inverse: jest.fn().mockReturnValue("draw") };
      return helper(row, key, options);
    };

    it("skips ungrouped headers when the row uses header groups", async () => {
      const row = { name: col(), str: col({ headerGroup: "A" }) };
      expect(await run(row, "name")).toBe("skip");
      expect(await run(row, "str")).toBe("draw");
    });

    it("draws every header when the row has no header group", async () => {
      expect(await run({ name: col(), str: col() }, "name")).toBe("draw");
    });
  });
});
