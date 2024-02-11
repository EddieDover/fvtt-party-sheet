# Theater of the Mind - A [FoundryVTT](https://www.foundryvtt.com) Module
![Latest Release Download Count](https://img.shields.io/badge/dynamic/json?label=Downloads@latest&query=assets%5B1%5D.download_count&url=https%3A%2F%2Fapi.github.com%2Frepos%2FEddieDover%2Ftheater-of-the-mind%2Freleases%2Flatest)
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Ftheater-of-the-mind&colorB=4aa94a)
[![Foundry Hub Endorsements](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Ftheater-of-the-mind%2Fshield%2Fendorsements)](https://www.foundryvtt-hub.com/package/theater-of-the-mind/)
[![Foundry Hub Comments](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Ftheater-of-the-mind%2Fshield%2Fcomments)](https://www.foundryvtt-hub.com/package/theater-of-the-mind/)

This module provides a GM with a table of characters, online only, or all, configurable in settings, in order to quickly see important stats, traits, abilites, etc. of all characters. Originally 5e only, it is now system agnostic and you can create easy to make .json templates for your system. It supports native Foundry and The Forge. Complete instructions for creating templates and placing them in the right folder on Foundry and Forge are included in the [TEMPLATE_README.md](https://github.com/EddieDover/Theater-of-the-mind/TEMPLATE_README.md) file.

The original intent of this module was to provide a 'party view' feature that I found missing when I first started using [FoundryVTT](https://www.foundryvtt.com) instead of [Fantasy Grounds](https://www.fantasygrounds.com). It will be updated with features that I personally want or need, or are requested of me by some poor soul. Several templates for various systems have been created, and more are already in the works with even more planned.

If you create a template, please submit it via email, Discord or GitHub as a Pull Request, and we will include it in future updates with full credit.

## Features
- Adds a 'Party Sheet' similar to that provided by Fantasy Grounds. Just click the Party Sheet icon on the Tokens Controls sub-menu.

  - The Party Sheet can be configured via the options to either display only currently connected players, or all non-npc characters. When using the all-characters display, there is a separate dialog to allow hiding of any characters the DM doesn't need to worry about. See the [TEMPLATE_README.md](https://github.com/EddieDover/Theater-of-the-mind/TEMPLATE_README.md) file for instructions on how to create a json file for your own system.

  - Clicking a character portrait will open their sheet.

  - The Party Sheet is no longer bound to simply the built-in dnd5e system. Additional systems can be supported by writing a JSON file following the guidelines in [TEMPLATE_README.md](https://github.com/EddieDover/Theater-of-the-mind/TEMPLATE_README.md) and placing it in either:

    - Native Foundry: your <FOUNDRY_VTT/Data/totm/> folder.
    - The Forge: the folder named <totm> at the top level of your assets library (created by the module).

- Sound effects support if you have Syrinscape ([fvtt-syrin-control](https://github.com/frondeus/fvtt-syrin-control)) and Midi QOL ([midi-qol](https://gitlab.com/tposney/midi-qol/)) installed.

## Systems & Templates

### Template Examples

For a comprehensive list of the pre-made templates provided by this module and screenshots of each, please see **[TEMPLATE_LIST.md](https://github.com/EddieDover/Theater-of-the-mind/TEMPLATE_LIST.md)** or examine the contents of the [example_templates](https://github.com/EddieDover/Theater-of-the-Mind/example_templates) folder.

### Making your own system template

Please see the [TEMPLATE_README.md](https://github.com/EddieDover/Theater-of-the-Mind/TEMPLATE_README.md) for information on how to create your own template.

### Template Installation

If using native **Foundry**, place the templates you wish to use in the <FOUNDRY_VTT/Data/totm/> folder.

If using **The Forge**, this module will create a folder at the top level of your Assets Library named `totm`. Place your templates in this folder.

If using The Forge, install the module on your local Foundry installation to have access to the [example_templates](https://github.com/EddieDover/Theater-of-the-Mind/example_templates) folder, and to upload any you would like to use to your Assets Library in the <totm> folder at the top level. Or, if you haven't installed Foundry and only used the license key on The Forge, use the GitHub link above. In this case, you will have to download the file to your computer, then upload it to The Forge. If you create a template, please submit it via email, Discord or GitHub, and we will include it in future updates with full credit.

# Support

Feel free to file a Bug Report / Feature Request under the Issues tab of Github.

Or you can join my **Discord** server here: https://discord.gg/XuGx7zNMKZ

# Screenshots

Primary Icon:

![Party Sheet Icon](images/psi.png)

Party Sheet Window:

![Preview of Plugin Party Sheet - Only Connected Players](images/preview1.png)
