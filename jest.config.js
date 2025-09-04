export default {
  testEnvironment: "jsdom",
  testMatch: ["**/*.test.js"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "src/module/vendor/dompurify.es.js",
    "src/module/utils/dompurify-sanitizer.js",
    "index.js",
    "test-mocks.js",
  ],
  coverageThreshold: {
    global: {
      lines: 80,
    },
  },
};
