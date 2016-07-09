const sha256 = require("sha256");

module.exports = {

    createTestID: function(parentName, testName) {
        return sha256(parentName + "_" + testName);
    }

};
