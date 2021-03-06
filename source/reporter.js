const path = require("path");
const fs = require("fs");
const exec = require("child_process").exec;

const fileExists = require("file-exists");

const pdfExecPath = path.resolve(path.join(__dirname, "../node_modules/.bin/electron-pdf"));
const reportResourcePath = path.resolve(path.join(__dirname, "../resources/report.html"));

function base64EncodeImageFile(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString("base64");
}

function convertImageToCSSData(file) {
    let base64 = base64EncodeImageFile(file);
    return `data:image/png;base64,${base64}`;
}

function displayStatus(status) {
    let symbol,
        colour;
    switch (status) {
        case "different":
            symbol = "✘";
            colour = "#FD2222";
            break;
        case "identical":
            symbol = "✔";
            colour = "#28D422";
            break;
        case "new":
            /* falls through */
        default:
            symbol = "★";
            colour = "#2791FB";
            break;
    }
    return `<span style="color: ${colour}">${htmlEncode(symbol)} ${ucfirst(status)}`;
}

function getImageDivHTML(imageFilename) {
    if (fileExists(imageFilename)) {
        let imageCSSVal = convertImageToCSSData(imageFilename);
        let width = 250,
            scale = width / 1024,
            height = 768 * scale;
        return `<div style="border: 1px #000 dotted; width:${width + 2}px; height:${height + 2}px"><img src="${imageCSSVal}" style="width:${width}px; height:${height}px" /></div>`;
    }
    return `<div><i>No difference</i></div>`;
}

function htmlEncode(string) {
    var retVal = "";
    for (var i = 0; i < string.length; i += 1) {
        if (string.codePointAt(i) > 127) {
            retVal += `&#${string.codePointAt(i)};`;
        } else {
            retVal += string.charAt(i);
        }
    }
    return retVal;
}

function ucfirst(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
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
                                    <td>${displayStatus(componentResult.result)}</td>
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
    },

    generatePDF: function(inputHTMLFile, outputFilename) {
        return new Promise(function(resolve, reject) {
            exec(
                `${pdfExecPath} ${inputHTMLFile} ${outputFilename}`,
                function(error) {
                    if (error) {
                        reject(error);
                    } else {
                        (resolve)();
                    }
                }
            );
        });
    }

};
