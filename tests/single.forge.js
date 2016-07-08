const path = require("path");

const testURL = path.resolve(path.join(__dirname, "single.forge/index.html"));

module.exports = {
    name: "single-test",
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
            name: "square-box",
            setupFn: function(done) {
                document.getElementById("box1").style.display = "block";
                done();
            }
        }
    ]
};
