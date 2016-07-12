# GUIRE

[![Build Status](https://travis-ci.org/Kiosked/guire.svg?branch=master)](https://travis-ci.org/Kiosked/guire) [![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

GUIRE - Graphical User Interface Regression Engine - Is a testing framework for user interface components. GUIRE helps detect changes that occur in the browser - from a single pixel or colour unit to entire component breakages.

## Usage

GUIRE is a command-line application who's usage looks like:

```sh
guire <suite-path...>
    --report-dir [report-directory]
    --reference-dir [reference-directory]
    --audit
    --pdf
```

| Argument            | Description                                                         |
|---------------------|---------------------------------------------------------------------|
| --report-dir        | Set the report directory for output of all reporting and results    |
| --reference-dir     | Set the reference directory for storage of comparison (control) images |
| --title             | Set the title in the report                                         |
| --audit             | Enter [audit mode](###auditing)                                     |
| --pdf               | Enable PDF output for reporting                                     |

Each test suite must be a JavaScript file who's configuration is [described here](TEST_SUITE.md).

### Auditing

Auditing can be performed when differences are detected, allowing users to update reference shots with newly-taken shots.

Enter audit mode by providing the `--audit` argument - prompts for each failing component will appear so that the user can make the decision to either **save** the screenshot as the new reference, or simply skip it and move on to the next one.

## Developing

Run `npm install` to get started. Execute the example by running `npm run example`.

## Contributing

We greatly appreciate contributions, but please respect the format of the codebase. Follow by example where possible, and run the linter if you're unsure. GUIRE is a 4-space-indentation, semicolon-required and [XO](https://www.npmjs.com/package/xo)-linted project.

Using an editor which supports the included `.editorconfig` and XO configuration (in `package.json`) is advised.

## Testing

Simply run `npm test` to make sure everything is OK.
