
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

*  added the ability for users to hide support buttons in the options. ([02ff424](https://github.com/EddieDover/fvtt-party-sheet/pull/41/commits/02ff42413b784f3dc6f09210ab2f2ed8171b79d2))

*  added Savage Worlds template by Mestre Digital ([#42](https://github.com/EddieDover/fvtt-party-sheet/pull/42)) ([c0679ea5](https://github.com/EddieDover/fvtt-party-sheet/commit/c0679ea50a75c93f951e7f685edac6d6732cf4c3))

### Bug Fixes

*  corrected invalid property names in template_readme ([2924e651](https://github.com/EddieDover/fvtt-party-sheet/commit/2924e6511863d6a9b1f7823667e94350a0b8cc2a))

## 2.0.0 (2024-01-29)

### New Features

*  Plugin is now system agnostic and allows any user to create templates for their favorite systems.
    * Documentation in [SYSTEMS.md]('https://github.com/EddieDover/fvtt-party-sheet/SYSTEMS.md')

*  Added support for Forge hosting ([3beb550d](https://github.com/EddieDover/fvtt-party-sheet/commit/3beb550d62030cd96a04aae7f06d399cd914fbb1))


## 1.4.7 (2023-10-17)

### Bug Fixes

*  now displays variant stats properly ([6e1c94b5](https://github.com/EddieDover/fvtt-party-sheet/commit/6e1c94b549a1019d43b195759536f686f822e11c))

## 1.4.6 (2023-10-17)

### Bug Fixes

*  prevent party sheet closing when opening character sheet ([1f0df29c](https://github.com/EddieDover/fvtt-party-sheet/commit/1f0df29ce5de6471333b3c50fc21a72a8aae82eb))

## 1.4.5 (2023-10-17)

### Chores

* rewrote template system ([60dbaad3](https://github.com/EddieDover/fvtt-party-sheet/commit/60dbaad30482cfc1c1006bb28d360d15d796a29f))
* rewrote actor show/hide functionality ([60dbaad3](https://github.com/EddieDover/fvtt-party-sheet/commit/60dbaad30482cfc1c1006bb28d360d15d796a29f))
* restyled dialogs ([60dbaad3](https://github.com/EddieDover/fvtt-party-sheet/commit/60dbaad30482cfc1c1006bb28d360d15d796a29f))


### New Features

*  added ability to click on characters and open sheet ([60dbaad3](https://github.com/EddieDover/fvtt-party-sheet/commit/60dbaad30482cfc1c1006bb28d360d15d796a29f))

## 1.4.0 (2023-10-17)

### New Features

*  added ability to show either online characters or a curated list of any non-npc ([5e209a14](https://github.com/EddieDover/fvtt-party-sheet/commit/5e209a140e2919710f7e1119dbfc3a0d7f82631e))

## 1.3.0 (2023-10-15)

### New Features

*  changed **sounds** dependency from attack-roll-check-5e with midi-qol ([3ef24300](https://github.com/EddieDover/fvtt-party-sheet/commit/3ef24300229b2365823791936000c11b28dd4561))
*  Added Dark Mode option toggle. ([91175ad4](https://github.com/EddieDover/fvtt-party-sheet/commit/91175ad4a088c01ab937ded8be1cf61a5427e00a))
*  added better changelog system ([2b104a68](https://github.com/EddieDover/fvtt-party-sheet/commit/2b104a68e4d2687fe3a4b0b25d7edb5166226ca9))

## 1.2.1 (2023-10-07)

### Bug Fixes

*  corrected issue where perception was showing persuasion instead ([ad5e0e3b](https://github.com/EddieDover/fvtt-party-sheet/commit/ad5e0e3b))

## 1.2.0 (2023-09-22)

### Chores

*  cleaned up sounds ([5c59228d](https://github.com/EddieDover/fvtt-party-sheet/commit/5c59228d))

### New Features

*  added spell sounds ([6489e4c6](https://github.com/EddieDover/fvtt-party-sheet/commit/6489e4c6))
*  added weapon sounds ([c237bfbc](https://github.com/EddieDover/fvtt-party-sheet/commit/c237bfbc))

## 1.1.0 (2023-09-21)


### New Features

* **party view:** Finished adding most party view sections. ([096c5e2](https://github.com/EddieDover/fvtt-party-sheet/commit/096c5e273b1513347e9640636a61413163804b07))
* **sounds:** Added ALPHA Syrinscape Support. ([b6145fc](https://github.com/EddieDover/fvtt-party-sheet/commit/b6145fcbe7e5107b43e13f6662312f1c2c70c244))
