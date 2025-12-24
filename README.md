# fvtt-party-sheet - A [FoundryVTT](https://www.foundryvtt.com) Module

![Latest Release Download Count](https://img.shields.io/badge/dynamic/json?label=Downloads@latest&query=assets%5B1%5D.download_count&url=https%3A%2F%2Fapi.github.com%2Frepos%2FEddieDover%2Ffvtt-party-sheet%2Freleases%2Flatest)
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Ffvtt-party-sheet&colorB=4aa94a)
[![Foundry Hub Endorsements](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Ffvtt-party-sheet%2Fshield%2Fendorsements)](https://www.foundryvtt-hub.com/package/fvtt-party-sheet/)
[![Foundry Hub Comments](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Ffvtt-party-sheet%2Fshield%2Fcomments)](https://www.foundryvtt-hub.com/package/fvtt-party-sheet/)

## Links

Join the [Discord Server](https://discord.gg/mvMdc7bH2d) for support, to file bug reports, request templates, etc!

| Upcoming Changes | Template Readme | Template List | Template Repository
| --- | --- | --- | --- |
| [Link](UPCOMING_CHANGELOG.md) | [Link](https://github.com/EddieDover/fvtt-party-sheet-templates/blob/master/README.md) | [Link](https://www.github.com/EddieDover/fvtt-party-sheet-templates/blob/master/TEMPLATE_LIST.md) | [Link](https://www.github.com/EddieDover/fvtt-party-sheet-templates)

## About

This module provides the GM with a table of actors and associated data about each in order to quickly assess their important stats, traits, abilites, etc. 
Originally 5e only, it is now system agnostic and you can easily create templates for any system using JSON.

## Features

- Adds a 'Party Sheet' similar to that provided by Fantasy Grounds. Just click the Party Sheet icon on the Tokens Controls sub-menu.

- Supports both Foundry and The Forge.

- The GM has full control over the actors displayed by the sheet. They can choose to see or hide specific actors, groups of actors, actors only controlled by players, and only player linked actors who are online.

- Clicking a character portrait will open their sheet.

- In order to create new templates, a built-in JSON editor is provided to the GM, with the ability to view their template in real-time.

- GMs are given an extensive syntax set in order to craft complex and useful templates.

## Systems & Templates

### Template Examples

For a comprehensive list of the pre-made templates provided by this module and screenshots of each, please see **[TEMPLATE_LIST.md](https://github.com/EddieDover/fvtt-party-sheet-templates/blob/master/TEMPLATE_LIST.md)** or visit the [template repository](https://github.com/EddieDover/fvtt-party-sheet-templates).

### Making your own system template

Additional systems can be supported by writing a JSON file following the guidelines in the **[README.md](https://www.github.com/EddieDover/fvtt-party-sheet-templates/blob/master/README.md)** of the `fvtt-party-sheet-templates` repository and placing it in either:

  - Native Foundry: your `<FOUNDRY_VTT>/Data/partysheets/` folder.
  - The Forge: the folder named <partysheets> at the top level of your assets library (created by the module).

If you create a template, please submit it via email, [discord](https://discord.gg/mvMdc7bH2d), or as a Pull Request or [Issue](https://github.com/EddieDover/fvtt-party-sheet-templates/issues) to the templates repository.

### Template Installation

The module comes with a template installer that can be opened at any time. It will show you any templates currently available for your system, provided they exist and your current system version meets their critera. If you do not see a system template available to install then there isn't one available for your system or system version.

## API

Functionality for macros/etc is exposed behind game["fvtt-party-sheet"].api.XXXXX

Current Function List:

- togglePartySheet - Toggles the party open or closed.

## Support

Feel free to file a Bug Report / Feature Request under the Issues tab of Github.

## Screenshots

Primary Icon:

![Party Sheet Icon](images/psi.png)

Party Sheet Window:

![Preview of Plugin Party Sheet - Only Connected Players](images/preview1.png)

JSON Editor:

<img width="800" height="668" alt="image" src="https://github.com/user-attachments/assets/df922843-57f3-49ed-a0e3-a5f14f425e77" />

## Contributions

To contribute a translation or template, either:

1. Open a PR with the necessary new files and appropriate changes to the codebase
2. Open an issue and attach the relevant files.

## Unit Testing

This module uses a mix of jest and playwright. New tests, or enhancements to the testing pipeline, are always welcome.
