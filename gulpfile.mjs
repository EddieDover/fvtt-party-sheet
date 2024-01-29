// SPDX-FileCopyrightText: 2022 Johannes Loher
// SPDX-FileCopyrightText: 2022 David Archibald
//
// SPDX-License-Identifier: MIT

import fs from "fs-extra";
import gulp from "gulp";
import { deleteAsync } from "del";
import sass from "gulp-dart-sass";
import sourcemaps from "gulp-sourcemaps";
import path from "node:path";
import buffer from "vinyl-buffer";
import source from "vinyl-source-stream";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import rollupStream from "@rollup/stream";

import rollupConfig from "./rollup.config.mjs";
import zip from "gulp-zip";

/********************/
/*  CONFIGURATION   */
/********************/

const packageId = "theater-of-the-mind";
const sourceDirectory = "./src";
const distDirectory = "./dist";
const stylesDirectory = `${sourceDirectory}/styles`;
const stylesExtension = "scss";
const sourceFileExtension = "js";
const staticFiles = ["assets", "fonts", "lang", "packs", "templates", "module.json"];

//*******************/
/*      BUILD       */
//*******************/

let cache;

/**
 * Build the distributable JavaScript code
 * @returns {NodeJS.ReadWriteStream} The built JavaScript code
 */
function buildCode() {
  return rollupStream({ ...rollupConfig(), cache })
    .on("bundle", (bundle) => {
      cache = bundle;
    })
    .pipe(source(`${packageId}.js`))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(`${distDirectory}/module`));
}

/**
 * Build style sheets
 * @returns {NodeJS.ReadWriteStream} The build style sheets
 */
function buildStyles() {
  return gulp
    .src(`${stylesDirectory}/${packageId}.${stylesExtension}`)
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest(`${distDirectory}/styles`));
}

/**
 * Copy static files
 */
async function copyFiles() {
  for (const file of staticFiles) {
    if (fs.existsSync(`${sourceDirectory}/${file}`)) {
      await fs.copy(`${sourceDirectory}/${file}`, `${distDirectory}/${file}`);
    }
  }
}

/**
 * Cleans the dist folder
 * @returns {NodeJS.ReadWriteStream} The cleaned files
 */
async function cleanDist() {
  return await deleteAsync([`${distDirectory}/**/*`, `${distDirectory}`]);
}

/**
 * Copies the files ot the dist folder in prep for packaging
 * @returns {NodeJS.ReadWriteStream} The copied files
 */
function copyDist() {
  // Take everything inside the dist folder and zip it into a subfolder named totm.zip
  return gulp.src(`${distDirectory}/**/*`).pipe(gulp.dest(`${distDirectory}/theater-of-the-mind`));
}

/**
 * Packages the dist subfolderfolder into a zip file
 * @returns {NodeJS.ReadWriteStream} The zipped files
 */
function zipDist() {
  return gulp
    .src(`${distDirectory}/theater-of-the-mind/**/*`, { base: `${distDirectory}` })
    .pipe(zip(`${packageId}.zip`))
    .pipe(gulp.dest(`${distDirectory}`));
}

/**
 * Watch for changes for each build step
 */
export function watch() {
  gulp.watch(`${sourceDirectory}/**/*.${sourceFileExtension}`, { ignoreInitial: false }, buildCode);
  gulp.watch(`${stylesDirectory}/**/*.${stylesExtension}`, { ignoreInitial: false }, buildStyles);
  gulp.watch(
    staticFiles.map((file) => `${sourceDirectory}/${file}`),
    { ignoreInitial: false },
    copyFiles,
  );
}

export const build = gulp.series(clean, buildCode, buildStyles, copyFiles); //gulp.parallel(buildCode, buildStyles, copyFiles));

/********************/
/*    DEV EXPORT    */
/********************/

export const devexport = gulp.series(cleanDist, build, copyDist, zipDist);

/********************/
/*      CLEAN       */
/********************/

/**
 * Remove built files from `dist` folder while ignoring source files
 */
export async function clean() {
  const files = [...staticFiles, "module"];

  if (fs.existsSync(`${stylesDirectory}/${packageId}.${stylesExtension}`)) {
    files.push("styles");
  }

  console.log(" ", "Files to clean:");
  console.log("   ", files.join("\n    "));

  for (const filePath of files) {
    await fs.remove(`${distDirectory}/${filePath}`);
  }
}

/********************/
/*       LINK       */
/********************/

/**
 * Get the data paths of Foundry VTT based on what is configured in `foundryconfig.json`
 * @returns {string[]} The Foundry VTT data path
 */
function getDataPaths() {
  const config = fs.readJSONSync("foundryconfig.json");
  const dataPath = config?.dataPath;

  if (dataPath) {
    const dataPaths = Array.isArray(dataPath) ? dataPath : [dataPath];

    return dataPaths.map((vdataPath) => {
      if (typeof vdataPath !== "string") {
        throw new Error(
          `Property dataPath in foundryconfig.json is expected to be a string or an array of strings, but found ${vdataPath}`,
        );
      }
      if (!fs.existsSync(path.resolve(dataPath))) {
        throw new Error(`The dataPath ${dataPath} does not exist on the file system`);
      }
      return path.resolve(dataPath);
    });
  } else {
    throw new Error("No dataPath defined in foundryconfig.json");
  }
}

/**
 * Link build to User Data folder
 */
export async function link() {
  let destinationDirectory;
  if (fs.existsSync(path.resolve(sourceDirectory, "module.json"))) {
    destinationDirectory = "modules";
  } else {
    throw new Error("Could not find module.json");
  }

  const linkDirectories = getDataPaths().map((dataPath) =>
    path.resolve(dataPath, "Data", destinationDirectory, packageId),
  );

  const argv = yargs(hideBin(process.argv)).option("clean", {
    "alias": "c",
    "type": "boolean",
    "default": false,
  }).argv;
  const cclean = argv.c;

  for (const linkDirectory of linkDirectories) {
    if (cclean) {
      console.log(`Removing build in ${linkDirectory}.`);

      await fs.remove(linkDirectory);
    } else if (!fs.existsSync(linkDirectory)) {
      console.log(`Linking dist to ${linkDirectory}.`);
      await fs.ensureDir(path.resolve(linkDirectory, ".."));
      await fs.symlink(path.resolve(distDirectory), linkDirectory);
    } else {
      console.log(`Skipped linking to ${linkDirectory}, as it already exists.`);
    }
  }
}
