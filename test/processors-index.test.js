// eslint-disable-next-line no-shadow
import { jest } from "@jest/globals";
import {
  DirectProcessor,
  DirectComplexProcessor,
  StringProcessor,
  CharacterSheetProcessor,
  ArrayStringBuilderProcessor,
  ObjectLoopProcessor,
  SpanProcessor,
  LargestFromArrayProcessor,
  SmallestFromArrayProcessor,
} from "../src/module/parsing/processors/index.js";

describe("Processor Index Exports", () => {
  it("should export DirectProcessor", () => {
    expect(DirectProcessor).toBeDefined();
    expect(typeof DirectProcessor).toBe("function");
  });

  it("should export DirectComplexProcessor", () => {
    expect(DirectComplexProcessor).toBeDefined();
    expect(typeof DirectComplexProcessor).toBe("function");
  });

  it("should export StringProcessor", () => {
    expect(StringProcessor).toBeDefined();
    expect(typeof StringProcessor).toBe("function");
  });

  it("should export CharacterSheetProcessor", () => {
    expect(CharacterSheetProcessor).toBeDefined();
    expect(typeof CharacterSheetProcessor).toBe("function");
  });

  it("should export ArrayStringBuilderProcessor", () => {
    expect(ArrayStringBuilderProcessor).toBeDefined();
    expect(typeof ArrayStringBuilderProcessor).toBe("function");
  });

  it("should export ObjectLoopProcessor", () => {
    expect(ObjectLoopProcessor).toBeDefined();
    expect(typeof ObjectLoopProcessor).toBe("function");
  });

  it("should export SpanProcessor", () => {
    expect(SpanProcessor).toBeDefined();
    expect(typeof SpanProcessor).toBe("function");
  });

  it("should export LargestFromArrayProcessor", () => {
    expect(LargestFromArrayProcessor).toBeDefined();
    expect(typeof LargestFromArrayProcessor).toBe("function");
  });

  it("should export SmallestFromArrayProcessor", () => {
    expect(SmallestFromArrayProcessor).toBeDefined();
    expect(typeof SmallestFromArrayProcessor).toBe("function");
  });

  it("should be able to instantiate each processor", () => {
    // Test that each exported class can be instantiated
    const mockParserEngine = { parseText: jest.fn() };

    expect(() => new DirectProcessor()).not.toThrow();
    expect(() => new DirectComplexProcessor()).not.toThrow();
    expect(() => new StringProcessor()).not.toThrow();
    expect(() => new CharacterSheetProcessor()).not.toThrow();
    expect(() => new ArrayStringBuilderProcessor(mockParserEngine)).not.toThrow();
    expect(() => new ObjectLoopProcessor(mockParserEngine)).not.toThrow();
    expect(() => new SpanProcessor()).not.toThrow();
    expect(() => new LargestFromArrayProcessor()).not.toThrow();
    expect(() => new SmallestFromArrayProcessor()).not.toThrow();
  });
});
