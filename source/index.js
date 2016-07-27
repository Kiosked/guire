#!/usr/bin/env node

const path = require("path");
const fs = require("fs");

const chalk = require("chalk");
const mkdir = require("mkdir-p");
const minimist = require("minimist");

const root = path.resolve(path.join(__dirname, "/.."));
const pkg = require("../package.json");

const runForge = require("./runner.js");
const reporter = require("./reporter.js");

// Config
const cwd = process.cwd();
const argv = minimist(process.argv.slice(2));
const title = argv.title || "GUIRE";
let reportDir = argv["report-dir"] ?
    path.resolve(path.join(cwd, argv["report-dir"])) :
    path.join(cwd, "guire", "report");
let referenceDir = argv["reference-dir"] ?
    path.resolve(path.join(cwd, argv["reference-dir"])) :
    path.join(cwd, "guire", "reference");
let audit = argv.audit === true;
let outputPDF = argv.pdf === true;
let exitAsPass = true;

let targetConfigs = argv._ || [];
if (!Array.isArray(targetConfigs)) {
    targetConfigs = [targetConfigs];
}

let chain = Promise.resolve(),
    reportObjects = [];

// Init
console.log(`${chalk.bgBlue.white(" GUIRE ")} v${pkg.version}`);

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
    chain = chain
        .then(() => {
            return runForge(target, {
                referenceDir,
                reportDir,
                audit
            });
        })
        .then(function(report) {
            reportObjects.push(report);
            if (!report.allPassed) {
                exitAsPass = false;
            }
        });
});

return chain
    .then(function() {
        return reporter.createReport(title, reportObjects);
    })
    .then(function(reportHTML) {
        let reportHTMLPath = path.join(reportDir, "report.html"),
            reportPDFPath = path.join(reportDir, "report.pdf");
        fs.writeFileSync(
            reportHTMLPath,
            reportHTML,
            "utf8"
        );
        if (outputPDF) {
            return reporter.generatePDF(reportHTMLPath, reportPDFPath);
        }
    })
    .then(function() {
        console.log("Finished.");
        setTimeout(function() {
            if (!exitAsPass) {
                let exitCode = (audit) ? 0 : 1;
                process.exit(exitCode);
            } else {
                process.exit(0);
            }
        }, 600);
    })
    .catch(function(err) {
        console.error("Runner failed");
        setTimeout(function() {
            throw err;
        }, 0);
    });
