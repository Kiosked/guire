const chalk = require("chalk");
const Webdriver = require("selenium-webdriver");

const NOOP = function() {};

function logTest(name) {
    console.log(`  ${chalk.underline.white(name)}`);
}

function logTestComponent(name, componentName) {
    console.log(`    ${chalk.bold.gray(name)} : ${chalk.cyan(componentName)}`);
}

function testComponent(targetName, component, webdriver) {
    logTestComponent(targetName, component.name);
    return webdriver.executeAsyncScript(component.setupFn || NOOP)
        .then(function() {

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

module.exports = function runForge(target) {
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
                componentTests = componentTests.then(() => testComponent(target.name, component, webdriver));
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
