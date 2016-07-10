const path = require("path");
const fs = require("fs");

const reportResourcePath = path.resolve(path.join(__dirname, "../resources/report.html"));

function base64EncodeImageFile(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString("base64");
}

function convertImageToCSSData(file) {
    let base64 = base64EncodeImageFile(file);
    return `url(data:image/png;base64,${base64})`;
}

function getImageDivHTML(imageFilename) {
    let imageCSSVal = convertImageToCSSData(imageFilename);
    let width = 250,
        scale = width / 1024,
        height = 768 * scale;
    return `<div style="border: 1px #000 dotted;background-image: ${imageCSSVal}; width:${width}px; height:${height}px; background-size:${width}px ${height}px"></div>`;
}

module.exports = {

    createReport: function(title, results) {
        let reportHTML = fs.readFileSync(reportResourcePath, "utf8");
        reportHTML = reportHTML.replace("[TITLE]", title);
        let items = results
            .map(function(result) {
                let componentsHTML = result.components
                    .map(function(componentResult) {
                        return `
                            <h4>${componentResult.componentName}</h4>
                            <table class="table">
                                <tr>
                                    <th scope="row">ID</th>
                                    <td>${componentResult.id}</td>
                                </tr>
                                <tr>
                                    <th scope="row">Status</th>
                                    <td>${componentResult.result}</td>
                                </tr>
                                <tr>
                                    <th scope="row">Reference</th>
                                    <td>${getImageDivHTML(componentResult.images.ref)}</td>
                                </tr>
                                <tr>
                                    <th scope="row">Test</th>
                                    <td>${getImageDivHTML(componentResult.images.test)}</td>
                                </tr>
                                <tr>
                                    <th scope="row">Difference</th>
                                    <td>${getImageDivHTML(componentResult.images.diff)}</td>
                                </tr>
                            </table>
                            `;
                    })
                    .join("\n");
                return `
                    <h3>${result.targetName}</h3>
                    ${componentsHTML}`;
            })
            .join("\n");
        reportHTML = reportHTML.replace("[COMPONENTS]", items);
        return reportHTML;
    }

};
