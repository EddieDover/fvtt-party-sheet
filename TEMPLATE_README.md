# Template System JSON Documentation

Examples can be found in the [example_templates](https://github.com/EddieDover/Theater-of-the-Mind/example_templates) folder. As well, several systems other than 5e have been made, and are in the [example_templates] folder in native Foundry. If using the Forge, install the module on your local Foundry installation to have access to the [example_templates] folder, and to upload any you would like to use to your Assets Library in the <totm> folder at the top level. Or, if you haven't installed Foundry and only used the license key on The Forge, use the GitHub link above. In this case, you will have to download the file to your computer, then upload it to The Forge. If you create a template, please submit it via email, Discord or GitHub, and we will include it in future updates with full credit.

If using native Foundry, place your templates in the <FOUNDRY_VTT/Data/totm/> folder.

If using The Forge, this module will create a folder at the top level of your Assets Library named `totm`. Place your templates in this folder.

## Required Minimal Top Level Structure

```json
{
  "name": "<YOUR_TEMPLATE_NAME>",
  "system": "<YOUR_TEMPLATE_SYSTEM>",
  "author": "<YOUR_NAME>",
  "rows": [] // See Below Section For Details
}
```

**Note: Templates will be displayed to the user as 'YOUR_TEMPLATE_NAME - YOUR_NAME' and only if the system matches the current system in use.**

### Optional Top Level Properties

The following properties are also available at the top level of the system structure.

  **offline_excludes_property** - string - This is optional and defaults to the value of `actor.type`. Only override if needed. All overrides are treated as if their parent object is the character. Example:
  ```json
  {
    "name": "<YOUR_TEMPLATE_NAME>",
    "system": "<YOUR_TEMPLATE_SYSTEM>",
    "author": "<YOUR_NAME>",
  	"offline_excludes_property": "system.subtype",
	  "offline_excludes": [
		    "npc"
	    ],
    "rows": [] // See Below Section For Details
  }
  ```

  **offline_excludes** - array - This is optional and defaults to `["npc"]`. Any object inside the exclusion list that matches the value of the offline_excludes_property will be excluded from showing in the party list. Example:
  ```json
  {
    "name": "<YOUR_TEMPLATE_NAME>",
    "system": "<YOUR_TEMPLATE_SYSTEM>",
    "author": "<YOUR_NAME>",
	  "offline_excludes": [
		    "npc",
        "vehicle",
        "creature",
        "base",
        "starship"
	    ],
    "rows": [] // See Below Section For Details
  }
  ```

  **offline_includes_property** - string - This is optional but required both it and **offline_includes** are required to work, if used. It has no default property. It will be treated as if its parent object is the character. If you use this, **offline_excludes_property**/**offline_excludes** will be ignored. Example:
  ```json
  {
    "name": "<YOUR_TEMPLATE_NAME>",
    "system": "<YOUR_TEMPLATE_SYSTEM>",
    "author": "<YOUR_NAME>",
  	"offline_includes_property": "system.subtype",
	  "offline_includes": [
		    "pc"
	    ],
    "rows": [] // See Below Section For Details
  }
  ```

  **offline_includes**: array - This is the same as **offline_excludes** but it is an inclusion list.

### Row Specific Structure

The "rows" property must contain an array of an array of column data.

``` "rows": [] ``` is empty

``` "rows": [ [] ] ``` will contain one row

``` "rows": "[ [], [] ]``` will contain two rows.

Inside the row array, the plugin expects items in the following format:
```json
{
  "name": "<COLUMN_NAME>",
  "type": "<DATA_TYPE>",
  "header": "<COLUMN_TYPE>",
  "text": "<DATA_VALUE>"
}
```

Therefore, a one row array should look like:
```json
 "rows": [
  [
  {

  },
  {

  }
  ]
]
```

Two rows should look like:
```json
 "rows": [
  [
    {

    },
    {

    }
  ],
  [
    {

    },
    {

    }
  ]
]
```

You can have more than two rows.

__Each item corresponds to a single column on the sheet. If you have multiple rows, then each row must have the same number of columns.__ See the below Examples section for more examples (and note, in the above structure example, the two row example has 2 columns in each). In order to achieve this, you may have to make empty columns:
```json
  {
    "name": ".",
    "type": "direct",
    "header": "hide",
    "text:" ""
  }, // no comma if the last column
```
Note that even empty columns need unique names. Feel free to be as descriptive as necessary, since the column **name** will not be displayed if the `header` is not `show`.  **No two columns can have the same `name` value.**

### Primary Property Specifics

**name** - This can be any value you wish. If the header is "show" then it will be displayed as the column header.

**type** - This is the type of data being displayed, possible choices are:
  * **direct** - This will process the text in the **value** property and parse out any string sections to see if they are properties of the character.
  * **direct-complex** - This will expect the **value** property to contain an array of complex types. See documentation below.
  * **string** - This will simply display the text in the **value** property without modification.
  * **array-string-builder** - This will accept a **value** property in the following format: **<array_object> => <sub_property_string>** See examples below for more information
  * **charactersheet** - This will display the character sheet in the column, ignoring anything in the **value** property.

**header** - This property controls if the column text is displayed as a header in the generated table. It accepts either 'show' or 'skip'.
  * **show** - Show the column as a **header** column.
  * **skip** - Do NOT Show the column as a **header** column.

**maxwidth** - This _optional_ property controls the maximum width of the column. Value must be a number that represents the width in pixels. `"maxwidth": 200,` (note the lack of quotes around the number)

**minwidth** - This _optional_ property controls the minimum width of the column. Value must be a number that represents the width in pixels. `"minwidth": 100,`

**valign** - This _optional_ property controls the vertical alignment of the cells. It only accepts 'top' and 'bottom'. If left out, or if an improper value is used, the setting will be ignored and will use whatever css the game system provides, since as some systems already override the table css and set the whole table to top, or middle. However, if your system has css code to set valign on table properties, using valign should override the system's value.

**text** - This property is either a **string**, **boolean**, or an **array** of objects based on if you're using **direct-complex** or not. See examples below.

### Text - accepted values
  * boolean - Quotes are not needed, simply use `false`, or `true`, i.e. `"match": true,`
  * numbers - Always examine your systems values to see if they are strings or plain numbers, if they are plain numbers do not include quotes around the value, i.e. `"match": 23,` If they are actually strings, then you will need to surround the number with quotes to make it a string as well, i.e. `"match:" "23",`
  * string:  You can include arbitrary text in your output values. Simply make sure they are within the quotes for the text you are creating, i.e. `"text": "name has system.criticalInjury.time days left before system.criticalInjury.name heals.`
  * Due to the way things are parsed by the plugin there are a few very important caveats you must keep in mind:
    1. If you are using a data string like "system.attributes.str", or a keyword (see below) like `{newline}`, along with custom text, such as `STR: system.attributes.str` as an output, there **must** be spaces around the data string,
          - INCORRECT - `STR:system.attributes.str/system.attributes.maxstr`
          - CORRECT     - `STR: system.attributes.str / system.attributes.maxstr`
  * The more astute among you may notice that in the example templates, `.value` is often left out. To save your poor typing muscles, even if the value you find for a piece of character data is `system.attributes.str.value` the module parses data in the following way. Entering `system.attributes.str` will make the module look for `system.attributes.str.value` and display that if it finds it. If not found, it will display `system.attributes.str` as is.

### Text - Special Keywords

There are a few special keywords that must be surrounded by { } marks, to allow easier formatting, note that they must be surrounded by spaces unless they are next to the opening or closing quotes. They are as follows:

  * {newline} - Adds a line break to the text rendered.
  * {charactersheet} - Inserts a clickable image of the character that will open their character sheet.
  * {+} - Adds the values of two objects and outputs the result, i.e. `system.attributes.str {+} system.attributes.wis` will output the character's str and wis added together.
  * {i} & {/i} - Anything between these tags will be displayed in _italics_
  * {b} & {/b} - Anything between these tags will be displayed in **bold**

### Direct-Complex Object

The direct complex object was originally created to show values for attributes but only if they existed. It was originally used for the DND5E Senses display.

A direct complex object has three properties:
* type - The type of object. Currently accepted values are:
    - "exists" - Does the **value** exist or not. If using **exists** it will look for an _OPTIONAL_ property named **else** and if the thing you're checking for doesn't exist, the value of **else** will be parsed. You may leave **else** out if not using it.
    ```json
        {
          "type": "exists",
          "value": "system.attribute.isplayersick",
          "text": "Player is sick with system.attribute.sickness",
          "else": "Healthy for system.attribute.daysSinceSick days"
        },
    ```
    - "match" - Checks for an additional **match** property. If the **value** matches the **match** property, then **text** is processed.
    - "match-all" - Same as match, but the **value** can be an array of properties to match against.
* value - The attribute that you're checking against
* text - The text to be displayed if the **type** check passes. It will be processed in the same manner as the **value** is processed on a standard **direct** column type.

```json
{
  "name": "Senses",
  "type": "direct-complex",
  "header": "hide",
  "text": [
    {
      "type": "exists",
      "value": "system.attributes.senses.darkvision",
      "text": "Darkvision: system.attributes.senses.darkvision"
    },
    {
      "type": "exists",
      "value": "system.attributes.senses.blindsight",
      "text": "Blindsight: system.attributes.senses.blindsight"
    },
    {
      "type": "exists",
      "value": "system.attributes.senses.tremorsense",
      "text": "Tremorsense: system.attributes.senses.tremorsense"
    },
    {
      "type": "exists",
      "value": "system.attributes.senses.truesight",
      "text": "Truesight: system.attributes.senses.truesight"
    },
    {
      "type": "exists",
      "value": "system.attributes.senses.special",
      "text": "Special: system.attributes.senses.special"
    }
  ]
}
```

In this example, the table will contain one column named Senses, but the column name will be hidden (skipped). It will then loop through each item in the **value** field. In this case, it will check each of the dnd5e system senses. If they exist on the character, then the text will be displayed, formatted as a **direct** line, and all appended together at the end. ***Note*** All values that exist will be displayed. You can additionally follow the **text** with **else**, and if the contents of **value** DO NOT exist the value in **else** will be displayed instead.

In this example, the following character only has one sense that exists, so it's the only one displayed:

![Example Sense](doc_images/senses1.png)


Here's an example of how to use **match**:
```json
		{
		 	"name": "Career",
			"align": "center",
			"type": "direct-complex",
			"header": "hide",
			"text": [
				{
					"type": "match",
					"ifdata": "system.general.career",
					"matches": "1",
					"text": "Colonial Marine"
				},
				{
					"type": "match",
					"ifdata": "system.general.career",
					"matches": "2",
					"text": "Career: Colonial Marshall"
				},
				{
					"type": "match",
					"ifdata": "system.general.career",
					"matches": "3",
					"text": "Career: Company Agent"
				},
				{
					"type": "match",
					"ifdata": "system.general.career",
					"matchse": "8",
					"text": "Pilot"
				}
			]
		},
```
In this example, the system will contain a column named Career, but the column name will be hidden. It will then loop through each item in the **text** field. In this system `Alien RPG`, the player's career is a number, stored in `system.general.career`. In this example, if the value in `system.general.career` matches `1` then the text `Colonial Marine` is output, otherwise, if the career matches `2` then the text is `Colonial Marshall`, if `3`, `Company Agent` is output and so on. All values that match will be displayed. Any items where **matches** is the same as the contents of **ifdata** will display the value in **text**. You can additionally follow the **text** with **else**, and if the contents of **ifdata** DO NOT match the value in **matches** the value in **else** will be displayed instead.


## Examples

### Example of array-string-builder:

Code:
```json
{
  "name": "Statuses",
  "type": "array-string-builder",
  "header": "show",
  "text": "statuses => value, "
}, // No comma if last item in the row
```

This example is used to display Active Status Effects on a character, such as burning, bleeding, prone, etc. They are stored by Foundry under the actor as `.statuses`, and the value is an array of strings. To display an array of values with no definite end or number of values or even empty sometimes, array-string-builder is your weapon of choice.

### Extremely Basic File Example
Code:
```json
{
    "name": "Test Person's DND 5E Template",
    "system": "dnd5e",
    "author": "Test Person",
    "rows" : [
        [
            {
                "name": "Name",
                "type": "direct",
                "header": "show",
                "text": "{charactersheet} name {newline} system.details.race"
            }
        ]
    ]
}

// Note that this uses both the charactersheet and newline special keywords.
```
Result:

![Basic Example](doc_images/ex1.png)

## **Notes for Forge Users:**
  * It is best to use native Foundry for testing until you are 100% certain you are happy with your template.
  * Between The Forge's upload system that will not upload a file again if it sees the file already exists, and various browsers caching files, you may find that if you upload a changed .json, the changes will not appear. This is why testing is best on Foundry where you can just save the file, then refresh your client (F5), and changes should be instantaneous. If you can only use Forge then It is highly recommended that multiple edited uploads be a different file name every time, to avoid this issue, until your template is complete.
  * The Forge does not allow read or write access to text based files in the Core Data systems or modules, only images which are read-only. Thus to grab the example .json files use the methods described at the top of this document.

## **Notes for inexperienced template creators:**

  * A JSON friendly editor like VSCode, Notepad++, etc., is highly suggested. They show you with instant feedback if you put or forget a comma where you shouldn't, etc. VSCode is particularly nice and it creates a list of things you type very often, and gives you a box to autocomplete your entries.
  * Many problems are simply with your JSON file. A missed comma there, a comma that shouldn't exist here.
  * If your template fails to appear, then press F12 and check your console logs for errors. The module tries to let you know if there are issues with your JSON, it will be early on in the console, you'll see a list of JSONs loaded, and if they are valid, it will say Loaded vaesen.json - good json.
  * Use JSON Validation extensions for your editor of choice, or sites like https://jsonlint.com/ to validate your JSON.
  * Double check that property values you're using are correct for your selected system.
  * The first great way to do this, is to click the debugger for the module on. Then when the party sheet is rendered, you can go into the console and you will see a list of Actors. Clicking the side arrow down will show the name so you can narrow down whichever actor/actors are acting up. Opening the entire entry will show all the values for that Actor.
  * Another way is to install Illandril's Token Tooltips. Place some actors on the scene, off to the left side. Then go in to Configure Settings > Illandril's Token Tooltips > Configure Tooltip Values. At the bottom left is a button that says "Enable Data Key Debugger." Once clicked you can hover over a token, and all the values in that token will be displayed. You can ignore all the ones about prototype.token, and look for system.attributes.whatever/system.abilities.whatever, etc.
  * At the very bottom is type, and you only want to show PC's, so check to see if type is character. You may want to drag some tokens like vehicles, animals and monsters onto the scene so you can see what their type is listed as, and exclude that type using the offline_excludes array detailed above.

## **Other Notes:**

  * Module Conflicts:
    - Arius Planeswalker's Stylish Journal for Monk's Enhanced Journal - changes the CSS so dramatically that tables will not render correctly.
    - An issue with MAD Cartographer map modules. Due to sloppy data on the part of those at The MAD Cartographer, some of their modules have the `type` set to character for map actor tokens. These will show up in your player sheet, and you have to manually hide them. It varies from module to module. Deserts is one, luckily you only have to hide 4 actors by using the [Configure Hidden Actors] button, or doing it in settings.
    - dnd5e system v3.0.0: sounds are unavaible currently due to the massive system overhaul breaking Dynamic Active Efects and thus MidiQoL. TotM will not render a table properly in v3.0.0 if Dynamic Active Effects is active. The author has recently made them unavailable in v3.0.0, but has not mentioned any timeline for making these modules compatible with 3.0.0.
  * CSS:
    - Some system developers are bound and determined to change everything about default Foundry css just because they can (I'm looking at you, Free League Publishing), so while every effort has been made to make the tables look the same between systems, you may see some that are quite different (I'm looking at you, Vaesen).
    - That said, the module can only accommodate some minimal alignment and visual improvements. To try and override every system out there would be impossible. There is no intention to allow more than minwidth/maxwidth, align and valign.

## **Still not sure where to start? _Look no further!_**
  * First jot down the values you think you want to display from one of your character's character sheets.
  * Decide if you want one row, or need 2 because you have a lot of information to display. Or do both!
  * Choose one of the following .json examples, and make sure you have the name you want displayed, the exact name of your system, and your name added.
  * Open your editor of choice and paste the example into it. You've created your first template!
  * Save it in the proper [totm] folder as described at the top of this document.
  * Enable the module, and refresh.
  * In the module settings, turn on the debugger and turn off show only online players.
  * Now, when you click the Party Sheet icon in your token controls, you will get a thin table with the characters in the system and their clickable Actor Portraits, and their name.
  * Open the console, and scroll for the listings that say "SystemActor" beneath a line that says "These are all the actors in your game. They have not yet been filtered based on your inclusions/exclusions." It has a header "TOTM DEBUG CHARACTER LIST." Click the arrow to open an Actor, then click the arrow to open system. Most of your values will be here. Some good detective work will help you find the values you want. Remember that you will have to assemble them, starting with system, then, for instance, attributes, then the name of the attribute, ending up with "system.attribute.str" as a typical example.
  * Start adding them to further columns, and you'll be done in no time if you've read these instructions thoroughly.

One row:

```json
{
    "name": "Some System - 1 Row",
    "system": "some-system",
    "author": "Your Name Here",
    "offline_excludes": [
        "npc",
        "base"
    ],
    "rows": [
        [
            {
                "name": "Character Sheet",
                "type": "charactersheet",
                "align": "center",
                "header": "hide",
                "text": ""
            },
            {
                "name": "Name",
                "type": "direct",
                "align": "center",
                "header": "show",
                "text": "name"
            }
        ]
    ]
}
```

Two Rows:
```json
{
    "name": "Some System - Two Rows",
    "system": "some-system",
    "author": "Your Name Here",
    "offline_excludes": [
        "npc",
        "base"
    ],
    "rows": [
        [
            {
                "name": "Character Sheet",
                "type": "charactersheet",
                "align": "center",
                "header": "hide",
                "text": ""
            },
            {
                "name": "Name",
                "type": "direct",
                "align": "center",
                "header": "show",
                "text": "name"
            }
        ],
        [
            {
                "name": ".",
                "type": "direct",
                "header": "hide",
                "text": ""
            },
            {
                "name": "..",
                "type": "direct",
                "header": "hide",
                "text": ""
            }
        ]
    ]
}
```
