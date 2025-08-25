import { jest } from '@jest/globals';

/**
 * Shared mock utilities for Jest tests
 */

/**
 * Creates a complete mock of the FoundryVTT game object
 * @param {Object} overrides - Properties to override in the mock
 * @returns {Object} Mock game object
 */
export function createMockGame(overrides = {}) {
  const defaultMock = {
    system: { 
      id: "dnd5e", 
      version: "2.0" 
    },
    user: { 
      isGM: true 
    },
    settings: {
      get: jest.fn().mockReturnValue(true)
    },
    i18n: {
      format: jest.fn().mockImplementation((key, data = {}) => {
        // Mock common localization keys
        if (key === "fvtt-party-sheet.notifications.template-update-available") {
          return `Template updates available! ${data.count} template(s) have newer versions.`;
        }
        return key;
      }),
      localize: jest.fn().mockImplementation((key) => key)
    }
  };

  return { ...defaultMock, ...overrides };
}

/**
 * Creates a mock of the FoundryVTT ui object
 * @returns {Object} Mock ui object with notification methods
 */
export function createMockUI() {
  return {
    notifications: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      notify: jest.fn()
    }
  };
}

/**
 * Sets up complete FoundryVTT global mocks for tests
 * @param {Object} gameOverrides - Overrides for the game object
 * @param {Object} uiOverrides - Overrides for the ui object
 */
export function setupFoundryMocks(gameOverrides = {}, uiOverrides = {}) {
  global.game = createMockGame(gameOverrides);
  global.ui = { ...createMockUI(), ...uiOverrides };
}

/**
 * Cleans up FoundryVTT global mocks after tests
 */
export function cleanupFoundryMocks() {
  delete global.game;
  delete global.ui;
}

/**
 * Creates a mock console with suppressed output
 * Useful for tests that intentionally trigger console output
 * @returns {Object} Object containing spy functions and restore method
 */
export function createConsoleMocks() {
  return {
    errorSpy: jest.spyOn(console, 'error').mockImplementation(() => {}),
    warnSpy: jest.spyOn(console, 'warn').mockImplementation(() => {}),
    logSpy: jest.spyOn(console, 'log').mockImplementation(() => {}),
    infoSpy: jest.spyOn(console, 'info').mockImplementation(() => {}),
    
    restore() {
      this.errorSpy.mockRestore();
      this.warnSpy.mockRestore();
      this.logSpy.mockRestore();
      this.infoSpy.mockRestore();
    }
  };
}

/**
 * Mock template data for testing
 */
export const mockTemplateData = {
  basic: {
    name: "Template B",
    author: "Author 2",
    system: "dnd5e",
    version: "1.0.0",
    minimumSystemVersion: "1.5"
    // No maximumSystemVersion
  },
  
  withMaxVersion: {
    name: "Template A",
    author: "Author 1",
    system: "dnd5e",
    version: "1.0.0",
    minimumSystemVersion: "1.0",
    maximumSystemVersion: "2.0"
  },
  
  highRequirements: {
    name: "Template C",
    author: "Author 3",
    system: "dnd5e", 
    version: "1.0.0",
    minimumSystemVersion: "2.5",
    maximumSystemVersion: "3.0"
  },
  
  outOfDate: {
    name: "Old Template",
    author: "Test Author",
    system: "dnd5e",
    version: "1.0.0",
    minimumSystemVersion: "1.0",
    installedVersion: "0.9.0"
  }
};

/**
 * Common test utilities for version comparisons
 */
export const versionTestCases = {
  identical: [
    ["1.0.0", "1.0.0", 0],
    ["2.3.5", "2.3.5", 0],
    ["1.0", "1.0", 0]
  ],
  
  firstLower: [
    ["1.0.0", "1.0.1", -1],
    ["1.0.0", "1.1.0", -1],
    ["1.0.0", "2.0.0", -1],
    ["1.0", "1.1", -1]
  ],
  
  firstHigher: [
    ["1.0.1", "1.0.0", 1],
    ["1.1.0", "1.0.0", 1],
    ["2.0.0", "1.0.0", 1],
    ["1.1", "1.0", 1]
  ]
};
