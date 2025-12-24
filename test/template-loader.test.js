// eslint-disable-next-line no-shadow
import { jest } from "@jest/globals";
import { loadModuleTemplates } from "../src/module/template-loader.js";
import { setupFoundryMocks, cleanupFoundryMocks } from "./test-mocks.js";

describe("Template Loader", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    setupFoundryMocks();
    global.fetch = jest.fn();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanupFoundryMocks();
    delete global.fetch;
    consoleErrorSpy.mockRestore();
  });

  describe("loadModuleTemplates", () => {
    it("should successfully load templates for current system", async () => {
      const yamlContent = `dnd5e:
  - file: template1.json
    version: 1.0.0
    author: Test Author`;

      const validTemplate = {
        name: "Test Template",
        author: "Test Author",
        system: "dnd5e",
        version: "1.0.0",
        rows: [{ columns: [] }],
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(yamlContent),
        })
        .mockResolvedValueOnce({
          text: () => Promise.resolve(JSON.stringify(validTemplate)),
        });

      const result = await loadModuleTemplates();

      expect(result.success).toBe(true);
      expect(result.status).toBe("loaded");
      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].name).toBe("Test Template");
      expect(result.templates[0].path).toBeDefined();
      expect(result.templates[0].preview).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it("should handle fetch failure for templates.yaml", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      const result = await loadModuleTemplates();

      expect(result.success).toBe(false);
      expect(result.status).toBe("error");
      expect(result.templates).toHaveLength(0);
      expect(result.error).toContain("Unable to connect to template repository");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should handle network errors when fetching templates.yaml", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await loadModuleTemplates();

      expect(result.success).toBe(false);
      expect(result.status).toBe("error");
      expect(result.templates).toHaveLength(0);
      expect(result.error).toContain("Error loading templates");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should return not-found when system has no templates", async () => {
      const yamlContent = `pf2e:
  - file: template1.json`;

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(yamlContent),
      });

      const result = await loadModuleTemplates();

      expect(result.success).toBe(false);
      expect(result.status).toBe("not-found");
      expect(result.templates).toHaveLength(0);
      expect(result.error).toContain("No templates available for dnd5e");
    });

    it("should handle partial template loading failures", async () => {
      const yamlContent = `dnd5e:
  - file: template1.json
  - file: template2.json`;

      const validTemplate = {
        name: "Test Template",
        author: "Test Author",
        system: "dnd5e",
        version: "1.0.0",
        rows: [{ columns: [] }],
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(yamlContent),
        })
        .mockResolvedValueOnce({
          text: () => Promise.resolve(JSON.stringify(validTemplate)),
        })
        .mockRejectedValueOnce(new Error("Failed to load template"));

      const result = await loadModuleTemplates();

      expect(result.success).toBe(true);
      expect(result.status).toBe("loaded");
      expect(result.templates).toHaveLength(1);
      expect(result.error).toContain("1 template(s) failed to load");
    });

    it("should return empty status when all templates fail to load", async () => {
      const yamlContent = `dnd5e:
  - file: template1.json`;

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(yamlContent),
        })
        .mockRejectedValueOnce(new Error("Failed to load template"));

      const result = await loadModuleTemplates();

      expect(result.success).toBe(false);
      expect(result.status).toBe("empty");
      expect(result.templates).toHaveLength(0);
      expect(result.error).toContain("No templates found for dnd5e");
    });

    it("should handle invalid template JSON", async () => {
      const yamlContent = `dnd5e:
  - file: template1.json`;

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(yamlContent),
        })
        .mockResolvedValueOnce({
          text: () => Promise.resolve("invalid json"),
        });

      const result = await loadModuleTemplates();

      expect(result.success).toBe(false);
      expect(result.status).toBe("empty");
      expect(result.templates).toHaveLength(0);
    });

    it("should handle template missing required fields", async () => {
      const yamlContent = `dnd5e:
  - file: template1.json`;

      const incompleteTemplate = {
        name: "Test Template",
        author: "Test Author",
        // Missing system and rows
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(yamlContent),
        })
        .mockResolvedValueOnce({
          text: () => Promise.resolve(JSON.stringify(incompleteTemplate)),
        });

      const result = await loadModuleTemplates();

      expect(result.success).toBe(false);
      expect(result.status).toBe("empty");
      expect(result.templates).toHaveLength(0);
    });

    it("should set correct preview path when provided", async () => {
      const yamlContent = `dnd5e:
  - file: template1.json`;

      const validTemplate = {
        name: "Test Template",
        author: "Test Author",
        system: "dnd5e",
        version: "1.0.0",
        rows: [{ columns: [] }],
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(yamlContent),
        })
        .mockResolvedValueOnce({
          text: () => Promise.resolve(JSON.stringify(validTemplate)),
        });

      const result = await loadModuleTemplates();

      expect(result.templates[0].preview).toContain("dnd5e/template1.jpg");
    });

    it("should parse YAML with multiline template entries", async () => {
      const yamlContent = `dnd5e:
  - file: template1.json
    version: 1.0.0
    author: Test Author
  - file: template2.json
    version: 2.0.0
    author: Another Author`;

      const validTemplate1 = {
        name: "Template 1",
        author: "Test Author",
        system: "dnd5e",
        version: "1.0.0",
        rows: [{ columns: [] }],
      };

      const validTemplate2 = {
        name: "Template 2",
        author: "Another Author",
        system: "dnd5e",
        version: "2.0.0",
        rows: [{ columns: [] }],
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(yamlContent),
        })
        .mockResolvedValueOnce({
          text: () => Promise.resolve(JSON.stringify(validTemplate1)),
        })
        .mockResolvedValueOnce({
          text: () => Promise.resolve(JSON.stringify(validTemplate2)),
        });

      const result = await loadModuleTemplates();

      expect(result.success).toBe(true);
      expect(result.templates).toHaveLength(2);
    });

    it("should handle YAML with comments", async () => {
      const yamlContent = `# This is a comment
dnd5e:
  # Another comment
  - file: template1.json`;

      const validTemplate = {
        name: "Test Template",
        author: "Test Author",
        system: "dnd5e",
        version: "1.0.0",
        rows: [{ columns: [] }],
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(yamlContent),
        })
        .mockResolvedValueOnce({
          text: () => Promise.resolve(JSON.stringify(validTemplate)),
        });

      const result = await loadModuleTemplates();

      expect(result.success).toBe(true);
      expect(result.templates).toHaveLength(1);
    });

    it("should handle YAML with empty lines", async () => {
      const yamlContent = `
dnd5e:

  - file: template1.json

`;

      const validTemplate = {
        name: "Test Template",
        author: "Test Author",
        system: "dnd5e",
        version: "1.0.0",
        rows: [{ columns: [] }],
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(yamlContent),
        })
        .mockResolvedValueOnce({
          text: () => Promise.resolve(JSON.stringify(validTemplate)),
        });

      const result = await loadModuleTemplates();

      expect(result.success).toBe(true);
      expect(result.templates).toHaveLength(1);
    });

    it("should parse YAML with version and author on same line", async () => {
      const yamlContent = `dnd5e:
  - file: template1.json version: 1.0.0 author: Test Author`;

      const validTemplate = {
        name: "Test Template",
        author: "Test Author",
        system: "dnd5e",
        version: "1.0.0",
        rows: [{ columns: [] }],
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(yamlContent),
        })
        .mockResolvedValueOnce({
          text: () => Promise.resolve(JSON.stringify(validTemplate)),
        });

      const result = await loadModuleTemplates();

      expect(result.success).toBe(true);
      expect(result.templates).toHaveLength(1);
    });

    it("should handle YAML with multiple systems", async () => {
      const yamlContent = `dnd5e:
  - file: dnd5e-template.json
pf2e:
  - file: pf2e-template.json`;

      const validTemplate = {
        name: "Test Template",
        author: "Test Author",
        system: "dnd5e",
        version: "1.0.0",
        rows: [{ columns: [] }],
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(yamlContent),
        })
        .mockResolvedValueOnce({
          text: () => Promise.resolve(JSON.stringify(validTemplate)),
        });

      const result = await loadModuleTemplates();

      expect(result.success).toBe(true);
      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].system).toBe("dnd5e");
    });

    it("should handle templates with complex paths", async () => {
      const yamlContent = `dnd5e:
  - file: subfolder/template-with-dashes_and_underscores.json`;

      const validTemplate = {
        name: "Complex Path Template",
        author: "Test Author",
        system: "dnd5e",
        version: "1.0.0",
        rows: [{ columns: [] }],
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(yamlContent),
        })
        .mockResolvedValueOnce({
          text: () => Promise.resolve(JSON.stringify(validTemplate)),
        });

      const result = await loadModuleTemplates();

      expect(result.success).toBe(true);
      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].preview).toContain("template-with-dashes_and_underscores.jpg");
    });
  });
});
