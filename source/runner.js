const fs = require("fs-extra");
const path = require("path");

const mkdir = require("mkdir-p");
const fileExists = require("file-exists");
const chalk = require("chalk");
const Webdriver = require("selenium-webdriver");
const imageDiff = require("image-diff");

const tools = require("./tools.js");

const IMAGE_DIFFER = 100;
const IMAGE_SAME = 101;
const IMAGE_CREATED = 102;
const NOOP = function() {};

function logTest(name) {
    console.log(`  ${chalk.underline.white(name)}`);
}

function logTestComponent(name, componentName) {
    process.stdout.write(`    ${chalk.bold.gray(name)} : ${chalk.cyan(componentName)} `);
}

function testComponent(targetName, component, config, webdriver) {
    let id = tools.createTestID(targetName, component.name),
        shotFilename = id + ".png",
        shotDiffFilename = id + ".diff.png",
        shotsDir = path.join(config.reportDir, "shots"),
        referenceShot = path.join(config.referenceDir, shotFilename),
        testingShot = path.join(shotsDir, shotFilename),
        testingShotDiff = path.join(shotsDir, shotDiffFilename);
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
                        diffImage: testingShotDiff,
                    }, function(err, imagesAreSame) {
                        if (err) {
                            (reject)(err);
                        } else {
                            (resolve)(imagesAreSame ? IMAGE_SAME : IMAGE_DIFFER);
                        }
                    });
                });
            } else {
                fs.copySync(testingShot, referenceShot);
                return IMAGE_CREATED;
            }
        })
        .then(function(imagesAreSame) {
            if (imagesAreSame === IMAGE_SAME) {
                console.log(chalk.green("✔ OK"));
            } else if (imagesAreSame === IMAGE_DIFFER) {
                console.log(chalk.red("✘ Failed"));
            } else if (imagesAreSame === IMAGE_CREATED) {
                console.log(chalk.blue("★ New"));
            }
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
                            //setTimeout(done, 100);
                        } else {
                            waitAndCheck(done);
                        }
                    });
            }, 250);
        }
    return new Promise((resolve) => waitAndCheck(resolve));
}

module.exports = function runForge(target, config) {
    let webdriver;
    logTest(target.name);
    return Promise.resolve()
        .then(function() {
            let webdriverCapabilities = { browserName: "chrome" };
            webdriverCapabilities = Webdriver.Capabilities.chrome();
            webdriverCapabilities.set('chromeOptions', {
                'args': ["--allow-file-access-from-files"]
            });
            webdriver = (new Webdriver.Builder())
                .withCapabilities(webdriverCapabilities)
                .build();
            webdriver.manage().window().setSize(1024, 768);
            webdriver.get(target.url);
        })
        .then(() => waitForPageReady(webdriver, target))
        .then(function() {
            // setup and execution
            return webdriver.executeAsyncScript(target.setupFn || NOOP);
        })
        .then(function() {
            let componentTests = Promise.resolve();
            target.components.forEach(function(component) {
                componentTests = componentTests
                    .then(() => testComponent(target.name, component, config, webdriver));
            });
            return componentTests;
        })
        .then(function() {
            // cleanup
            webdriver.quit();
        })
        .catch(function(err) {
            setTimeout(function() {
                throw err;
            });
        });
};