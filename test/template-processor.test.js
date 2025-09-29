import { TemplateProcessor } from "../src/module/parsing/template-processor.js";

describe("TemplateProcessor", () => {
  const testData = {
    name: "Wizard",
    level: 5,
    system: {
      attributes: {
        hp: { value: 45, max: 50 },
      },
      details: {
        class: "Wizard",
      },
    },
    type: "class",
  };

  describe("processTemplate", () => {
    test("should process properties with braces format", () => {
      const template = "Class: {name} (Level {level})";
      const result = TemplateProcessor.processTemplate(template, testData);
      expect(result).toBe("Class: Wizard (Level 5)");
    });

    test("should process nested properties", () => {
      const template = "HP: {system.attributes.hp.value}/{system.attributes.hp.max}";
      const result = TemplateProcessor.processTemplate(template, testData);
      expect(result).toBe("HP: 45/50");
    });

    test("should handle missing properties gracefully", () => {
      const template = "Name: {name}, Missing: {nonexistent}";
      const result = TemplateProcessor.processTemplate(template, testData);
      expect(result).toBe("Name: Wizard, Missing: {nonexistent}");
    });

    test("should handle punctuation correctly with braces", () => {
      const template = "Class: {name}.";
      const result = TemplateProcessor.processTemplate(template, testData);
      expect(result).toBe("Class: Wizard.");
    });

    test("should not process space-surrounded words as properties", () => {
      const template = "Class: name (Level level)";
      const result = TemplateProcessor.processTemplate(template, testData);
      expect(result).toBe("Class: name (Level level)");
    });

    test("should handle multiple instances of same property", () => {
      const template = "{name} the {name}";
      const result = TemplateProcessor.processTemplate(template, testData);
      expect(result).toBe("Wizard the Wizard");
    });

    test("should convert null values to 0", () => {
      const dataWithNull = {
        name: "Test",
        score: null,
        value: 10,
      };
      const template = "Name: {name}, Score: {score}, Value: {value}";
      const result = TemplateProcessor.processTemplate(template, dataWithNull);
      expect(result).toBe("Name: Test, Score: 0, Value: 10");
    });
  });

  describe("processTemplateWithArray", () => {
    const arrayData = [
      { name: "Wizard", level: 5 },
      { name: "Fighter", level: 3 },
      { name: "Rogue", level: 4 },
    ];

    test("should process template with array data", () => {
      const template = "{name} (Lv.{level}), ";
      const result = TemplateProcessor.processTemplateWithArray(template, arrayData);
      expect(result).toBe("Wizard (Lv.5), Fighter (Lv.3), Rogue (Lv.4), ");
    });

    test("should handle empty array", () => {
      const template = "{name}: {level}";
      const result = TemplateProcessor.processTemplateWithArray(template, []);
      expect(result).toBe("");
    });
  });

  describe("extractPropertyNames", () => {
    test("should not extract space-surrounded words", () => {
      const template = "Class: name (Level level)";
      const properties = TemplateProcessor.extractPropertyNames(template);
      expect(properties).toEqual([]);
    });

    test("should extract property names from braces format", () => {
      const template = "Class: {name} (Level {level})";
      const properties = TemplateProcessor.extractPropertyNames(template);
      expect(properties).toEqual(["name", "level"]);
    });

    test("should extract nested property names", () => {
      const template = "HP: {system.attributes.hp.value}";
      const properties = TemplateProcessor.extractPropertyNames(template);
      expect(properties).toEqual(["system.attributes.hp.value"]);
    });

    test("should only extract brace-wrapped properties", () => {
      const template = "Class: {name} - Level level ";
      const properties = TemplateProcessor.extractPropertyNames(template);
      expect(properties).toEqual(["name"]);
    });

    test("should return empty array for template with no properties", () => {
      const template = "Static text with no properties";
      const properties = TemplateProcessor.extractPropertyNames(template);
      expect(properties).toEqual([]);
    });
  });
});
