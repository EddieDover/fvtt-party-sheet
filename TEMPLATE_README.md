# Template System JSON Documentation

## Table of Contents
1. [Overview & Installation](#overview--installation)
2. [Template Structure](#template-structure)
   - [Required Properties](#required-properties)
   - [Optional Properties](#optional-properties)
3. [Row and Column Configuration](#row-and-column-configuration)
   - [Column Types](#column-types)
   - [Column Properties](#column-properties)
4. [Special Keywords & Text Processing](#special-keywords--text-processing)
   - [Property References](#property-references)
   - [Mathematical Operations](#mathematical-operations)
   - [Formatting Tags](#formatting-tags)
   - [UI Elements](#ui-elements)
5. [Advanced Features](#advanced-features)
   - [Direct-Complex Conditions](#direct-complex-conditions)
   - [Array Processing](#array-processing)
   - [Object Loops](#object-loops)
   - [Table Layout Control](#table-layout-control)
6. [Examples](#examples)
7. [Troubleshooting & Tips](#troubleshooting--tips)

## Overview & Installation

Examples can be found in the [example_templates](https://github.com/EddieDover/fvtt-party-sheet/tree/main/example_templates) folder. Several systems other than 5e have been made, and are in the [example_templates] folder in native Foundry. If using the Forge, install the module on your local Foundry installation to have access to the [example_templates] folder, and to upload any you would like to use to your Assets Library in the `<partysheets>` folder at the top level. Or, if you haven't installed Foundry and only used the license key on The Forge, use the GitHub link above. In this case, you will have to download the file to your computer, then upload it to The Forge. If you create a template, please submit it via email or GitHub, and we will include it in future updates with full credit.

**Installation Locations:**
- **Native Foundry:** Place your templates in the `<FOUNDRY_VTT/Data/partysheets/>` folder.
- **The Forge:** This module will create a folder at the top level of your Assets Library named `partysheets`. Place your templates in this folder.

## Template Structure

### Required Properties

```json
{
  "name": "<YOUR_TEMPLATE_NAME>",
  "system": "<YOUR_TEMPLATE_SYSTEM>",
  "author": "<YOUR_NAME>",
  "version": "<TEMPLATE_VERSION>",
  "minimumSystemVersion": "<MINIMUM_SYSTEM_VERSION>",
  "maximumSystemVersion": "<MAXIMUM_SYSTEM_VERSION>", // Optional
  "rows": [] // See Row Configuration section for details
}
```

**Templates will be displayed to the user as 'YOUR_TEMPLATE_NAME - YOUR_NAME' and only if the system matches the current system in use.**

- **name** - The display name for your template
- **system** - The exact game system ID this template is designed for (e.g., dnd5e, pf1e, pf2e, sfrpg, alienrpg)
- **author** - The author or creator of this template
- **version** - Template version using semantic versioning (e.g., "1.0.0", "1.2.1")
- **minimumSystemVersion** - Minimum version of the game system required. Use the system's versioning format: MAJOR.MINOR (e.g., "2.4") or MAJOR.MINOR.PATCH (e.g., "1.0.12")
- **maximumSystemVersion** - (Optional) Maximum version of the game system that this template supports. When specified, templates will only be shown when the current system version is within the range.
- **rows** - Array of template row data (see Row Configuration section)

### Optional Properties

The following properties are also available at the top level of the template structure.

**offline_excludes_property** - (string, default: `"actor.type"`) - Property path to check for exclusion. All overrides are treated as if their parent object is the character.

**offline_excludes** - (array, default: `["npc"]`) - Any actor whose exclusion property matches these values will be excluded from the party list.

```json
{
  "offline_excludes_property": "system.subtype",
  "offline_excludes": [
    "npc",
    "vehicle", 
    "creature",
    "base",
    "starship"
  ]
}
```

**offline_includes_property** - (string, no default) - Property path to check for inclusion. If used, both this and `offline_includes` are required. When used, excludes properties are ignored.

**offline_includes** - (array, no default) - Inclusion list - only actors whose inclusion property matches these values will be shown.

```json
{
  "offline_includes_property": "system.subtype",
  "offline_includes": [
    "pc"
  ]
}
```

## Row and Column Configuration

### Row Structure

The "rows" property contains an array of arrays, where each inner array represents a table row:

```json
"rows": [
  [/* Row 1 columns */],
  [/* Row 2 columns */],
  [/* Row 3 columns */]
]
```

**Each row must have the same number of columns.** Use empty columns when needed:

```json
{
  "name": "empty_column",
  "type": "direct", 
  "header": "hide",
  "text": ""
}
```

### Column Types

Each column requires these basic properties:

```json
{
  "name": "<UNIQUE_COLUMN_NAME>",
  "type": "<DATA_TYPE>",
  "header": "<COLUMN_VISIBILITY>", 
  "text": "<DATA_VALUE>"
}
```

**Available Column Types:**

- **direct** - Processes text with property replacement and special keywords
- **direct-complex** - Conditional logic with exists/match operations  
- **string** - Displays literal text without processing
- **array-string-builder** - Builds formatted strings from array data
- **object-loop** - Loops through object properties with optional filtering
- **largest-from-array** / **smallest-from-array** - Returns largest/smallest numeric value from array
- **charactersheet** - Displays clickable character sheet icon
- **span** - Placeholder for rowspan cells (see Table Layout section)

### Column Properties

**Required Properties:**

- **name** - Unique identifier for the column. Displayed as header if `header` is "show"
- **type** - Data processing type (see Column Types above)
- **header** - Controls column header visibility: "show" or "hide" 
- **text** - Data configuration (string, array, or boolean depending on type)

**Optional Properties:**

- **align** - Horizontal alignment: "left", "center", "right"
- **valign** - Vertical alignment: "top", "bottom" (overrides system CSS when set)
- **headerAlign** - Horizontal alignment for the header text: "left", "center", "right"
- **minwidth** - Minimum column width in pixels (number, no quotes): `"minwidth": 100`
- **maxwidth** - Maximum column width in pixels (number, no quotes): `"maxwidth": 200`
- **showSign** - (direct/direct-complex only) Show "+" for positive numbers: `"showSign": true`
- **showTotal** - Show column total in footer (numeric values only): `"showTotal": true`
- **colspan** - Span across multiple columns: `"colspan": 2`
- **rowspan** - Span across multiple rows: `"rowspan": 2` (requires span placeholders)

```json
{
  "name": "STR",
  "type": "direct",
  "header": "show",
  "text": "{system.abilities.str.mod}",
  "align": "center",
  "showSign": true,
  "minwidth": 50,
  "maxwidth": 100
}
```

## Special Keywords & Text Processing

### Property References

**All property references must be wrapped in braces `{}`** to be processed as dynamic values. Properties not wrapped in braces will be treated as literal text.

- **CORRECT** - `"text": "STR: {system.attributes.str.value}"`
- **CORRECT** - `"text": "Character {name} has {system.attributes.str.value} STR"`  
- **INCORRECT** - `"text": "STR: system.attributes.str.value"` (displays as literal text)

**Auto-Value Resolution:** For convenience, if you reference `{system.attributes.str}` but the actual value is at `system.attributes.str.value`, the module will automatically append `.value` and use that if it exists.

### Text Value Types

- **Boolean:** No quotes needed: `"match": true` or `"match": false`
- **Numbers:** Match your system's data type:
  - Plain numbers: `"match": 23` (no quotes)
  - String numbers: `"match": "23"` (with quotes)
- **Strings:** Include arbitrary text: `"text": "{name} has {system.criticalInjury.time} days left"`

### Mathematical Operations

The template system supports mathematical operations on numeric values:

- **{+}** - Addition: `"{system.str} {+} {system.wis}"` → Sum of STR and WIS
- **{-}** - Subtraction: `"{system.hp.max} {-} {system.hp.value}"` → HP remaining  
- **{*}** - Multiplication: `"{system.level} {*} 2"` → Double the level
- **{/}** - Division: `"{system.hp.max} {/} 4"` → Quarter of max HP

Operations support decimals and negative numbers with optional spacing around operators.

### Formatting Tags

Text formatting using HTML-like tags:

- **{i}** and **{/i}** - _Italic text_
- **{b}** and **{/b}** - **Bold text**  
- **{u}** and **{/u}** - <u>Underlined text</u>
- **{newline}** or **{nl}** - Line breaks
- **{s}** - Single non-breaking space
- **{s#}** - Multiple spaces (replace # with number): `{s3}` = 3 spaces
- **{s0}** - Remove all spaces before and after this tag

Example: `"text": "{b}Name:{/b} {name}{newline}{i}Level {system.level}{/i}"`

### UI Elements

**Progress Bars:**
- **{progress CURRENT MAX}** - Basic progress bar: `{progress {system.hp.value} {system.hp.max}}`
- **{progress CURRENT MAX COLOR}** - Colored progress bar: `{progress 75 100 #FF5722}` or `{progress 75 100 red}`

**Meters (with thresholds):**
- **{meter VALUE MIN MAX [LOW] [HIGH] [OPTIMUM]}** - HTML meter with optional thresholds
- Basic: `{meter 75 0 100}` 
- With thresholds: `{meter 25 0 100 30 70 50}` (low=30, high=70, optimum=50)
- All parameters support embedded values and math operations

**Character Sheet:**
- **{charactersheet}** - Clickable character portrait that opens the character sheet

**Font Awesome Icons:**
- **{fa fa-ICON-CLASS}** - Embed Font Awesome icons: `{fa fa-solid fa-hand-fist}`

Example with icon: `"text": "{fa fa-heart} {system.hp.value}/{system.hp.max}"`

## Advanced Features

### Direct-Complex Conditions

The direct-complex type provides conditional logic for displaying data based on certain criteria.

**Condition Types:**

**exists** - Check if a property exists and has a truthy value:
```json
{
  "type": "exists",
  "value": "system.attributes.senses.darkvision",
  "text": "Darkvision: {system.attributes.senses.darkvision}",
  "else": "No darkvision" // Optional fallback
}
```

**match** - Check if a property equals a specific value:
```json
{
  "type": "match", 
  "ifdata": "system.general.career",
  "matches": "1",
  "text": "Colonial Marine",
  "else": "Unknown career" // Optional fallback
}
```

**match-any** - Check if a property matches any value in an array:
```json
{
  "type": "match-any",
  "text": ["system.class1", "system.class2"],
  "match": "fighter", 
  "text": "Is a Fighter class",
  "else": "Not a Fighter"
}
```

**Complete Example:**
```json
{
  "name": "Senses",
  "type": "direct-complex", 
  "header": "show",
  "text": [
    {
      "type": "exists",
      "value": "system.attributes.senses.darkvision",
      "text": "Darkvision: {system.attributes.senses.darkvision} "
    },
    {
      "type": "exists", 
      "value": "system.attributes.senses.blindsight",
      "text": "Blindsight: {system.attributes.senses.blindsight} "
    }
  ]
}
```

### Array Processing

**array-string-builder** - Build formatted strings from array data:

```json
{
  "name": "Statuses",
  "type": "array-string-builder", 
  "header": "show",
  "text": "statuses => {value}, "
}
```

This processes arrays like `["burning", "bleeding", "prone"]` into formatted output: "burning, bleeding, prone, "

**Syntax:** `arrayname => {property}` where all properties must be enclosed in braces `{}`. Use `{value}` to reference the array item itself, or `{propertyName}` to reference object properties.

**largest-from-array / smallest-from-array** - Extract min/max values:

```json
{
  "name": "Highest Ability",
  "type": "largest-from-array",
  "header": "show", 
  "text": "system.abilities"
}
```

Returns the largest numeric value from the specified array or object.

### Object Loops

**object-loop** - Loop through object properties with optional filtering:

**Basic Example:**
```json
{
  "name": "Classes",
  "type": "object-loop",
  "header": "show",
  "text": "classes => {i}{name}{/i} {b}{level}{/b} {newline}"
}
```

This processes an object like:
```json
{
  "classes": {
    "cleric": {"name": "Cleric", "level": 1},
    "rogue": {"name": "Rogue", "level": 1}
  }
}
```

Output: _Cleric_ **1**<br>_Rogue_ **1**

**Filtering Options:**

Object loops support powerful filtering to show only items that match specific conditions:

**String Matching Filters:**
- **contains** - Check if property contains a substring: `stats{rollLabel contains 'Save'} => {name}: {value}{nl}`
- **!contains** - Check if property doesn't contain a substring: `stats{rollLabel !contains 'Check'} => {name}: {value}{nl}`
- **startsWith** - Check if property starts with text: `stats{rollLabel startsWith 'Armor'} => {name}: {value}{nl}`
- **endsWith** - Check if property ends with text: `stats{rollLabel endsWith 'Save'} => {name}: {value}{nl}`

**Comparison Filters:**
- **==** - Equal to: `stats{value == 18} => {name}: {value}{nl}`
- **!=** - Not equal to: `stats{value != 0} => {name}: {value}{nl}`
- **>** - Greater than: `stats{value > 15} => {name}: {value}{nl}`
- **<** - Less than: `stats{value < 10} => {name}: {value}{nl}`
- **>=** - Greater than or equal: `stats{value >= 16} => {name}: {value}{nl}`
- **<=** - Less than or equal: `stats{value <= 12} => {name}: {value}{nl}`

**Type Filter:**
- Simple type matching: `items{weapon} => {name}` (filters where `type === 'weapon'`)

**Filter Examples:**
```json
{
  "name": "Stats",
  "type": "object-loop",
  "header": "show",
  "text": "system.stats{rollLabel contains 'Save'} => {label}: {value}{+}{mod}{nl}"
}
```

This filters the stats object to only show items where `rollLabel` contains the word 'Save', such as "Strength Save" or "Armor Save", excluding "Strength Check" entries.

**Multiple Loops with Filtering:**
```json
{
  "name": "Equipment",
  "type": "object-loop",
  "header": "show",
  "text": "[{u}Talents:{/u}{nl}] items{talent} => {name} {nl} || [{u}Weapons:{/u}{nl}] items{starshipweapon} => {name} Damage: {b}{system.damage}{/b}{nl} || [{u}Other:{/u}{nl}] items{item} => {name} {nl}"
}
```

Use `||` to separate multiple object loops. Each can have its own prefix text and filter criteria.

**Sub-Object Loops:**

The object-loop processor allows you to loop through non-array objects, and sometimes in doing so you may find the need to access the key of said object. Consider the following example where the abilities names are not listed inside of the ability objects.

```json
system.abilities = {
  "parkor": {
    "value": "5",
    "max": "10",
  },
  "dancing": {
    "value": "1",
    "max":"10"
  }
}
```

You are able to access the 'key' of the object using the keyword **objectLoopKey** like this:

```json
{
  "name": "Abilities",
  "type": "object-loop",
  "header": "show",
  "text": "system.abilities => {objectKeyLoop} - {value} / {max}{nl}"
}
```

This would result in:

    Parkor - 5/10
    Dancing - 1/10

**Dropdown Option:**
Prefix with `{dropdown}` to create a dropdown selector for viewing different sections:
```json
"text": "{dropdown} {u}Talents:{/u}{nl} items{talent} => {name} {nl} || {u}Weapons:{/u}{nl} items{weapon} => {name} {nl}"
```

**Prefix Text:**

You can add prefix text to each loop section by wrapping it in brackets:

```json
"text": "[Weapons] items{weapon} => {name}{nl}"
```

This will display "Weapons" before the looped items.

**Syntax:** `[Prefix] objectname{filter} => {property}` where properties are automatically processed with brace notation.

### Table Layout Control

**Column Spanning:**
```json
{
  "name": "Character Name",
  "type": "direct",
  "header": "show",
  "text": "{name}",
  "colspan": 2
}
```

The cell spans 2 columns. Subsequent columns in the same row are automatically adjusted.

**Row Spanning:**
```json
[
  [
    {
      "name": "Character Name",
      "type": "direct",
      "header": "show", 
      "text": "{name}",
      "rowspan": 2
    },
    {
      "name": "STR",
      "type": "direct",
      "header": "show",
      "text": "{system.abilities.str.value}"
    }
  ],
  [
    {
      "name": "span_placeholder",
      "type": "span",
      "header": "hide",
      "text": ""
    },
    {
      "name": "DEX", 
      "type": "direct",
      "header": "hide",
      "text": "{system.abilities.dex.value}"
    }
  ]
]
```

Use `"type": "span"` as placeholders in subsequent rows for rowspan cells.

**Column Totals:**
```json
{
  "name": "Gold",
  "type": "direct",
  "header": "show",
  "text": "{system.currency.gp}",
  "showTotal": true
}
```

Automatically calculates and displays a total sum in the table footer for numeric columns.

## Examples

### Basic Template

```json
{
  "name": "D&D 5E Basic",
  "system": "dnd5e",
  "author": "Your Name",
  "version": "1.0.0",
  "minimumSystemVersion": "2.4",
  "rows": [
    [
      {
        "name": "Character Sheet",
        "type": "charactersheet",
        "header": "hide",
        "text": ""
      },
      {
        "name": "Name",
        "type": "direct",
        "header": "show",
        "text": "{charactersheet} {name} {newline} {system.details.race}"
      },
      {
        "name": "Level",
        "type": "direct",
        "header": "show", 
        "text": "{system.details.level}"
      },
      {
        "name": "HP",
        "type": "direct",
        "header": "show",
        "text": "{system.attributes.hp.value}/{system.attributes.hp.max}"
      }
    ]
  ]
}
```

### Advanced Template with Conditions

```json
{
  "name": "D&D 5E Advanced",
  "system": "dnd5e", 
  "author": "Your Name",
  "version": "1.0.0",
  "minimumSystemVersion": "2.4",
  "rows": [
    [
      {
        "name": "Character",
        "type": "direct",
        "header": "show",
        "text": "{b}{name}{/b}{newline}{i}{system.details.race} {system.details.class}{/i}",
        "align": "center"
      },
      {
        "name": "Abilities",
        "type": "direct",
        "header": "show", 
        "text": "STR: {system.abilities.str.value} ({system.abilities.str.mod}){newline}DEX: {system.abilities.dex.value} ({system.abilities.dex.mod})",
        "showSign": true
      },
      {
        "name": "Senses",
        "type": "direct-complex",
        "header": "show",
        "text": [
          {
            "type": "exists",
            "value": "system.attributes.senses.darkvision", 
            "text": "Darkvision {system.attributes.senses.darkvision}ft "
          },
          {
            "type": "exists",
            "value": "system.attributes.senses.blindsight",
            "text": "Blindsight {system.attributes.senses.blindsight}ft "
          }
        ]
      }
    ]
  ]
}
```

## Troubleshooting & Tips

### Development Best Practices

**JSON Validation:**
- Use a JSON-friendly editor like VSCode or Notepad++ with syntax highlighting
- Validate your JSON using online tools like https://jsonlint.com/
- Watch for missing or extra commas, mismatched brackets, and quote marks

**Property Discovery:**
1. Enable the module debugger in settings
2. Turn off "show only online players"  
3. Open the console (F12) when viewing the party sheet
4. Look for "FVTT-PARTY_SHEET DEBUG CHARACTER LIST" entries
5. Expand actor objects to find the property paths you need

**Alternative:** Install "Illandril's Token Tooltips" module and enable "Data Key Debugger" to see all token properties by hovering.

### Common Issues

**Template Not Appearing:**
- Check system ID matches exactly (`dnd5e`, not `D&D5e`)
- Verify system version compatibility
- Check console for JSON validation errors
- Ensure file is in correct folder (`partysheets/`)

**Property Not Displaying:**
- Verify property path is correct using debugger
- Check if property needs `.value` appended
- Ensure property is wrapped in braces: `{system.hp.value}`
- Some properties may be strings that look like numbers

**Table Layout Issues:**
- Ensure all rows have the same number of columns
- Use empty columns with `"type": "direct"` and `"text": ""` as spacers
- For rowspan, include `"type": "span"` placeholders in subsequent rows
- Check that colspan values don't exceed available column space

### Platform-Specific Notes

**The Forge Users:**
- File caching may prevent updates from showing immediately
- Use different filenames during development to avoid cache issues
- Upload functionality doesn't overwrite existing files with same name
- Test locally first when possible

**Module Conflicts:**
- "Arius Planeswalker's Stylish Journal" can interfere with table rendering
- Some MAD Cartographer modules incorrectly set actor `type` to "character"
- Check for CSS conflicts with custom system styling

### Starter Templates

**Single Row Template:**
```json
{
  "name": "My System - Basic",
  "system": "your-system-id",
  "author": "Your Name",
  "version": "1.0.0", 
  "minimumSystemVersion": "1.0",
  "offline_excludes": ["npc", "base"],
  "rows": [
    [
      {
        "name": "Character Sheet",
        "type": "charactersheet",
        "header": "hide",
        "text": ""
      },
      {
        "name": "Name",
        "type": "direct", 
        "header": "show",
        "text": "{name}"
      }
    ]
  ]
}
```

**Two Row Template:**
```json
{
  "name": "My System - Two Rows",
  "system": "your-system-id", 
  "author": "Your Name",
  "version": "1.0.0",
  "minimumSystemVersion": "1.0",
  "offline_excludes": ["npc", "base"],
  "rows": [
    [
      {
        "name": "Character Sheet",
        "type": "charactersheet",
        "header": "hide", 
        "text": ""
      },
      {
        "name": "Name",
        "type": "direct",
        "header": "show",
        "text": "{name}"
      }
    ],
    [
      {
        "name": "empty_spacer",
        "type": "direct",
        "header": "hide",
        "text": ""
      },
      {
        "name": "empty_spacer2", 
        "type": "direct",
        "header": "hide",
        "text": ""
      }
    ]
  ]
}
```
