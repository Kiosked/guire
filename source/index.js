const chalk = require("chalk");
const path = require("path");

const argv = require("minimist")(process.argv.slice(2));
const package = require("../package.json");
const root = path.resolve(__dirname + "/..");

const runForge = require("./runner.js");

let targetConfigs = argv._ || [];
if (!Array.isArray(targetConfigs)) {
    targetConfigs = [targetConfigs];
}

let chain = Promise.resolve();

// Init
console.log(`${chalk.bgBlue.white(" PixelForge ")} v${package.version}`);

// Resolve targets
targetConfigs = targetConfigs
    .map((filename) => path.join(root, path.relative(root, filename)))
    .map((configFilename) => require(configFilename));
let targets = [];
targetConfigs.forEach(function(config) {
    // Handle configs that specify an array rather than a single config object
    if (Array.isArray(config)) {
        config.forEach(function(c) {
            targets.push(c);
        });
    } else {
        targets.push(config);
    }
});

targets.forEach(function(target) {
    chain = chain.then(() => {
        return runForge(target);
    });
});

return chain.then(function() {
    console.log("Finished.");
});
