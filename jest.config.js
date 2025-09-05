export default {
  testEnvironment: "jsdom",
  testMatch: ["**/*.test.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/module/vendor/**",
    "!src/module/utils/dompurify-sanitizer.js",
    "!src/module/app/**",
    "!src/module/parsing/index.js",
    "!src/module/parsing/processors/index.js",
    "!src/module/fvtt-party-sheet.js",
    "!src/module/typeDefs.js",
    "!**/*.test.js",
    "!**/test-mocks.js",
    "!**/node_modules/**",
  ],
  coveragePathIgnorePatterns: ["/node_modules/"],
  coverageThreshold: {
    global: {
      lines: 95,
    },
  },
};
