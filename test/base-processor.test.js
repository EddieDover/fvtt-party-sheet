// eslint-disable-next-line no-shadow
import { jest } from "@jest/globals";
import { DataProcessor } from "../src/module/parsing/base-processor.js";
import * as ProcessorIndex from "../src/module/parsing/processors/index.js";

describe("Base Processor", () => {
  describe("DataProcessor", () => {
    let processor;

    beforeEach(() => {
      processor = new DataProcessor();
    });

    it("should throw error when process method is not implemented", () => {
      const character = { name: "Test" };
      expect(() => processor.process(character, "value")).toThrow("Process method must be implemented by subclass");
    });

    it("should validate character parameter", () => {
      expect(() => processor.validate(null, "value")).toThrow("Character parameter is required");
      expect(() => processor.validate(undefined, "value")).toThrow("Character parameter is required");
    });

    it("should validate value parameter", () => {
      const character = { name: "Test" };
      expect(() => processor.validate(character, null)).toThrow("Value parameter is required");
      expect(() => processor.validate(character, undefined)).toThrow("Value parameter is required");
    });

    it("should pass validation with valid parameters", () => {
      const character = { name: "Test" };
      expect(() => processor.validate(character, "value")).not.toThrow();
      expect(() => processor.validate(character, "")).not.toThrow();
      expect(() => processor.validate(character, 0)).not.toThrow();
      expect(() => processor.validate(character, false)).not.toThrow();
    });
  });
});

describe("Processor Index", () => {
  it("should export all processor classes", () => {
    expect(ProcessorIndex.DirectProcessor).toBeDefined();
    expect(ProcessorIndex.DirectComplexProcessor).toBeDefined();
    expect(ProcessorIndex.StringProcessor).toBeDefined();
    expect(ProcessorIndex.CharacterSheetProcessor).toBeDefined();
    expect(ProcessorIndex.ArrayStringBuilderProcessor).toBeDefined();
    expect(ProcessorIndex.ObjectLoopProcessor).toBeDefined();
    expect(ProcessorIndex.SpanProcessor).toBeDefined();
    expect(ProcessorIndex.LargestFromArrayProcessor).toBeDefined();
    expect(ProcessorIndex.SmallestFromArrayProcessor).toBeDefined();
  });

  it("should export classes that extend DataProcessor", () => {
    expect(new ProcessorIndex.StringProcessor()).toBeInstanceOf(DataProcessor);
    expect(new ProcessorIndex.CharacterSheetProcessor()).toBeInstanceOf(DataProcessor);
    expect(new ProcessorIndex.SpanProcessor()).toBeInstanceOf(DataProcessor);
    expect(new ProcessorIndex.LargestFromArrayProcessor()).toBeInstanceOf(DataProcessor);
    expect(new ProcessorIndex.SmallestFromArrayProcessor()).toBeInstanceOf(DataProcessor);
  });

  it("should export classes that require parser engine", () => {
    const mockEngine = { parseText: jest.fn() };

    expect(() => new ProcessorIndex.DirectProcessor(mockEngine)).not.toThrow();
    expect(() => new ProcessorIndex.DirectComplexProcessor(mockEngine)).not.toThrow();
    expect(() => new ProcessorIndex.ArrayStringBuilderProcessor(mockEngine)).not.toThrow();
    expect(() => new ProcessorIndex.ObjectLoopProcessor(mockEngine)).not.toThrow();
  });
});
