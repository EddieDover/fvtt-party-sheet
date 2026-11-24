import { jest } from "@jest/globals";
import { localizeOr } from "../src/module/i18n.js";

describe("localizeOr", () => {
  afterEach(() => {
    delete global.game;
  });

  it("uses the fallback and fills placeholders when game is not available", () => {
    expect(localizeOr("some.key", "Hello {name}!", { name: "Bob" })).toBe("Hello Bob!");
    expect(localizeOr("some.key", "No data")).toBe("No data");
  });

  it("uses the fallback when the key is not translated", () => {
    global.game = { i18n: { localize: jest.fn((key) => key), format: jest.fn((key) => key) } };
    expect(localizeOr("some.key", "Count: {count}", { count: 3 })).toBe("Count: 3");
  });

  it("uses the translation when it exists", () => {
    global.game = {
      i18n: {
        localize: jest.fn(() => "Bonjour"),
        format: jest.fn((key, data) => `Bonjour ${data.name}`),
      },
    };
    expect(localizeOr("some.key", "Hello")).toBe("Bonjour");
    expect(localizeOr("some.key", "Hello {name}", { name: "Bob" })).toBe("Bonjour Bob");
  });

  it("leaves unknown placeholders untouched in the fallback", () => {
    expect(localizeOr("some.key", "{a} and {b}", { a: 1 })).toBe("1 and {b}");
  });
});
