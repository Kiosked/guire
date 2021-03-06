const path = require("path");

const fs = require("fs-extra");
const mkdir = require("mkdir-p");
const fileExists = require("file-exists");
const chalk = require("chalk");
const imageDiff = require("image-diff");
const prompt = require("select-prompt");

const Webdriver = require("selenium-webdriver");
const WebdriverChrome = require("selenium-webdriver/chrome");
const chromePath = require("chromedriver").path;

const tools = require("./tools.js");

const IMAGE_DIFFER = "different";
const IMAGE_SAME = "identical";
const IMAGE_CREATED = "new";

const NOOP = function(done) {
    done();
};

const PROMPT_DIFFERENT = [
    { title: "Skip", value: "skip" },
    { title: "Save as new reference", value: "save" }
];

// BEGIN init webdriver
let service = new WebdriverChrome.ServiceBuilder(chromePath).build();
WebdriverChrome.setDefaultService(service);
// END init webdriver

function logTest(name) {
    console.log(`  ${chalk.underline.white(name)}`);
}

function logTestComponent(name, componentName) {
    process.stdout.write(`    ${chalk.bold.gray(name)} : ${chalk.cyan(componentName)} `);
}

function testComponent(targetName, component, config, webdriver) {
    let id = tools.createTestID(targetName, component.name),
        shotFilename = `${id}.png`,
        shotDiffFilename = `${id}.diff.png`,
        shotsDir = path.join(config.reportDir, "shots"),
        referenceShot = path.join(config.referenceDir, shotFilename),
        testingShot = path.join(shotsDir, shotFilename),
        testingShotDiff = path.join(shotsDir, shotDiffFilename);
    let reportObj = {
        id,
        componentName: component.name,
        targetName,
        result: null,
        images: {}
    };
    mkdir(shotsDir);
    logTestComponent(targetName, component.name);
    return webdriver.executeAsyncScript(component.setupFn || NOOP)
        .then(function() {
            return webdriver.takeScreenshot().then(function(data) {
                fs.writeFileSync(
                    testingShot,
                    data,
                    "base64"
                );
            });
        })
        .then(function() {
            // compare
            if (fileExists(referenceShot)) {
                return new Promise(function(resolve, reject) {
                    imageDiff({
                        actualImage: testingShot,
                        expectedImage: referenceShot,
                        diffImage: testingShotDiff
                    }, function(err, imagesAreSame) {
                        if (err) {
                            (reject)(err);
                        } else {
                            (resolve)(imagesAreSame ? IMAGE_SAME : IMAGE_DIFFER);
                        }
                    });
                });
            }
            fs.copySync(testingShot, referenceShot);
            return IMAGE_CREATED;
        })
        .then(function(imageStatus) {
            // save images
            reportObj.images.ref = referenceShot;
            reportObj.images.test = testingShot;
            reportObj.images.diff = testingShotDiff;
            // report
            if (imageStatus === IMAGE_SAME) {
                console.log(chalk.green("✔ OK"));
            } else if (imageStatus === IMAGE_DIFFER) {
                console.log(chalk.red("✘ Failed"));
            } else if (imageStatus === IMAGE_CREATED) {
                console.log(chalk.blue("★ New"));
            }
            reportObj.result = imageStatus;
            if (config.audit) {
                return new Promise(function(resolve) {
                    prompt("Select action:", PROMPT_DIFFERENT)
                        .on("abort", function() {
                            (resolve)(reportObj);
                        })
                        .on("submit", function(value) {
                            if (value === "save") {
                                fs.copySync(testingShot, referenceShot);
                            }
                            (resolve)(reportObj);
                        });
                });
            }
            return reportObj;
        });
}

function waitForPageReady(webdriver, target) {
    let readyFn = target.waitForEl ?
        `return !!document.querySelector("${target.waitForEl}");` :
        function() {
            return document.readyState === "complete";
        };
    let checkReady = () => webdriver.executeScript(readyFn),
        waitAndCheck = function(done) {
            setTimeout(function() {
                checkReady()
                    .then(function(ready) {
                        if (ready) {
                            (done)();
                            // setTimeout(done, 100);
                        } else {
                            waitAndCheck(done);
                        }
                    });
            }, 250);
        };
    return new Promise((resolve) => waitAndCheck(resolve));
}

module.exports = function runForge(target, config) {
    let webdriver,
        reportObj = {
            targetName: target.name,
            components: [],
            allPassed: true
        };
    logTest(target.name);
    return Promise.resolve()
        .then(function() {
            let webdriverCapabilities = Webdriver.Capabilities.chrome();
            webdriverCapabilities.set("chromeOptions", {
                args: ["--allow-file-access-from-files"]
            });
            webdriver = (new Webdriver.Builder())
                .withCapabilities(webdriverCapabilities)
                .build();
            return Promise.all([
                webdriver.manage().timeouts().setScriptTimeout(10000),
                webdriver.manage().window().setSize(1024, 768)
            ]);
        })
        .then(() => webdriver.get(target.url))
        .then(() => waitForPageReady(webdriver, target))
        .then(function() {
            // setup and execution
            return webdriver.executeAsyncScript(target.setupFn || NOOP);
        })
        .then(function() {
            let componentTests = Promise.resolve();
            target.components.forEach(function(component) {
                componentTests = componentTests
                    .then(() => testComponent(target.name, component, config, webdriver))
                    .then((result) => {
                        reportObj.components.push(result);
                        if (result.result === IMAGE_DIFFER) {
                            reportObj.allPassed = false;
                        }
                    });
            });
            return componentTests;
        })
        .then(function() {
            // cleanup
            webdriver.quit();
            return reportObj;
        })
        .catch(function(err) {
            setTimeout(function() {
                throw err;
            });
        });
};
