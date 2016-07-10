# GUIRE

GUIRE - Graphical User Interface Regression Engine - Is a testing framework for user interface components. GUIRE helps detect changes that occur in the browser - from a single pixel or colour unit to entire component breakages.

## Usage

GUIRE is a command-line application who's usage looks like:

```sh
guire <suite-path...>
```

Each test suite must be a JavaScript file who's configuration is [described here](TEST_SUITE.md).

## Developing

Run `npm install` to get started. Execute the example by running `npm run example`.

## Contributing

We greatly appreciate contributions, but please respect the format of the codebase. Follow by example where possible, and run the linter if you're unsure. GUIRE is a 4-space-indentation, semicolon-required and [XO](https://www.npmjs.com/package/xo)-linted project.

Using an editor which supports the included `.editorconfig` and XO configuration (in `package.json`) is advised.

## Testing

Simply run `npm test` to make sure everything is OK.
