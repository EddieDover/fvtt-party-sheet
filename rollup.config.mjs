import copy from "rollup-plugin-copy";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
// Due to rollup-plugin-copy being garbage with globbing,
// switching to https://github.com/paulmelnikow/rollup-plugin-cpy may be necessary in the future.

export default () => ({
  input: "src/module/fvtt-party-sheet.js",
  output: {
    dir: "dist/module",
    format: "es",
    sourcemap: true,
  },
  plugins: [
    nodeResolve(),
    commonjs({
      include: /node_modules/,
      requireReturnsDefault: "auto",
    }),
    copy({
      targets: [
        { src: "*.md", dest: "dist" },
        // { src: "example_templates/*", dest: "dist/example_templates" },
        {
          src: "example_templates/**/*.json",
          dest: "dist/example_templates",
          rename(fname, extension, fullPath) {
            fullPath = fullPath.replace("example_templates/", "");
            fullPath = fullPath.replace(`/${fname}.${extension}`, "");
            if (extension === "json") {
              return `${fullPath}/${fname}.json`;
            }
            return `${fullPath}/${fname}.${extension}`;
          },
        },
      ],
      verbose: true,
    }),
  ],
});
