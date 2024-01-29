// SPDX-FileCopyrightText: 2022 Johannes Loher
// SPDX-FileCopyrightText: 2022 David Archibald
//
// SPDX-License-Identifier: MIT
import copy from "rollup-plugin-copy";
import { nodeResolve } from "@rollup/plugin-node-resolve";

export default () => ({
  input: "src/module/theater-of-the-mind.js",
  output: {
    dir: "dist/module",
    format: "es",
    sourcemap: true,
  },
  plugins: [
    nodeResolve(),
    copy({
      targets: [
        { src: "*.md", dest: "dist" },
        { src: "example_templates/*", dest: "dist/example_templates" },
      ],
    }),
  ],
});
