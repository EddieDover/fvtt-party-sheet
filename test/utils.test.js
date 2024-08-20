import { parsePluses, parseSpacing, parseExtras, parseNewlines, extractPropertyByString } from "../src/module/utils";

describe("Utils testing", () => {
  describe("Plus parsing", () => {
    it("will parse a simple request", () => {
      expect(parsePluses("1 {+} 2")).toEqual("3");
    });

    it("will parse a simple request with a space", () => {
      expect(parsePluses("1 {+} 2")).toEqual("3");
    });

    it("will parse a complex request", () => {
      expect(parsePluses("1 {+} 2 {+} 3")).toEqual("6");
    });

    it("will fail a complex request", () => {
      expect(parsePluses("1 {+} 2 {+} 3 {+}")).toEqual("6 {+}");
    });

    it("will fail a complex request again", () => {
      expect(parsePluses("1 {+} 2 {+} 3 {+} text")).toEqual("6 {+} text");
    });

    it("will parse a complex request again", () => {
      expect(parsePluses("1 {+} 2 {+} 3 {+} 10")).toEqual("16");
    });
  });

  describe("Spacing parsing", () => {
    it("will parse a simple request", () => {
      const result = parseSpacing("Hello {s3} World", false);
      expect(result.value).toEqual("Hello &nbsp;&nbsp;&nbsp; World");
      expect(result.isSafeStringNeeded).toEqual(true);
    });

    it("will parse a request with zero spacing", () => {
      const result = parseSpacing("Hello {s0} World", false);
      expect(result.value).toEqual("HelloWorld");
      expect(result.isSafeStringNeeded).toEqual(true);
    });

    it("will parse a request with multiple spacings", () => {
      const result = parseSpacing("Hello {s2} beautiful {s4} World", false);
      expect(result.value).toEqual("Hello &nbsp;&nbsp; beautiful &nbsp;&nbsp;&nbsp;&nbsp; World");
      expect(result.isSafeStringNeeded).toEqual(true);
    });

    it("will fail to parse a request with negative spacing", () => {
      const result = parseSpacing("Hello {s-2} World", false);
      expect(result.value).toEqual("Hello {s-2} World");
      expect(result.isSafeStringNeeded).toEqual(false);
    });

    it("will parse a request with mixed spacings", () => {
      const result = parseSpacing("Hello {s2} {s0} beautiful {s-3} World", false);
      expect(result.value).toEqual("Hello &nbsp;&nbsp;beautiful {s-3} World");
      expect(result.isSafeStringNeeded).toEqual(true);
    });

    it("will parse a request with no spacings", () => {
      const result = parseSpacing("Hello World", false);
      expect(result.value).toEqual("Hello World");
      expect(result.isSafeStringNeeded).toEqual(false);
    });
  });

  describe("Newline parsing", () => {
    it("will parse a simple request", () => {
      const result = parseNewlines("Hello{nl}World", false);
      expect(result.value).toEqual("Hello<br/>World");
      expect(result.isSafeStringNeeded).toEqual(true);
    });

    it("will parse a request with multiple newlines", () => {
      const result = parseNewlines("Hello{nl}{nl}{nl}World", false);
      expect(result.value).toEqual("Hello<br/><br/><br/>World");
      expect(result.isSafeStringNeeded).toEqual(true);
    });

    it("will parse a request with mixed newlines and text", () => {
      const result = parseNewlines("Hello{nl}beautiful{nl}World", false);
      expect(result.value).toEqual("Hello<br/>beautiful<br/>World");
      expect(result.isSafeStringNeeded).toEqual(true);
    });

    it("will not parse a request without newlines", () => {
      const result = parseNewlines("Hello World", false);
      expect(result.value).toEqual("Hello World");
      expect(result.isSafeStringNeeded).toEqual(false);
    });
  });

  describe("Extras parsing", () => {
    it("will parse a simple request with italics", () => {
      const result = parseExtras("Hello {i}World{/i}", false);
      expect(result[0]).toEqual(true);
      expect(result[1]).toEqual("Hello <i>World</i>");
    });

    it("will parse a simple request with bold", () => {
      const result = parseExtras("Hello {b}World{/b}", false);
      expect(result[0]).toEqual(true);
      expect(result[1]).toEqual("Hello <b>World</b>");
    });

    it("will parse a simple request with underline", () => {
      const result = parseExtras("Hello {u}World{/u}", false);
      expect(result[0]).toEqual(true);
      expect(result[1]).toEqual("Hello <u>World</u>");
    });

    it("will parse a complex request", () => {
      const result = parseExtras("Hello {i}beautiful {b}World{/b}{/i}", false);
      expect(result[0]).toEqual(true);
      expect(result[1]).toEqual("Hello <i>beautiful <b>World</b></i>");
    });

    it("will parse a request with multiple extras", () => {
      const result = parseExtras("Hello {i}beautiful {b}World{/b}{/i} with {u}underline{/u}", false);
      expect(result[0]).toEqual(true);
      expect(result[1]).toEqual("Hello <i>beautiful <b>World</b></i> with <u>underline</u>");
    });

    it("will parse a request with a font awesome icon", () => {
      const result = parseExtras("Hello {fa fa-solid fa-star} World", false);
      expect(result[0]).toEqual(true);
      expect(result[1]).toEqual('Hello <i class="fa fa-solid fa-star"></i> World');
    });

    it("will parse a request with no extras", () => {
      const result = parseExtras("Hello World", false);
      expect(result[0]).toEqual(false);
      expect(result[1]).toEqual("Hello World");
    });
  });
});
describe("extractPropertyByString testing", () => {
  it("should return the property value when the path is valid", () => {
    const obj = {
      foo: {
        bar: {
          baz: "Hello World",
        },
      },
    };
    const result = extractPropertyByString(obj, "foo.bar.baz");
    expect(result).toEqual("Hello World");
  });

  it("should return undefined when the path is invalid", () => {
    const obj = {
      foo: {
        bar: {
          baz: "Hello World",
        },
      },
    };
    const result = extractPropertyByString(obj, "foo.bar.qux");
    expect(result).toBeUndefined();
  });

  it("should return the property value when the path contains numbers", () => {
    const obj = {
      foo: {
        1: {
          2: "Hello World",
        },
      },
    };
    const result = extractPropertyByString(obj, "foo.1.2");
    expect(result).toEqual("Hello World");
  });

  it("should return the property value when the path contains booleans", () => {
    const obj = {
      foo: {
        true: {
          false: "Hello World",
        },
      },
    };
    const result = extractPropertyByString(obj, "foo.true.false");
    expect(result).toEqual("Hello World");
  });

  it("should not return the property value when the path contains special characters", () => {
    const obj = {
      "foo.bar": {
        "baz.qux": "Hello World",
      },
    };
    const result = extractPropertyByString(obj, "foo.bar.baz.qux");
    expect(result).toEqual(undefined);
  });

  it("should return the property value when the path contains arrays", () => {
    const obj = {
      foo: [
        {
          bar: "Hello",
        },
        {
          bar: "World",
        },
      ],
    };
    const result = extractPropertyByString(obj, "foo.1.bar");
    expect(result).toEqual("World");
  });

  it("should return the property value when the path contains nested objects and arrays", () => {
    const obj = {
      foo: {
        bar: [
          {
            baz: "Hello",
          },
          {
            baz: "World",
          },
        ],
      },
    };
    const result = extractPropertyByString(obj, "foo.bar.1.baz");
    expect(result).toEqual("World");
  });

  it("should return the property value when the path contains null values", () => {
    const obj = {
      foo: {
        bar: null,
      },
    };
    const result = extractPropertyByString(obj, "foo.bar");
    expect(result).toBeNull();
  });

  it("should return the property value when the path contains undefined values", () => {
    const obj = {
      foo: {
        bar: undefined,
      },
    };
    const result = extractPropertyByString(obj, "foo.bar");
    expect(result).toBeUndefined();
  });

  it("should return the property value when the path contains empty strings", () => {
    const obj = {
      foo: {
        bar: "",
      },
    };
    const result = extractPropertyByString(obj, "foo.bar");
    expect(result).toEqual("");
  });
});
