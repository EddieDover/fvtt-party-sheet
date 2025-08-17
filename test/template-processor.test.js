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
    test("should process properties with spaces format", () => {
      const template = "Class:  name  (Level  level )";
      const result = TemplateProcessor.processTemplate(template, testData);
      expect(result).toBe("Class: Wizard (Level 5)");
    });

    test("should process properties with braces format", () => {
      const template = "Class: {name} (Level {level})";
      const result = TemplateProcessor.processTemplate(template, testData);
      expect(result).toBe("Class: Wizard (Level 5)");
    });

    test("should process mixed formats", () => {
      const template = "Class: {name} - Level  level ";
      const result = TemplateProcessor.processTemplate(template, testData);
      expect(result).toBe("Class: Wizard - Level 5");
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
    test("should extract property names from spaces format when properties exist", () => {
      const template = "Class:  name  (Level  level )";
      // Note: extractPropertyNames now only extracts brace-wrapped properties
      // to avoid false positives. For spaces format, use processTemplate directly.
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

    test("should handle mixed formats", () => {
      const template = "Class: {name} - Level  level ";
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
