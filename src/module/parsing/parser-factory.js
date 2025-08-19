import { ParserEngine } from "./parser-engine.js";
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
} from "./processors/index.js";

/**
 * @typedef {import('./base-processor.js').DataProcessor} DataProcessor
 */

/**
 * Factory class for creating and configuring the parser engine
 */
export class ParserFactory {
  /**
   * Create a fully configured parser engine with all processors registered
   * @returns {ParserEngine} The configured parser engine
   */
  static createParserEngine() {
    const engine = new ParserEngine();

    // Register all processors
    engine.registerProcessor("direct", new DirectProcessor(engine));
    engine.registerProcessor("direct-complex", new DirectComplexProcessor(engine));
    engine.registerProcessor("string", new StringProcessor());
    engine.registerProcessor("charactersheet", new CharacterSheetProcessor());
    engine.registerProcessor("array-string-builder", new ArrayStringBuilderProcessor(engine));
    engine.registerProcessor("object-loop", new ObjectLoopProcessor(engine));
    engine.registerProcessor("span", new SpanProcessor());
    engine.registerProcessor("largest-from-array", new LargestFromArrayProcessor());
    engine.registerProcessor("smallest-from-array", new SmallestFromArrayProcessor());

    return engine;
  }

  /**
   * Create a parser engine with custom processor configuration
   * @param {Map<string, DataProcessor>} processorMap - Custom processor configuration
   * @returns {ParserEngine} The configured parser engine
   */
  static createCustomParserEngine(processorMap) {
    const engine = new ParserEngine();

    for (const [type, processor] of processorMap.entries()) {
      engine.registerProcessor(type, processor);
    }

    return engine;
  }
}
