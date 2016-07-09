const path = require("path");
const fs = require("fs");

const reportResourcePath = path.resolve(path.join(__dirname, "../resources/report.html"));

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
