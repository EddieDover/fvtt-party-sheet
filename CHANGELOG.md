
## [3.0.0](https://github.com/EddieDover/fvtt-party-sheet/compare/v2.7.2...v3.0.0) (2025-12-24)


### Features

* able to hide all actors by type ([ad20c1c](https://github.com/EddieDover/fvtt-party-sheet/commit/ad20c1cd74d48e9ee478fb107a5f4f11c10c7e18))
* add maxHeight option for dropdowns and content in party sheet ([b567b90](https://github.com/EddieDover/fvtt-party-sheet/commit/b567b90819c257a739465cc35c71747be49cf287))
* added {meter} for meter displays ([85c05b1](https://github.com/EddieDover/fvtt-party-sheet/commit/85c05b124aa65b589245643c975708a481103410))
* added autorefresh without stealing focus to party sheet form ([9c27785](https://github.com/EddieDover/fvtt-party-sheet/commit/9c277856d32a0e1d91a768f04c82eb88560b314d))
* added color support with {c} tags ([1c35b2d](https://github.com/EddieDover/fvtt-party-sheet/commit/1c35b2dd039a4d9dfb29fd9db36868a5a5ad353c))
* added daggerheart template by Gensokian ([82ab0ed](https://github.com/EddieDover/fvtt-party-sheet/commit/82ab0edc5823c33110b0d7b86166b6f9ec13032e))
* added filtering to object-loops ([5c18cd1](https://github.com/EddieDover/fvtt-party-sheet/commit/5c18cd134513f4582904d98f80f76ad89e298397))
* added headerAlign property ([d5b246f](https://github.com/EddieDover/fvtt-party-sheet/commit/d5b246fd668ab7adc64510dff785ba81ab78110b))
* added notifications for template version updates ([a7ca6cb](https://github.com/EddieDover/fvtt-party-sheet/commit/a7ca6cbd7607aa39d776ec03aa3e68d297994e44))
* added objectLoopKey ([7b5ddee](https://github.com/EddieDover/fvtt-party-sheet/commit/7b5ddee0f38b2062274e22968405706e9c4efc88))
* added progress bar creation ([ab7f114](https://github.com/EddieDover/fvtt-party-sheet/commit/ab7f11403ab61332979ef9acd8559152dcaf73f4))
* allow players to view party sheet using selected GM template ([3e64a19](https://github.com/EddieDover/fvtt-party-sheet/commit/3e64a19cb6f2056055fa8812ab73572683ad6bd9))
* column total support ([2942148](https://github.com/EddieDover/fvtt-party-sheet/commit/29421482ce585bc2b5a5d65c55f57efeac5fdf3b))
* display only assigned characters toggle ([2546a26](https://github.com/EddieDover/fvtt-party-sheet/commit/2546a265588197b1661642c33251000f93b4ad88))
* enable resizable option for party sheet window ([a7b3b42](https://github.com/EddieDover/fvtt-party-sheet/commit/a7b3b424ea619564c2e3e0cf2ea27b1fe9fd7920))
* enhance object loop processing to support complex parsing scenarios with dropdowns ([8c34a4e](https://github.com/EddieDover/fvtt-party-sheet/commit/8c34a4e00227ce47105536f1a4a0232f701585d3))
* enhance object loop processing with multi-filter logic ([14b380f](https://github.com/EddieDover/fvtt-party-sheet/commit/14b380f9d26fb2945346ef473afd1b25db42c1c3))
* implemented colspan ([a3ac433](https://github.com/EddieDover/fvtt-party-sheet/commit/a3ac433625ce5dfc4584e58e761be30a2098743a))
* nested object-loops ([22ad181](https://github.com/EddieDover/fvtt-party-sheet/commit/22ad1817dd886bbad9be49e34b13fd03291c2ad7))
* streamlined template processing ([bdd25a4](https://github.com/EddieDover/fvtt-party-sheet/commit/bdd25a48c28c74c5b8b52f4d3afdcd6ed87874eb))

### Templates
* added maximumSystemVersion to EmoCuthulu dnd5e enhanced template ([fd1ef07](https://github.com/EddieDover/fvtt-party-sheet/commit/fd1ef070c0d10a56fd33340e9d09f9744408ff7d))
* mass-updated templates to use braces notation ([344be6f](https://github.com/EddieDover/fvtt-party-sheet/commit/344be6fe010101bdb4667abb697cbaebee8a3a9c))
* Added a new dnd5e template using more features ([5e47dd8](https://github.com/EddieDover/fvtt-party-sheet/commit/5e47dd8c41ae5ab464d42a79682e46d3a5fad440))
* added daggerheart template by Eddie Dover ([ed9e849](https://github.com/EddieDover/fvtt-party-sheet/commit/ed9e84939eb18f0ebc3f4ec463e8bc26cb18863d))
* added DC20 basic template ([25eedd5](https://github.com/EddieDover/fvtt-party-sheet/commit/25eedd540140430f4447fbb936cc8feae1a00e6c))
* added Mothership template ([b85a4d0](https://github.com/EddieDover/fvtt-party-sheet/commit/b85a4d03dfc04736f4e8778803ba3a1db2cefcb7))
* updated 1 swade template for 5.0.4 ([f5ca5d4](https://github.com/EddieDover/fvtt-party-sheet/commit/f5ca5d45fe7cfaffe3fde9a733980e53aaac525a))
* Updated dnd5e template to new value format ([5013ed2](https://github.com/EddieDover/fvtt-party-sheet/commit/5013ed28da940acc2735262ac307d7edfc48f802))
* updated swade template to newest system version ([865b976](https://github.com/EddieDover/fvtt-party-sheet/commit/865b9761e07769a781a3cae29e0209a098380840))


### Bug Fixes

* addressed a potential regex security issue ([5f93221](https://github.com/EddieDover/fvtt-party-sheet/commit/5f932215cd7c98adccde5f3143b3b3a0963bc0eb))
* allow json editor to work even when no templates are installed or available ([aef1b76](https://github.com/EddieDover/fvtt-party-sheet/commit/aef1b76f8e316dc7af74c9ec5b5c554f16a230ff))
* fixed a stray filepicker call ([e006d2e](https://github.com/EddieDover/fvtt-party-sheet/commit/e006d2e643d34629917d22b67f56dd147b9efaef))
* fixed character sheet popups ([1558316](https://github.com/EddieDover/fvtt-party-sheet/commit/155831608155edc8f19cdd10616c813cde73c94a))
* missed a select dropdown capture ([94e6664](https://github.com/EddieDover/fvtt-party-sheet/commit/94e6664c4dc203da8d221e459fa906db75dd45fc))
* party sheet should display portraits instead of tokens ([48c43e9](https://github.com/EddieDover/fvtt-party-sheet/commit/48c43e9d51b498182336b46da4ccc656b1428b6b))
* fixed 'jumpy' party sheet button ([eedc994](https://github.com/EddieDover/fvtt-party-sheet/commit/eedc994a304bf2f79e140b4700fe6d5cd5202c76))
* moved show button logic to fix duplication on template install ([d2d72d1](https://github.com/EddieDover/fvtt-party-sheet/commit/d2d72d18fba3bf1e539e3df18239fa601a21613d))


### Documentation

* fixed documentation link to example_templates ([0b44397](https://github.com/EddieDover/fvtt-party-sheet/commit/0b4439717cc7701203676278cee81fe2c17e4a11))
* updated documentation to reflect new braces requirements ([28b05e3](https://github.com/EddieDover/fvtt-party-sheet/commit/28b05e3745b1155d48e25fa04c6d27c3d76d46c3))
* updated readme to include Discord Link ([28f7284](https://github.com/EddieDover/fvtt-party-sheet/commit/28f72848f6c40c3cc3f43e7015657021c25b468e))

## [2.7.2](https://github.com/EddieDover/fvtt-party-sheet/compare/v2.7.1...v2.7.2) (2025-10-02)

### IMPORTANT NOTES:

This will be the last version of the plugin that supports V12 (unless breaking bugs are found). The new version is in testing and will release by mid-October. 

Upcoming Features include:
  - Notifications when community made templates have updates.
  - Updates to the Template Parsing Engine
  - Better Template Creation Documentation
  - New parsing support for colspan, more maths (addition, subtraction, multiplication, division, etc.), and column totals.
  - An in-foundry JSON template editor with intellisense and realtime-template previews.
  - Bug fixes
  - New Templates
  - **And More**
  - _**Due to changes in the template parsing engine, you will be required to update your community templates using the new installer. Custom templates will need to add curly braces to any value you want displayed on screen. More details will be in the full release notes.**_

### Bug Fixes

* updated broken templates ([82fb479](https://github.com/EddieDover/fvtt-party-sheet/commit/82fb479500136894bba3c835721f2d6ae77e201b))

## [2.7.1](https://github.com/EddieDover/fvtt-party-sheet/compare/v2.7.0...v2.7.1) (2025-06-01)

### Features

* **templates:** updated both dnd5e templates ([4793a0b](https://github.com/EddieDover/fvtt-party-sheet/commit/4793a0bfaa37637f761c08cf4e27b183d4583f7d))

### Bug Fixes

* corrected bug with array-string-builder failing to loop properly ([9ffbb52](https://github.com/EddieDover/fvtt-party-sheet/commit/9ffbb52f0704b1752ab65dfc1f4f0bd44ea1783e))

## [2.7.0](https://github.com/EddieDover/fvtt-party-sheet/compare/v2.6.0...v2.7.0) (2025-05-31)

### Features

* now shows an install wizard if no templates are installed for a system ([8416ac0](https://github.com/EddieDover/fvtt-party-sheet/commit/8416ac0a6228150096dff9a1bb1dc0687a08941d))
* **templates:** added Castles and Crusades template by PhildoBaggins ([f0a4cd2](https://github.com/EddieDover/fvtt-party-sheet/commit/f0a4cd2d2d5945aa0c9c77fa7e80b608e927486f))

### Bug Fixes

* updated UI to work with v13 ([5d77ee9](https://github.com/EddieDover/fvtt-party-sheet/commit/5d77ee920d0bd921e54d1f3fca42f482ad9c16cd))

## [2.6.0](https://github.com/EddieDover/fvtt-party-sheet/compare/v2.5.1...v2.6.0) (2024-08-26)

### Features

* added rowspan property and span type ([80e8433](https://github.com/EddieDover/fvtt-party-sheet/commit/80e84333f2f851dd70e56cf78e6a4624716b64da))
* added showSign property to force signs on numbers ([b6857df](https://github.com/EddieDover/fvtt-party-sheet/commit/b6857df55bc069e1e9eddf877f3c60e911bb5cf0))
* added support for font-awesome icons in templates ([2a64953](https://github.com/EddieDover/fvtt-party-sheet/commit/2a649539f6e96537120ee849ce0fe1ea79c98fc5))

### Template Updates

* added pf1 template ([1fda608](https://github.com/EddieDover/fvtt-party-sheet/commit/1fda60802f4db0bdbc0be8ea940d5d21c630f5d2))

## [2.5.1](https://github.com/EddieDover/fvtt-party-sheet/compare/v2.5.0...v2.5.1) (2024-06-13)

### Features

* added new discord link ([ce0a020](https://github.com/EddieDover/fvtt-party-sheet/commit/ce0a020739dd4f7703fab8c157398b929a89e271))

## [2.5.0](https://github.com/EddieDover/fvtt-party-sheet/compare/v2.4.1...v2.5.0) (2024-06-09)

### Features

* adds an API with a togglePartySheet function ([d93ecff](https://github.com/EddieDover/fvtt-party-sheet/commit/d93ecffa857f76917e4784bfe367dbee321642ce))

## [2.4.1](https://github.com/EddieDover/fvtt-party-sheet/compare/v2.4.0...v2.4.1) (2024-05-24)

### Features

* verified with Foundry v12 ([d589d83](https://github.com/EddieDover/fvtt-party-sheet/commit/d589d837cdc35e5db80c57cdb4d02cc3eaaed9ca))

## [2.4.0](https://github.com/EddieDover/fvtt-party-sheet/compare/v2.3.2...v2.4.0) (2024-04-06)

### Features

* added better error handling and notification for invalid templates ([9b82c8f](https://github.com/EddieDover/fvtt-party-sheet/commit/9b82c8f48b0f317ff3a186498a9d32291fc328ed))
* object-loop now allows for multiple objects per loop, filters, and prefix strings. See documentation. ([f93e688](https://github.com/EddieDover/fvtt-party-sheet/commit/f93e68840f8d6735874300c3ae29bf6e7367ecb0))
* object-loops may now contain a dropdown marker to save space. See documentation. ([8f34d98](https://github.com/EddieDover/fvtt-party-sheet/commit/8f34d981953d4d3b99e71b804db62d789b487c89))

## [2.3.2](https://github.com/EddieDover/fvtt-party-sheet/compare/v2.3.1...v2.3.2) (2024-03-20)

### Bug Fixes

* fixed party sheet button disappearing when changing scenes ([4661902](https://github.com/EddieDover/fvtt-party-sheet/commit/4661902c3630a141a64ff7b8f00195087832c3e9))
* **templates:** Hard-code links for example images to GitHub ([de4c344](https://github.com/EddieDover/fvtt-party-sheet/commit/de4c3445624b6d2a30d08e8dbff71927110ae3ce))
* **templates:** Updated all The Walking Dead templates to use the new max stress system in System 1.2+ ([23da5ba](https://github.com/EddieDover/fvtt-party-sheet/commit/23da5ba24a2f9b4262b7b027d63e75d27bbce0ad))

## [2.3.0](https://github.com/EddieDover/fvtt-party-sheet/compare/v2.2.0...v2.3.0) (2024-03-11)

### Features

* auto-generate html from markdown files for easier viewing and image embedding ([994e15c](https://github.com/EddieDover/fvtt-party-sheet/commit/994e15c4dfd872b439aea12b3d1da9b8d7cd2322))

### Bug Fixes

* Party Sheet Button should wait to display after all templates have been loaded. This will help on slower systems. ([5bc792e](https://github.com/EddieDover/fvtt-party-sheet/commit/5bc792ec08f929b8418efe8c2a48a27f3577ee12))

### Template Updates

* Added {s2} to "twdu-two-rows". ([ded7ca4](https://github.com/EddieDover/fvtt-party-sheet/commit/ded7ca4d04fa4422c3c7690f23b651e16aff1faf))
* Updated SWADE template.

## [2.2.0](https://github.com/EddieDover/fvtt-party-sheet/compare/v2.1.0...v2.2.0) (2024-03-02)

### Features

#### **_Now named fvtt-party-sheet instead of 'Theater of the Mind' to better reflect functionality._**

* added `object-loop` type. See documentation. ([51b9329](https://github.com/EddieDover/fvtt-party-sheet/commit/51b9329f76987b80b3eadcf1b655e073f86298ee))
* added spacing and space removing tags {s}, {s#}, {s0}. See documentation. ([312f1b6](https://github.com/EddieDover/fvtt-party-sheet/commit/312f1b6a1fb2b0780cd3c2777f2e5f53fb426ff3))
* added underline support with {u} {/u} ([693e372](https://github.com/EddieDover/fvtt-party-sheet/commit/693e372bf44bbb678c5d15449f0eea27fb4c79bd))
* largest-from-array and smallest-from-array will return the largest/smallest numeric values from an array ([e416972](https://github.com/EddieDover/fvtt-party-sheet/commit/e416972bc93053ecca770c4d9bf28bc60bb281dc)), closes [#65](https://github.com/EddieDover/fvtt-party-sheet/issues/65)
* remove alpha Syrinscape support ([4d0ac64](https://github.com/EddieDover/fvtt-party-sheet/commit/4d0ac6460c751812920879b0a93e5e561e0889b1))
* **templates:** Added World of Darkness (Vtm5e) - pmenezesdev ([517f36d](https://github.com/EddieDover/fvtt-party-sheet/commit/517f36dc909ceaaae02e25d18afa9b3df918bb04))
* **templates:** Alien RPG updated to show Careers from Building Better Worlds ([3c793cf](https://github.com/EddieDover/fvtt-party-sheet/commit/3c793cf4c9fb15782c181fa0ee4db97f34e36403))
* **templates:** All EmoCthulhu templates updated to use the new bold and italic tags. ([81e9fdd](https://github.com/EddieDover/fvtt-party-sheet/commit/81e9fdd7b7e1eac2250374c4d0c48ad1ad6e2470))
* **templates:** All EmoCthulhu Year Zero Engine templates updated to use all new special keywords. ([18f4bb8](https://github.com/EddieDover/fvtt-party-sheet/commit/18f4bb846f926a773934267baa473b8c491935ee))

## [2.1.0](https://github.com/EddieDover/fvtt-party-sheet/compare/v2.0.3...v2.1.0) (2024-02-25)

### Features

* added italics and bold markup ([ec4fc22](https://github.com/EddieDover/fvtt-party-sheet/commit/ec4fc22bbc60e5c9b0f119273ba53d773084f8e5))

* added Star Trek Adventures template ([b040948](https://github.com/EddieDover/fvtt-party-sheet/commit/b0409480ca6e8b46538a9d897a29d053b4caff0d))

* added Cyberpunk RED template ([b4213d3](https://github.com/EddieDover/fvtt-party-sheet/commit/b4213d36e466e509b38b0a789a9af267aa3471ca))

### Chores

* updated dnd5e_modified template ([b040948](https://github.com/EddieDover/fvtt-party-sheet/commit/b0409480ca6e8b46538a9d897a29d053b4caff0d))

* compressed template image files ([b040948](https://github.com/EddieDover/fvtt-party-sheet/commit/b0409480ca6e8b46538a9d897a29d053b4caff0d))

## 2.0.3 (2024-02-17)

### New Features

* added templates for coriolis "yzecoriolis" by Michael Card (Emo Cthulhu)

### Bug Fixes

* updated links in README

### Chores

* updated alienrpg, blade-runner, fallout, starfinder, the walking dead, vaesen  templates by Michael Card (Emo Cthulhu)

## 2.0.1 (2024-02-11)

### New Features

* added the ability for users to hide support buttons in the options. ([02ff424](https://github.com/EddieDover/fvtt-party-sheet/pull/41/commits/02ff42413b784f3dc6f09210ab2f2ed8171b79d2))

* added Savage Worlds template by Mestre Digital ([#42](https://github.com/EddieDover/fvtt-party-sheet/pull/42)) ([c0679ea5](https://github.com/EddieDover/fvtt-party-sheet/commit/c0679ea50a75c93f951e7f685edac6d6732cf4c3))

### Bug Fixes

* corrected invalid property names in template_readme ([2924e651](https://github.com/EddieDover/fvtt-party-sheet/commit/2924e6511863d6a9b1f7823667e94350a0b8cc2a))

## 2.0.0 (2024-01-29)

### New Features

* Plugin is now system agnostic and allows any user to create templates for their favorite systems.
  * Documentation in [SYSTEMS.md]('https://github.com/EddieDover/fvtt-party-sheet/SYSTEMS.md')

* Added support for Forge hosting ([3beb550d](https://github.com/EddieDover/fvtt-party-sheet/commit/3beb550d62030cd96a04aae7f06d399cd914fbb1))

## 1.4.7 (2023-10-17)

### Bug Fixes

* now displays variant stats properly ([6e1c94b5](https://github.com/EddieDover/fvtt-party-sheet/commit/6e1c94b549a1019d43b195759536f686f822e11c))

## 1.4.6 (2023-10-17)

### Bug Fixes

* prevent party sheet closing when opening character sheet ([1f0df29c](https://github.com/EddieDover/fvtt-party-sheet/commit/1f0df29ce5de6471333b3c50fc21a72a8aae82eb))

## 1.4.5 (2023-10-17)

### Chores

* rewrote template system ([60dbaad3](https://github.com/EddieDover/fvtt-party-sheet/commit/60dbaad30482cfc1c1006bb28d360d15d796a29f))
* rewrote actor show/hide functionality ([60dbaad3](https://github.com/EddieDover/fvtt-party-sheet/commit/60dbaad30482cfc1c1006bb28d360d15d796a29f))
* restyled dialogs ([60dbaad3](https://github.com/EddieDover/fvtt-party-sheet/commit/60dbaad30482cfc1c1006bb28d360d15d796a29f))

### New Features

* added ability to click on characters and open sheet ([60dbaad3](https://github.com/EddieDover/fvtt-party-sheet/commit/60dbaad30482cfc1c1006bb28d360d15d796a29f))

## 1.4.0 (2023-10-17)

### New Features

* added ability to show either online characters or a curated list of any non-npc ([5e209a14](https://github.com/EddieDover/fvtt-party-sheet/commit/5e209a140e2919710f7e1119dbfc3a0d7f82631e))

## 1.3.0 (2023-10-15)

### New Features

* changed **sounds** dependency from attack-roll-check-5e with midi-qol ([3ef24300](https://github.com/EddieDover/fvtt-party-sheet/commit/3ef24300229b2365823791936000c11b28dd4561))
* Added Dark Mode option toggle. ([91175ad4](https://github.com/EddieDover/fvtt-party-sheet/commit/91175ad4a088c01ab937ded8be1cf61a5427e00a))
* added better changelog system ([2b104a68](https://github.com/EddieDover/fvtt-party-sheet/commit/2b104a68e4d2687fe3a4b0b25d7edb5166226ca9))

## 1.2.1 (2023-10-07)

### Bug Fixes

* corrected issue where perception was showing persuasion instead ([ad5e0e3b](https://github.com/EddieDover/fvtt-party-sheet/commit/ad5e0e3b))

## 1.2.0 (2023-09-22)

### Chores

* cleaned up sounds ([5c59228d](https://github.com/EddieDover/fvtt-party-sheet/commit/5c59228d))

### New Features

* added spell sounds ([6489e4c6](https://github.com/EddieDover/fvtt-party-sheet/commit/6489e4c6))
* added weapon sounds ([c237bfbc](https://github.com/EddieDover/fvtt-party-sheet/commit/c237bfbc))

## 1.1.0 (2023-09-21)

### New Features

* **party view:** Finished adding most party view sections. ([096c5e2](https://github.com/EddieDover/fvtt-party-sheet/commit/096c5e273b1513347e9640636a61413163804b07))
* **sounds:** Added ALPHA Syrinscape Support. ([b6145fc](https://github.com/EddieDover/fvtt-party-sheet/commit/b6145fcbe7e5107b43e13f6662312f1c2c70c244))
