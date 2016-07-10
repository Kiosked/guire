# Test Suite

A GUIRE test suite exports a config like so:

```js
let testURL = "/home/user/project-x/tests/example/index.html";

module.exports = {
    name: "test-name",
    url: `file://${testURL}`,
    waitForEl: "#capture",
    setupFn: function(done) {
        Array.prototype.slice.call(document.querySelectorAll("div.box")).forEach(function(boxEl) {
            boxEl.style.display = "none";
        });
        done();
    },
    components: [
        {
            name: "component-test-1",
            setupFn: function(done) {
                document.getElementById("box1").style.display = "block";
                done();
            }
        }
    ]
};
```

The exported configuration object makes up the **test suite**, which contains **component tests**.

## Test suite options

| Option       | Type     | Requirement | Description                                     |
|--------------|----------|-------------|-------------------------------------------------|
| name         | string   | Required    | The name of the suite                           |
| url          | string   | Required    | The URL to the test page where the components are displayed |
| waitForEl    | string   | _Optional_  | CSS selector to check before starting (must return an element) |
| setupFn      | Function | _Optional_  | Function to setup the page before running tests ([special](###special-functions)) |
| components   | Array    | Required    | Array of [components](###component-options) to test |

### Component options

| Option       | Type     | Requirement | Description                                     |
|--------------|----------|-------------|-------------------------------------------------|
| name         | string   | Required    | The name of the component test                  |
| setupFn      | Function | _Optional_  | Function to setup the component before testing ([special](###special-functions)) |

### Special functions

Some functions in the config are stringified and executed by Webdriver in the context of the testing page. These functions do not have access to variables defined in the closures around it.

Special functions operate in an asynchronous nature and are passed a `done` function as their only parameter. The functions are not treated as completed until the `done` callback is called.
