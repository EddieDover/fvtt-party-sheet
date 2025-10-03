// eslint-disable-next-line no-shadow
import { jest } from "@jest/globals";
import { ParserFactory } from "../src/module/parsing/parser-factory.js";
import { ParserEngine } from "../src/module/parsing/parser-engine.js";
import {
  DirectProcessor,
  DirectComplexProcessor,
  ArrayStringBuilderProcessor,
  ObjectLoopProcessor,
  SpanProcessor,
} from "../src/module/parsing/processors/index.js";
import { setupFoundryMocks, cleanupFoundryMocks, createConsoleMocks } from "./test-mocks.js";

describe("ParserFactory", () => {
  let consoleMocks;

  beforeEach(() => {
    setupFoundryMocks();
    consoleMocks = createConsoleMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupFoundryMocks();
    consoleMocks.restore();
  });

  describe("createParserEngine", () => {
    it("should create a fully configured parser engine", () => {
      const engine = ParserFactory.createParserEngine();

      expect(engine).toBeInstanceOf(ParserEngine);

      // Verify all processors are registered by checking they exist (using correct key names)
      expect(engine.hasProcessor("direct")).toBe(true);
      expect(engine.hasProcessor("direct-complex")).toBe(true);
      expect(engine.hasProcessor("string")).toBe(true);
      expect(engine.hasProcessor("charactersheet")).toBe(true);
      expect(engine.hasProcessor("array-string-builder")).toBe(true);
      expect(engine.hasProcessor("object-loop")).toBe(true);
      expect(engine.hasProcessor("span")).toBe(true);
      expect(engine.hasProcessor("largest-from-array")).toBe(true);
      expect(engine.hasProcessor("smallest-from-array")).toBe(true);

      // Check registered types
      const registeredTypes = engine.getRegisteredTypes();
      expect(registeredTypes).toContain("direct");
      expect(registeredTypes).toContain("direct-complex");
      expect(registeredTypes).toContain("string");
      expect(registeredTypes).toContain("charactersheet");
      expect(registeredTypes).toContain("array-string-builder");
      expect(registeredTypes).toContain("object-loop");
      expect(registeredTypes).toContain("span");
      expect(registeredTypes).toContain("largest-from-array");
      expect(registeredTypes).toContain("smallest-from-array");
      expect(registeredTypes).toHaveLength(9);
    });

    it("should create processors that work correctly", () => {
      const engine = ParserFactory.createParserEngine();
      const mockCharacter = {
        name: "Test Character",
        stats: { str: 15, dex: 12 },
      };

      // Test that processors are working (using correct key names)
      expect(engine.process(mockCharacter, "direct", "{name}")).toBe("Test Character");
      expect(engine.process(mockCharacter, "span", "name")).toBe("");
    });
  });

  describe("createCustomParserEngine", () => {
    it("should create engine with custom processor map", () => {
      const tempEngine = ParserFactory.createParserEngine(); // Create engine for processors that need it
      const customMap = new Map([
        ["custom-direct", new DirectProcessor(tempEngine)],
        ["custom-span", new SpanProcessor()],
      ]);

      const engine = ParserFactory.createCustomParserEngine(customMap);

      expect(engine).toBeInstanceOf(ParserEngine);
      expect(engine.hasProcessor("custom-direct")).toBe(true);
      expect(engine.hasProcessor("custom-span")).toBe(true);

      // Verify default processors are not registered
      expect(engine.hasProcessor("array-string-builder")).toBe(false);
      expect(engine.hasProcessor("direct-complex")).toBe(false);

      const registeredTypes = engine.getRegisteredTypes();
      expect(registeredTypes).toContain("custom-direct");
      expect(registeredTypes).toContain("custom-span");
      expect(registeredTypes).toHaveLength(2);
    });

    it("should create engine with empty processor map", () => {
      const emptyMap = new Map();

      const engine = ParserFactory.createCustomParserEngine(emptyMap);

      expect(engine).toBeInstanceOf(ParserEngine);

      // Should have no processors registered
      expect(engine.hasProcessor("direct")).toBe(false);
      expect(engine.hasProcessor("span")).toBe(false);

      const registeredTypes = engine.getRegisteredTypes();
      expect(registeredTypes).toHaveLength(0);
    });

    it("should handle single processor registration", () => {
      const singleProcessorMap = new Map([
        ["only-processor", new SpanProcessor()], // Use SpanProcessor which doesn't need engine
      ]);

      const engine = ParserFactory.createCustomParserEngine(singleProcessorMap);

      expect(engine.hasProcessor("only-processor")).toBe(true);
      expect(engine.hasProcessor("nonexistent")).toBe(false);

      const registeredTypes = engine.getRegisteredTypes();
      expect(registeredTypes).toContain("only-processor");
      expect(registeredTypes).toHaveLength(1);
    });

    it("should handle multiple processor types", () => {
      const tempEngine = ParserFactory.createParserEngine(); // For processors that need engine reference
      const processorMap = new Map([
        ["type1", new SpanProcessor()],
        ["type2", new DirectProcessor(tempEngine)],
        ["type3", new ArrayStringBuilderProcessor(tempEngine)],
      ]);

      const engine = ParserFactory.createCustomParserEngine(processorMap);

      // Verify all processors were registered
      expect(engine.hasProcessor("type1")).toBe(true);
      expect(engine.hasProcessor("type2")).toBe(true);
      expect(engine.hasProcessor("type3")).toBe(true);

      const registeredTypes = engine.getRegisteredTypes();
      expect(registeredTypes).toContain("type1");
      expect(registeredTypes).toContain("type2");
      expect(registeredTypes).toContain("type3");
      expect(registeredTypes).toHaveLength(3);
    });

    it("should handle processor map with complex type names", () => {
      const complexMap = new Map([
        ["complex-type-with-dashes", new SpanProcessor()],
        ["type_with_underscores", new SpanProcessor()],
        ["123numeric", new SpanProcessor()],
      ]);

      const engine = ParserFactory.createCustomParserEngine(complexMap);

      expect(engine.hasProcessor("complex-type-with-dashes")).toBe(true);
      expect(engine.hasProcessor("type_with_underscores")).toBe(true);
      expect(engine.hasProcessor("123numeric")).toBe(true);

      const registeredTypes = engine.getRegisteredTypes();
      expect(registeredTypes).toHaveLength(3);
    });

    it("should create working processors that can process data", () => {
      // Create a temp engine for DirectProcessor that needs engine reference
      const tempEngine = ParserFactory.createParserEngine(); // Use factory to get fully configured engine

      const processorMap = new Map([
        ["test-direct", new DirectProcessor(tempEngine)],
        ["test-span", new SpanProcessor()],
      ]);

      const engine = ParserFactory.createCustomParserEngine(processorMap);
      const mockCharacter = {
        name: "Test Character",
        level: 5,
      };

      // Test processors actually work
      const directResult = engine.process(mockCharacter, "test-direct", "{name}");
      expect(directResult).toBe("Test Character");

      const spanResult = engine.process(mockCharacter, "test-direct", "{level}");
      expect(spanResult).toBe("5");
    });

    it("should handle null processor map", () => {
      // This should throw since null doesn't have entries() method
      expect(() => {
        ParserFactory.createCustomParserEngine(null);
      }).toThrow();
    });

    it("should handle undefined processor map", () => {
      // This should throw since undefined doesn't have entries() method
      expect(() => {
        ParserFactory.createCustomParserEngine(undefined);
      }).toThrow();
    });
  });

  describe("static methods", () => {
    it("should have static createParserEngine method", () => {
      expect(typeof ParserFactory.createParserEngine).toBe("function");
    });

    it("should have static createCustomParserEngine method", () => {
      expect(typeof ParserFactory.createCustomParserEngine).toBe("function");
    });

    it("should not require instantiation", () => {
      // Should be able to call static methods without instantiation
      expect(() => {
        ParserFactory.createParserEngine();
      }).not.toThrow();

      expect(() => {
        ParserFactory.createCustomParserEngine(new Map());
      }).not.toThrow();
    });
  });
});
