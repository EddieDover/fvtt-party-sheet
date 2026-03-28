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
});
