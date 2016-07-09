const path = require("path");

const chalk = require("chalk");
const mkdir = require("mkdir-p");
const argv = require("minimist")(process.argv.slice(2));
const package = require("../package.json");
const root = path.resolve(__dirname + "/..");

const runForge = require("./runner.js");

// Config
const cwd = process.cwd();
let reportDir = argv["report-dir"] ?
    path.resolve(path.join(cwd, argv["report-dir"])) :
    path.join(cwd, "guire", "report");
let referenceDir = argv["reference-dir"] ?
    path.resolve(path.join(cwd, argv["reference-dir"])) :
    path.join(cwd, "guire", "reference");

let targetConfigs = argv._ || [];
if (!Array.isArray(targetConfigs)) {
    targetConfigs = [targetConfigs];
}

let chain = Promise.resolve();

// Init
console.log(`${chalk.bgBlue.white(" GUIRE ")} v${package.version}`);

// Directories
mkdir(reportDir);
mkdir(referenceDir);

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
        return runForge(target, {
            referenceDir,
            reportDir
        });
    });
});

return chain.then(function() {
    console.log("Finished.");
});
