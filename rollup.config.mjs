import fs from "fs";
import path from "path";

import dotenv from "dotenv-safe"; // Provides flexible definition of environment variables.

// The following plugins are for the main source bundle.
import copy from "rollup-plugin-copy"; // Copies files
import json from "@rollup/plugin-json"; // Allows import of JSON; used in dialog Handlebars content.
import postcss from "rollup-plugin-postcss"; // Process Sass / CSS w/ PostCSS
import { string } from "rollup-plugin-string"; // Allows loading strings as ES6 modules.

// Terser is used as an output plugin in both bundles to conditionally minify / mangle the output bundles depending
// on which NPM script & .env file is referenced.

import { terser } from "rollup-plugin-terser"; // Terser is used for minification / mangling

// Import config files for Terser and Postcss; refer to respective documentation for more information.
// We are using `require` here in order to be compliant w/ `fvttdev` for testing purposes.
import terserConfig from "./terser.config.mjs";
import postcssConfig from "./postcss.config.mjs";

import { fileURLToPath } from "url";
// eslint-disable-next-line no-shadow
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-shadow
const __dirname = path.dirname(__filename);

export default () => {
  // Load the .env file specified in the command line target into process.env using `dotenv-safe`
  // This is a very convenient and cross platform way to handle environment variables. Please note that the .env
  // files are committed to this repo, but in your module you should uncomment the `**.env` directive in `.gitignore`
  // so that .env files are not committed into your repo. The difference between `dotenv-safe` and `dotenv` is that
  // the former provides a template providing a sanity check for imported .env files to make sure all required
  // parameters are present. This template is located in `./env/.env.example` and can be checked into your repo.

  // There are two environment variables loaded from .env files.
  // process.env.FVTTDEV_DEPLOY_PATH is the full path to the destination of your module / bundled code.
  // process.env.FVTTDEV_COMPRESS specifies if the bundled code should be minified.
  // process.env.FVTTDEV_SOURCEMAPS specifies if the source maps should be generated.

  // process.env.TARGET is defined in package.json NPM scripts using the `cross-env` NPM module passing it into
  // running this script. It defines which .env file to use below.
  dotenv.config({
    example: `${__dirname}${path.sep}env${path.sep}.env.example`,
    path: `${__dirname}${path.sep}env${path.sep}${process.env.TARGET}.env`,
  });

  // Sanity check to make sure parent directory of FVTTDEV_DEPLOY_PATH exists.
  if (!fs.existsSync(path.dirname(process.env.FVTTDEV_DEPLOY_PATH))) {
    throw Error(
      `FVTTDEV_DEPLOY_PATH does not exist: ${process.env.FVTTDEV_DEPLOY_PATH}`
    );
  }

  // Reverse relative path from the deploy path to local directory; used to replace source maps path.
  const relativePath = path.relative(process.env.FVTTDEV_DEPLOY_PATH, ".");

  // Defines potential output plugins to use conditionally if the .env file indicates the bundles should be
  // minified / mangled.
  const outputPlugins = [];
  if (process.env.FVTTDEV_COMPRESS === "true") {
    outputPlugins.push(terser(terserConfig));
  }

  // Defines whether source maps are generated / loaded from the .env file.
  const sourcemap = process.env.FVTTDEV_SOURCEMAPS === "true";

  // Manually set `sourceMap` for PostCSS configuration.
  postcssConfig.sourceMap = sourcemap; // Potentially generate sourcemaps

  // Shortcuts
  const DIR = process.env.FVTTDEV_DEPLOY_PATH;
  const PS = path.sep;

  console.log(`Bundling target: ${process.env.TARGET}`);

  return [
    {
      input: `module${PS}theater-of-the-mind.js`,
      external: [],
      output: {
        file: `${DIR}${PS}theater-of-the-mind.js`,
        format: "es",
        plugins: outputPlugins,
        sourcemap,
        sourcemapPathTransform: (sourcePath) =>
          sourcePath.replace(relativePath, `.`),
      },
      plugins: [
        postcss(postcssConfig), // Engages PostCSS for Sass / CSS processing
        json(), // Allows import of JSON; used in dialog Handlebars content.
        string({ include: ["**/*.css", "**/*.html"] }), // Allows loading strings as ES6 modules; HTML and CSS.
        copy({
          targets: [{ src: "module/module.json", dest: DIR }],
        }),
      ],
    },
  ];
};
